// Two-pass linear loudness normalisation with ffmpeg. Dynamics are the composer's, so only the level changes.
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

export function normalize(file, { I = -14, TP = -1.5, LRA = 11 } = {}) {
  const first = spawnSync('ffmpeg', ['-nostdin', '-hide_banner', '-i', file, '-af', `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}:print_format=json`, '-f', 'null', '-'], { encoding: 'utf8' });
  if (first.error) return 'ffmpeg not found: loudness left as rendered';
  const m = first.stderr.match(/\{[\s\S]*\}/);
  if (!m) return 'loudnorm gave no measurement: loudness left as rendered';
  const d = JSON.parse(m[0]), tmp = `${file}.tmp.wav`;
  const af = `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}:linear=true:measured_I=${d.input_i}:measured_TP=${d.input_tp}:measured_LRA=${d.input_lra}:measured_thresh=${d.input_thresh}:offset=${d.target_offset}`;
  const second = spawnSync('ffmpeg', ['-nostdin', '-y', '-v', 'error', '-i', file, '-af', af, '-ar', '44100', tmp], { encoding: 'utf8' });
  if (second.status !== 0) { fs.rmSync(tmp, { force: true }); return `loudnorm failed: ${second.stderr.slice(0, 120)}`; }
  fs.renameSync(tmp, file);
  return `Loudness ${d.input_i} -> ${I} LUFS (range ${d.input_lra} LU)`;
}
