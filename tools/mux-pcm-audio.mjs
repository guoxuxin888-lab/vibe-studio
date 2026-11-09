#!/usr/bin/env node
// Bounded PCM WAV -> one AAC encode + unchanged video stream copy.
// Usage: node mux-pcm-audio.mjs <video.mp4> <mix.wav> <new.mp4> <seconds-or-timeline.json>
// There is deliberately no overwrite or force option.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 1 && ['--help','-h'].includes(argv[0])) { console.log('Usage: node mux-pcm-audio.mjs <picture.mp4> <mix-48000-pcm.wav> <new.mp4> <seconds-or-timeline.json>\nSet FFMPEG_PATH and FFPROBE_PATH or put both tools on PATH. Existing output is never overwritten. Run audit-audio-sync.mjs after muxing.'); return; }
  if (argv.length !== 4) throw new Error('Usage: <video.mp4> <mix.wav> <new.mp4> <seconds>');
  const [videoArg, audioArg, outArg, secondsArg] = argv;
  const video = path.resolve(videoArg), audio = path.resolve(audioArg), out = path.resolve(outArg);
  if (fs.existsSync(out)) throw new Error('Output already exists; refusing to overwrite: ' + out);
  if (!fs.existsSync(path.dirname(out))) throw new Error('Output directory must already exist');
  for (const file of [video, audio]) if (!fs.statSync(file).isFile()) throw new Error('Input is not a file: ' + file);
  if (path.extname(audio).toLowerCase() !== '.wav') throw new Error('Use the original PCM mix WAV, never an already encoded video audio track');
  if (out === video || out === audio) throw new Error('Output must be separate from both inputs');
  let seconds=Number(secondsArg),plannedFrames=null,plannedFps=null;
  if (Number.isNaN(seconds) && path.extname(secondsArg).toLowerCase()==='.json') {
    const timeline=JSON.parse(fs.readFileSync(path.resolve(secondsArg),'utf8'));
    seconds=Number(timeline.duration);plannedFrames=Number(timeline.frames);plannedFps=Number(timeline.fps);
    if (!Number.isInteger(plannedFrames)||plannedFrames<=0||!Number.isFinite(plannedFps)||plannedFps<=0||Math.abs(plannedFrames/plannedFps-seconds)>1/48000) throw new Error('Timeline must have consistent duration, frames and fps');
  }
  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 600) throw new Error('Seconds must be explicit and within 0..600');
  const ff = process.env.FFMPEG_PATH || 'ffmpeg';
  const timeoutMs = Math.min(120000,Math.max(15000,Math.ceil(seconds*500)));
  const fp = process.env.FFPROBE_PATH || (path.isAbsolute(ff) ? path.join(path.dirname(ff), process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe') : 'ffprobe');
  function run(exe, args) {
    const r = spawnSync(exe, args, {encoding:'utf8', windowsHide:true, timeout:timeoutMs, maxBuffer:2097152});
    if (r.status !== 0) throw new Error(r.stderr || String(r.error) || ('Exit ' + r.status));
    return r.stdout;
  }
  const audioProbe = JSON.parse(run(fp, ['-v','error','-select_streams','a:0','-show_entries','stream=codec_name,sample_rate,channels','-of','json',audio]));
  const stream = audioProbe.streams && audioProbe.streams[0];
  if (!stream || !String(stream.codec_name).startsWith('pcm_') || Number(stream.sample_rate) !== 48000)
    throw new Error('Expected the project 48000 Hz PCM WAV');
  const pictureProbe=JSON.parse(run(fp,['-v','error','-select_streams','v:0','-show_entries','stream=duration,nb_frames,r_frame_rate:format=duration','-of','json',video]));
  const pictureStream=pictureProbe.streams?.[0],pictureDuration=Number(pictureStream?.duration??pictureProbe.format?.duration);
  const [pictureFpsN,pictureFpsD]=String(pictureStream?.r_frame_rate||'').split('/').map(Number);const pictureFps=pictureFpsN/pictureFpsD,pictureFrames=Number(pictureStream?.nb_frames);
  if (![pictureDuration,pictureFps,pictureFrames].every(Number.isFinite)||pictureFps<=0||Math.abs(pictureDuration-seconds)>0.5/pictureFps+0.001||pictureFrames!==Math.round(seconds*pictureFps)||(plannedFrames!==null&&(plannedFrames!==pictureFrames||Math.abs(plannedFps-pictureFps)>1e-6))) throw new Error('Explicit duration/timeline must match the entire picture frame count; refusing to silently truncate or extend');
  const endSample = Math.round(seconds * 48000);
  const inputDuration = Number(JSON.parse(run(fp, ['-v','error','-show_entries','format=duration','-of','json',audio])).format.duration);
  if (!Number.isFinite(inputDuration) || inputDuration + 1/48000 < seconds) throw new Error('PCM mix must cover the explicit timeline duration; prepare its exact sample count first');
  const byteCap = fs.statSync(video).size + Math.ceil(seconds * 40000) + 4000000;
  const args = ['-nostdin','-n','-hide_banner','-v','error',
    '-i',video,'-i',audio,'-map','0:v:0','-map','1:a:0',
    '-c:v','copy','-c:a','aac','-b:a','320k','-ar','48000',
    '-af','atrim=end_sample=' + endSample + ',asetpts=PTS-STARTPTS',
    '-t',String(seconds),'-fs',String(byteCap),'-movflags','+faststart',out];
  run(ff, args);
  const result = JSON.parse(run(fp, ['-v','error','-show_entries','format=duration:stream=codec_type,codec_name,sample_rate,channels,duration,nb_frames,r_frame_rate','-of','json',out]));
  const videoStream=result.streams.find(s=>s.codec_type==='video'),audioStream=result.streams.find(s=>s.codec_type==='audio');
  const videoDuration=Number(videoStream?.duration),audioDuration=Number(audioStream?.duration),containerDuration=Number(result.format?.duration);
  const [fpsN,fpsD]=String(videoStream?.r_frame_rate||'').split('/').map(Number);const fps=fpsN/fpsD;
  if (!videoStream || !audioStream || ![videoDuration,audioDuration,containerDuration,fps].every(Number.isFinite) || fps<=0 || Math.abs(videoDuration-seconds)>1/fps+0.001 || audioDuration<seconds-0.002 || audioDuration-seconds>3*1024/48000+0.001 || fs.statSync(out).size>=byteCap) throw new Error('Output failed duration/stream/byte-cap checks; preserve it for diagnosis, do not deliver');
  console.log(JSON.stringify({output:out, seconds, endSample, byteCap, timeoutMs, mustRunContentAudit:true,
    videoStreamCopy:true, audioSource:audio, startSamplesRemoved:0,
    ffmpeg:ff, commandArgs:args, probe:result}, null, 2));
}
try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
