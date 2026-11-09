#!/usr/bin/env node
// npm run library   Renders every mood into a 32-second audition and every effect into an audition file.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { compose, renderAudio, writeWav, SR } from './compose.mjs';
import { renderSfx } from './sfx.mjs';
import { normalize } from './loudness.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toMp3 = (wav, mp3) => { const r = spawnSync('ffmpeg', ['-nostdin', '-y', '-v', 'error', '-i', wav, '-codec:a', 'libmp3lame', '-b:a', '128k', mp3]); if (r.status === 0) fs.rmSync(wav); return r.status === 0; };
const only = process.argv[2];

const moods = JSON.parse(fs.readFileSync(path.join(root, 'libraries/music/moods.json'), 'utf8'));
const musicOut = path.join(root, 'libraries/music/auditions');
fs.mkdirSync(musicOut, { recursive: true });
for (const m of moods) {
  if (only && only !== m.id) continue;
  // A standard arc in eight-bar phrases: statement, build, peak, release.
  const barSec = 240 / m.bpm, bars = n => Math.max(1, Math.round(n / barSec));
  const plan = compose({
    bpm: m.bpm, key: m.key, mode: m.mode, palette: m.palette, seed: 31, motif: { notes: m.motif },
    sections: [
      { id: 'statement', bars: bars(8), tension: 0.15, harmony: m.harmony.low, motif: true },
      { id: 'build', bars: bars(8), tension: 0.48, harmony: m.harmony.mid, motif: true },
      { id: 'peak', bars: bars(8), tension: 0.9, harmony: m.harmony.high, motif: true, motifOctave: 5 },
      { id: 'release', bars: bars(8), tension: 0.24, harmony: m.harmony.low, motif: true },
    ],
  });
  const [L, R] = renderAudio(plan), wav = path.join(musicOut, `${m.id}.wav`);
  writeWav(wav, L, R, fs);
  console.log(`${m.id}: ${plan.duration.toFixed(1)}s  ${normalize(wav)}  ${toMp3(wav, wav.replace(/\.wav$/, '.mp3')) ? 'mp3' : 'wav kept'}`);
}

if (!only) {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'libraries/sfx/catalog.json'), 'utf8'));
  const sfxOut = path.join(root, 'libraries/sfx/auditions');
  fs.mkdirSync(sfxOut, { recursive: true });
  for (const s of catalog) {
    const [a, b] = renderSfx(s.id, SR, s.options), wav = path.join(sfxOut, `${s.id}.wav`);
    let peak = 0; for (let i = 0; i < a.length; i++) peak = Math.max(peak, Math.abs(a[i]), Math.abs(b[i]));
    const g = peak > 0.9 ? 0.9 / peak : 1; for (let i = 0; i < a.length; i++) { a[i] *= g; b[i] *= g; }
    writeWav(wav, a, b, fs);
    toMp3(wav, wav.replace(/\.wav$/, '.mp3'));
  }
  console.log(`effects: ${catalog.length}`);
}
