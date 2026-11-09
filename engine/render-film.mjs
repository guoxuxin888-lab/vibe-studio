#!/usr/bin/env node
// npm run music -- <film>   Reads films/<film>/score.mjs and writes audio, MIDI and the timeline.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { compose, renderAudio, buildTimeline, writeWav, writeMidi } from './compose.mjs';
import { normalize } from './loudness.mjs';
import { renderRecordedAudio } from './recorded-audio.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const film = process.argv[2];
if (!film) { console.error('Usage: npm run music -- <film>'); process.exit(2); }
const file = path.join(root, 'films', film, 'score.mjs');
if (!fs.existsSync(file)) { console.error(`Missing ${file}`); process.exit(1); }
const { default: score } = await import(pathToFileURL(file).href);
const plan = compose(score);
if (score.recording) {
  const pub = path.join(root, 'public', 'films', film);
  fs.mkdirSync(pub, {recursive:true});
  const timeline = renderRecordedAudio(score, plan, pub, path.dirname(file));
  console.log(`${film}: existing music + narration, ${timeline.duration}s; timeline generated from recording`);
  process.exit(0);
}
const [L, R] = renderAudio(plan);
const pub = path.join(root, 'public', 'films', film);
fs.mkdirSync(pub, { recursive: true });
const wav = path.join(pub, 'audio.wav');
writeWav(wav, L, R, fs);
console.log(normalize(wav));
writeMidi(path.join(root, 'films', film, 'score.mid'), plan, fs);
fs.writeFileSync(path.join(root, 'films', film, 'timeline.json'), JSON.stringify(buildTimeline(plan, L, R)));
console.log(`${film}: ${plan.duration.toFixed(2)}s, ${plan.bpm} BPM, ${plan.key} ${plan.mode}, ${plan.notes.length} notes, ${plan.hits.length} effects`);
console.log('Cues:', Object.entries(plan.cues).map(([k, v]) => `${k}=${v.toFixed(2)}s`).join('  '));
