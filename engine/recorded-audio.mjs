// Existing music + narration. No synthesis; build the timeline from the actual music PCM.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {buildTimeline, SR} from './compose.mjs';

export function renderRecordedAudio(score, plan, pub, filmDir) {
  const ff = process.env.FFMPEG_PATH || 'ffmpeg';
  const rec = score.recording;
  const music = path.resolve(pub, rec.file);
  const voice = rec.voice ? path.resolve(pub, rec.voice.file) : null;
  for (const f of [music, voice].filter(Boolean)) if (!fs.existsSync(f)) throw new Error(`Missing recording: ${f}`);
  const run = args => {
    const p = spawnSync(ff, ['-hide_banner','-nostdin',...args], {maxBuffer:128*1024*1024});
    if (p.status !== 0) throw new Error(p.stderr.toString());
    return p;
  };
  const d = plan.duration;
  const offset = rec.offset ?? 0;
  const pcm = run(['-v','error','-i',music,'-ss',String(offset),'-t',String(d),'-ar',String(SR),'-ac','1','-f','f32le','-']).stdout;
  const signal = new Float32Array(pcm.length/4);
  for (let i=0;i<signal.length;i++) signal[i]=pcm.readFloatLE(i*4);
  const timeline = buildTimeline(plan,signal,signal);
  // The music's key/semantic sections have not been transcribed.
  timeline.key = 'unmeasured'; timeline.mode = 'unmeasured';
  timeline.recording = {file:rec.file,offset,tempoMethod:rec.tempoMethod,semanticSectionsVerified:false};
  const fadeOut = Math.min(rec.fadeOut ?? 1.2,d/2);
  const bed = `atrim=start=${offset}:duration=${d},asetpts=PTS-STARTPTS,loudnorm=I=${rec.lufs ?? -30}:TP=-3:LRA=7,aresample=48000,afade=t=in:d=${rec.fadeIn ?? .4},afade=t=out:st=${d-fadeOut}:d=${fadeOut}`;
  const ins = ['-i',music];
  let graph = `[0:a]${bed}[mix]`;
  if(voice){
    ins.push('-i',voice);
    const end=rec.voice.end ?? d;
    graph=`[0:a]${bed}[bed];[1:a]atrim=start=${rec.voice.offset??0}:duration=${end},asetpts=PTS-STARTPTS,loudnorm=I=${rec.voice.lufs??-18}:TP=-2:LRA=7,aresample=48000,afade=t=out:st=${end-.04}:d=0.04,apad,atrim=duration=${d}[vo];[vo][bed]amix=inputs=2:duration=longest:normalize=0:dropout_transition=0[mix]`;
  }
  const target=rec.outputLufs??-14;
  const first=run([...ins,'-filter_complex',graph+`;[mix]loudnorm=I=${target}:TP=-1.5:LRA=7:print_format=json[final]`,'-map','[final]','-t',String(d),'-f','null','-']);
  const block=first.stderr.toString().match(/\{\s*"input_i"[\s\S]*?\}/);
  if(!block) throw new Error('No loudness measurement was returned');
  const measured=JSON.parse(block[0]);
  const normal=`loudnorm=I=${target}:TP=-1.5:LRA=7:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true`;
  run(['-y',...ins,'-filter_complex',graph+`;[mix]${normal},aresample=48000[final]`,'-map','[final]','-t',String(d),'-ar','48000','-ac','2','-c:a','pcm_s16le',path.join(pub,'audio.wav')]);
  fs.writeFileSync(path.join(filmDir,'timeline.json'),JSON.stringify(timeline,null,2));
  fs.writeFileSync(path.join(filmDir,'mix-report.json'),JSON.stringify({music:rec.file,voice:rec.voice,requestedLufs:target,firstPass:measured,duration:d,generatedMusic:false},null,2));
  return timeline;
}
