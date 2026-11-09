#!/usr/bin/env node
/**
 * Compare three decoded audio windows with a reference PCM WAV.
 * Positive delay means the export plays the same waveform later.
 * No audio/video output is created; the only output file is a new JSON report.
 * This audits sampled waveform timing, not listening quality or the entire film.
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const RATE = 48000;
const COARSE_FACTOR = 12; // 4 kHz block-mean coarse search.
const MAX_PCM_BUFFER = 8 * 1024 * 1024;
const HELP = [
  'Usage: node audit-audio-sync.mjs <reference.wav> <export-video> --report <new.json>',
  '  --ffmpeg <executable>       default: ffmpeg on PATH',
  '  --ffprobe <executable>      default: ffprobe on PATH',
  '  --fps <number>             default: 30 (reporting only)',
  '  --tolerance-ms <number>    default: 1',
  '  --max-lag-ms <number>      default: 250; range: 5..1000',
  '  --window-sec <number>      default: 2; range: 0.5..4',
  '  --min-correlation <number> default: 0.85; range: 0.5..1',
  '  --min-rms-db <number>      default: -65; range: -120..0',
  '  --timeout-ms <number>      default: 15000 per child; range: 1000..120000',
  'Exit: 0 pass, 1 timing failure, 2 inconclusive, 64 usage/tool/I/O error.',
  'Reports are never overwritten. No retiming, delay, padding, or media generation is performed.'
].join('\n');

export function parseArgs(argv) {
  const cfg = {ffmpeg:'ffmpeg',ffprobe:'ffprobe',fps:30,toleranceMs:1,maxLagMs:250,
    windowSec:2,minCorrelation:0.85,minRmsDb:-65,timeoutMs:15000};
  const options = {'--report':'report','--ffmpeg':'ffmpeg','--ffprobe':'ffprobe',
    '--fps':'fps','--tolerance-ms':'toleranceMs','--max-lag-ms':'maxLagMs',
    '--window-sec':'windowSec','--min-correlation':'minCorrelation',
    '--min-rms-db':'minRmsDb','--timeout-ms':'timeoutMs'};
  const positional = [];
  const seen = new Set();
  for (let i=0;i<argv.length;i++) {
    const a=argv[i];
    if (a==='--help' || a==='-h') return {help:true};
    if (a.startsWith('--')) {
      if (!(a in options)) throw new Error('Unknown option: '+a);
      if (seen.has(a)) throw new Error('Duplicate option: '+a);
      seen.add(a);
      if (i+1>=argv.length || argv[i+1].startsWith('--')) throw new Error('Missing value: '+a);
      const key=options[a], value=argv[++i];
      cfg[key]=['report','ffmpeg','ffprobe'].includes(key)?value:Number(value);
    } else positional.push(a);
  }
  if (positional.length!==2 || !cfg.report) throw new Error('Two input paths and --report are required.\n'+HELP);
  Object.assign(cfg,{reference:path.resolve(positional[0]),video:path.resolve(positional[1]),report:path.resolve(cfg.report)});
  const ranges={fps:[1,240],toleranceMs:[0,1000],maxLagMs:[5,1000],
    windowSec:[0.5,4],minCorrelation:[0.5,1],minRmsDb:[-120,0],timeoutMs:[1000,120000]};
  for (const [key,[lo,hi]] of Object.entries(ranges))
    if (!Number.isFinite(cfg[key]) || cfg[key]<lo || cfg[key]>hi) throw new Error('Invalid '+key+'; expected '+lo+'..'+hi);
  if (cfg.reference===cfg.video) throw new Error('Reference and export must be different files.');
  return cfg;
}

function runBounded(executable,args,config,log,maxBuffer=1024*1024) {
  const started=Date.now();
  const r=spawnSync(executable,args,{encoding:null,timeout:config.timeoutMs,maxBuffer,
    windowsHide:true,killSignal:'SIGKILL',stdio:['ignore','pipe','pipe']});
  const entry={executable,args,timeoutMs:config.timeoutMs,maxBufferBytes:maxBuffer,
    elapsedMs:Date.now()-started,exitCode:r.status,signal:r.signal,
    stdoutBytes:r.stdout?.length??0,stderrBytes:r.stderr?.length??0};
  if(r.error) entry.error={code:r.error.code??null,message:r.error.message};
  if(r.stderr?.length) entry.stderr=r.stderr.toString('utf8').slice(-2000);
  log.push(entry);
  if(r.error || r.status!==0) throw new Error('Tool failed: '+executable+'; '+
    (r.error?.message??('exit '+r.status))+'; '+(entry.stderr??''));
  return r.stdout;
}

function probe(input,config,log) {
  const args=['-v','error','-show_entries',
    'format=start_time,duration:stream=index,codec_type,codec_name,sample_rate,channels,start_time,duration,time_base,start_pts,duration_ts,avg_frame_rate',
    '-of','json',input];
  const info=JSON.parse(runBounded(config.ffprobe,args,config,log).toString('utf8'));
  const audio=info.streams?.find(s=>s.codec_type==='audio');
  if(!audio) throw new Error('No audio stream: '+input);
  return {format:info.format??{},streams:info.streams??[],selectedAudio:audio};
}
function durationOf(stream,format) {
  const direct=Number(stream.duration);
  if(Number.isFinite(direct)&&direct>0) return direct;
  const [n,d]=String(stream.time_base??'').split('/').map(Number);
  const ticks=Number(stream.duration_ts);
  if(Number.isFinite(ticks)&&n>0&&d>0&&ticks>0) return ticks*n/d;
  const fallback=Number(format.duration);
  return Number.isFinite(fallback)&&fallback>0?fallback:null;
}
function decode(input,startSample,sampleCount,config,log) {
  // Output-side -ss discards decoded timestamps up to the same media-time window.
  // Never use adelay/apad/atempo/asetrate or repair timestamps here.
  const duration=sampleCount/RATE;
  const maxBuffer=Math.min(MAX_PCM_BUFFER,Math.ceil(sampleCount*4*1.02)+65536);
  if(sampleCount*4+4>MAX_PCM_BUFFER) throw new Error('Decode window exceeds the PCM memory cap.');
  const args=['-nostdin','-hide_banner','-v','error','-i',input,
    '-ss',(startSample/RATE).toFixed(10),'-t',duration.toFixed(10),
    '-map','0:a:0','-vn','-sn','-dn','-ac','1','-ar',String(RATE),
    '-c:a','pcm_f32le','-f','f32le','pipe:1'];
  const bytes=runBounded(config.ffmpeg,args,config,log,maxBuffer);
  if(bytes.length%4) throw new Error('Decoded PCM byte count is not divisible by four.');
  const signal=new Float32Array(bytes.length/4);
  for(let i=0;i<signal.length;i++) signal[i]=bytes.readFloatLE(i*4);
  if(signal.length>sampleCount+2) throw new Error('Decoder exceeded requested bounded window.');
  return signal;
}

export function stats(signal) {
  let sum=0, squares=0;
  for(const v of signal) { if(!Number.isFinite(v)) return {valid:false}; sum+=v;squares+=v*v; }
  if(!signal.length) return {valid:false};
  const centered=Math.max(0,squares-sum*sum/signal.length);
  const db=x=>x>0?20*Math.log10(x):-Infinity;
  return {valid:true,count:signal.length,sum,squares,centered,
    rmsDbFs:db(Math.sqrt(squares/signal.length)),
    acRmsDbFs:db(Math.sqrt(centered/signal.length))};
}
function blockMean(signal,factor) {
  const out=new Float32Array(Math.floor(signal.length/factor));
  for(let i=0;i<out.length;i++) {let v=0;for(let j=0;j<factor;j++) v+=signal[i*factor+j];out[i]=v/factor;}
  return out;
}

/** Pearson correlation. y[base + i + lag] matches x[i]; positive lag = y is later. */
export function searchCorrelation(x,y,base,minLag,maxLag,exclusionSamples=0) {
  const sx=stats(x);
  if(!sx.valid || sx.centered<=1e-20) return null;
  const sum=new Float64Array(y.length+1),sq=new Float64Array(y.length+1);
  for(let i=0;i<y.length;i++) {if(!Number.isFinite(y[i]))return null;sum[i+1]=sum[i]+y[i];sq[i+1]=sq[i]+y[i]*y[i];}
  const scores=[];
  let best=null;
  for(let lag=minLag;lag<=maxLag;lag++) {
    const offset=base+lag;
    if(offset<0 || offset+x.length>y.length) continue;
    const sy=sum[offset+x.length]-sum[offset],sy2=sq[offset+x.length]-sq[offset];
    const vy=Math.max(0,sy2-sy*sy/x.length);
    if(vy<=1e-20) continue;
    let dot=0;
    for(let i=0;i<x.length;i++) dot+=x[i]*y[offset+i];
    const correlation=Math.max(-1,Math.min(1,(dot-sx.sum*sy/x.length)/Math.sqrt(sx.centered*vy)));
    const item={lag,correlation,exportAcRmsDbFs:20*Math.log10(Math.sqrt(vy/x.length))};
    scores.push(item);
    if(!best || correlation>best.correlation) best=item;
  }
  if(!best) return null;
  let runner=null;
  for(const item of scores) if(Math.abs(item.lag-best.lag)>exclusionSamples &&
    (!runner || item.correlation>runner.correlation)) runner=item;
  return {...best,runnerUp:runner,peakSeparation:runner?best.correlation-runner.correlation:null,
    testedLags:scores.length,searchMinLag:minLag,searchMaxLag:maxLag};
}

export function estimateWindow(reference,exportSearch,marginSamples,maxLagSamples,config) {
  const warnings=[];
  const referenceStats=stats(reference);
  if(!referenceStats.valid || referenceStats.acRmsDbFs<config.minRmsDb)
    return {status:'inconclusive',reasons:['reference_low_energy_or_invalid'],referenceStats};
  const coarseReference=blockMean(reference,COARSE_FACTOR);
  const coarseExport=blockMean(exportSearch,COARSE_FACTOR);
  const coarseLimit=Math.ceil(maxLagSamples/COARSE_FACTOR);
  const coarse=searchCorrelation(coarseReference,coarseExport,marginSamples/COARSE_FACTOR,
    -coarseLimit,coarseLimit,Math.ceil(0.010*RATE/COARSE_FACTOR));
  if(!coarse) return {status:'inconclusive',reasons:['no_coarse_correlation'],referenceStats};
  // Refine only +/- 1 ms around the 4 kHz winner, not thousands of 48 kHz lags.
  const center=coarse.lag*COARSE_FACTOR, radius=Math.ceil(RATE*0.001);
  const minLag=Math.max(-maxLagSamples,center-radius),maxLag=Math.min(maxLagSamples,center+radius);
  const fine=searchCorrelation(reference,exportSearch,marginSamples,minLag,maxLag);
  if(!fine) return {status:'inconclusive',reasons:['no_fine_correlation'],referenceStats,coarse};
  if(fine.correlation<config.minCorrelation) warnings.push('low_correlation');
  if(fine.exportAcRmsDbFs<config.minRmsDb) warnings.push('export_low_energy');
  if(Math.abs(coarse.lag)>=coarseLimit-1 || Math.abs(fine.lag)>=maxLagSamples)
    warnings.push('peak_at_global_search_boundary');
  if(fine.lag===minLag || fine.lag===maxLag) warnings.push('peak_at_local_refinement_boundary');
  if(coarse.runnerUp && coarse.runnerUp.correlation>=config.minCorrelation &&
      coarse.peakSeparation<0.015) warnings.push('ambiguous_nonlocal_peak');
  return {status:warnings.length?'inconclusive':'measured',reasons:warnings,
    delaySamples:fine.lag,delayMs:fine.lag/RATE*1000,correlation:fine.correlation,
    referenceStats,exportAcRmsDbFs:fine.exportAcRmsDbFs,coarse,fine,
    refinementRadiusSamples:radius};
}

export function fitTiming(windows,config) {
  if(windows.length!==3 || windows.some(w=>w.status!=='measured'))
    return {status:'inconclusive',reason:'All three distinct windows must yield reliable measurements.'};
  const values=windows.map(w=>w.delaySamples).sort((a,b)=>a-b);
  const fixedSamples=values[1],rangeSamples=values[2]-values[0];
  const x=windows.map(w=>(w.referenceStart+w.referenceEnd)/2),y=windows.map(w=>w.delaySamples);
  const mx=x.reduce((a,b)=>a+b,0)/3,my=y.reduce((a,b)=>a+b,0)/3;
  const denominator=x.reduce((a,b)=>a+(b-mx)**2,0);
  const slope=y.reduce((a,b,i)=>a+(x[i]-mx)*(b-my),0)/denominator;
  const fixedDelayMs=fixedSamples/RATE*1000,driftRangeMs=rangeSamples/RATE*1000;
  const maxAbsoluteDelayMs=Math.max(...values.map(v=>Math.abs(v)/RATE*1000));
  const fixedExceeded=maxAbsoluteDelayMs>config.toleranceMs;
  const driftExceeded=driftRangeMs>config.toleranceMs;
  return {status:fixedExceeded||driftExceeded?'fail':'pass',
    fixedDelaySamples:fixedSamples,fixedDelayMs,delayRangeSamples:rangeSamples,
    driftRangeMs,maxAbsoluteDelayMs,linearDriftSamplesPerSecond:slope,
    linearDriftPpm:slope/RATE*1e6,fittedFirstToLastDriftMs:slope*(x[2]-x[0])/RATE*1000,
    toleranceMs:config.toleranceMs,fixedDelayExceeded:fixedExceeded,driftExceeded,
    delayVideoFrames:fixedDelayMs*config.fps/1000,
    signConvention:'positive = export waveform is later; negative = export is earlier',
    classification:fixedExceeded?(driftExceeded?'delay_and_drift':'fixed_delay'):
      (driftExceeded?'drift':'within_tolerance')};
}
function fileIdentity(p) {
  const s=fs.statSync(p);
  if(!s.isFile()) throw new Error('Input is not a regular file: '+p);
  return {path:fs.realpathSync(p),size:s.size,mtimeMs:s.mtimeMs};
}
function sameIdentity(a,b) {return a.path===b.path&&a.size===b.size&&a.mtimeMs===b.mtimeMs;}
function jsonSafe(value) {
  return JSON.stringify(value,(_key,v)=>typeof v==='number'&&!Number.isFinite(v)?null:v,2)+'\n';
}

export function audit(config,report) {
  report.inputs={reference:fileIdentity(config.reference),export:fileIdentity(config.video)};
  const reference=probe(config.reference,config,report.commands);
  const exported=probe(config.video,config,report.commands);
  report.metadata={reference,export:exported,
    interpretation:'Independent container/stream metadata, not waveform-delay evidence. No metadata offsets are used to compensate or repair timing.'};
  if(!/^pcm_/.test(reference.selectedAudio.codec_name??'') ||
      !['wav','wave'].includes(path.extname(config.reference).slice(1).toLowerCase()))
    throw new Error('Reference must be a PCM WAV (ffprobe codec pcm_*).');
  const video=exported.streams.find(s=>s.codec_type==='video');
  if(!video) throw new Error('Export input must contain a video stream.');
  const refDuration=durationOf(reference.selectedAudio,reference.format);
  const audioDuration=durationOf(exported.selectedAudio,exported.format);
  const videoDuration=durationOf(video,exported.format);
  if(!refDuration || !audioDuration || !videoDuration) throw new Error('A finite positive input duration is required.');
  const commonDuration=Math.min(refDuration,audioDuration,videoDuration);
  const maxLagSamples=Math.floor(config.maxLagMs*RATE/1000);
  const marginSamples=Math.ceil(maxLagSamples/COARSE_FACTOR)*COARSE_FACTOR;
  const guardSamples=marginSamples+Math.ceil(0.100*RATE);
  const commonSamples=Math.floor(commonDuration*RATE);
  const available=commonSamples-2*guardSamples;
  const n=Math.floor(Math.min(config.windowSec*RATE,available/3)/COARSE_FACTOR)*COARSE_FACTOR;
  report.coverage={referenceDuration:refDuration,exportAudioDuration:audioDuration,
    exportVideoDuration:videoDuration,commonDuration,requestedWindowSeconds:config.windowSec,
    actualWindowSeconds:n/RATE,uncompensatedReferenceOriginSeconds:0};
  if(n<RATE*0.5) {report.summary={status:'inconclusive',reason:'Too short for three distinct >=0.5s windows with search margins.'};return;}
  const starts=[guardSamples,Math.floor((commonSamples-n)/2),commonSamples-guardSamples-n];
  if(starts[1]<starts[0]+n || starts[2]<starts[1]+n) {
    report.summary={status:'inconclusive',reason:'Three non-overlapping windows cannot be placed.'};return;
  }
  report.windows=[];
  for(let i=0;i<starts.length;i++) {
    const start=starts[i],searchStart=start-marginSamples,searchCount=n+2*marginSamples;
    const x=decode(config.reference,start,n,config,report.commands);
    const y=decode(config.video,searchStart,searchCount,config,report.commands);
    const context={position:['front','middle','back'][i],referenceStart:start/RATE,
      referenceEnd:(start+n)/RATE,exportSearchStart:searchStart/RATE,
      exportSearchEnd:(searchStart+searchCount)/RATE,referenceDecodedSamples:x.length,
      exportDecodedSamples:y.length};
    if(x.length!==n || y.length!==searchCount) {
      report.windows.push({...context,status:'inconclusive',reasons:['decoded_window_shorter_than_requested']});continue;
    }
    report.windows.push({...context,...estimateWindow(x,y,marginSamples,maxLagSamples,config)});
  }
  report.summary=fitTiming(report.windows,config);
  const after={reference:fileIdentity(config.reference),export:fileIdentity(config.video)};
  report.inputsStableDuringAudit=sameIdentity(report.inputs.reference,after.reference)&&sameIdentity(report.inputs.export,after.export);
  if(!report.inputsStableDuringAudit) report.summary={status:'inconclusive',reason:'Input file identity changed during the audit.'};
}

export function main(argv=process.argv.slice(2)) {
  let config;
  try {config=parseArgs(argv);} catch(e) {console.error(e.message);return 64;}
  if(config.help) {console.log(HELP);return 0;}
  let fd;
  try {
    fs.mkdirSync(path.dirname(config.report),{recursive:true});
    fd=fs.openSync(config.report,'wx'); // Atomic, refuse every existing report.
  } catch(e) {console.error('Cannot create new report (existing reports are never overwritten): '+e.message);return 64;}
  const report={schemaVersion:1,tool:'audit-audio-sync',version:'1.0.0',
    generatedAt:new Date().toISOString(),config:{...config,sampleRate:RATE,coarseSampleRate:RATE/COARSE_FACTOR},
    method:'Three distinct non-overlapping decoded front/middle/back windows; 4kHz block-mean coarse Pearson search plus local 48kHz refinement.',
    limitations:[
      'Sampled windows do not prove synchronization at every instant or between windows.',
      'This compares the selected first audio stream with a reference mix, not individual voice/BGM/FX stems.',
      'Delays outside the configured search range or periodic/weak signals can be inconclusive.',
      'Block-mean downsampling is a coarse locator, not a high-quality audio conversion; final delay is measured at 48kHz.',
      'Correlation tests alignment, not listening quality, intelligibility, semantic correctness, clipping, or visual event timing.',
      'Audio is decoded only to bounded stdout buffers; no repair, retiming, delay, padding, or audio/video file is generated.',
      'No human listening review is claimed.'
    ],commands:[],humanListeningPerformed:false,mediaModified:false};
  let exitCode=64;
  try {
    audit(config,report);
    exitCode=report.summary.status==='pass'?0:report.summary.status==='fail'?1:2;
  } catch(e) {report.summary={status:'error',message:e.message};exitCode=64;}
  report.exitCode=exitCode;
  try {fs.writeFileSync(fd,jsonSafe(report));} finally {fs.closeSync(fd);}
  console.log(JSON.stringify({report:config.report,status:report.summary.status,exitCode,
    fixedDelaySamples:report.summary.fixedDelaySamples??null,
    fixedDelayMs:report.summary.fixedDelayMs??null,driftRangeMs:report.summary.driftRangeMs??null}));
  return exitCode;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) process.exitCode=main();
