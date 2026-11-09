#!/usr/bin/env node
// npm run new -- <slug> --package <content-package.md> --mode original|reference --style <id> --mood <id> [--reference <id>] [--bars 8]
// Creates a film from a checked content package and renders a first score, so the picture can start against real music.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkPackage } from './check-package.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = n => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : null; };
const slug = args[0], pkg = opt('package'), mode = opt('mode') || 'original', styleId = opt('style'), moodId = opt('mood'), refId = opt('reference');
const usage = 'Usage: npm run new -- <slug> --package <file> --mode original|reference --style <id> --mood <id> [--reference <id>]';
if (!slug || slug.startsWith('--') || !pkg || !styleId || !moodId) { console.error(usage); process.exit(2); }
if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) { console.error('slug: lower-case letters, digits and hyphens only'); process.exit(2); }
if (!['original', 'reference'].includes(mode)) { console.error('mode: original or reference'); process.exit(2); }
if (mode === 'reference' && !refId) { console.error('Reference mode needs --reference <id>. Run npm run reference first.'); process.exit(2); }
const text = fs.readFileSync(pkg, 'utf8'), check = checkPackage(text);
if (!check.ok) { console.log('内容包还不能交制作：'); check.fails.forEach(x => console.log('- ' + x)); process.exit(1); }
if (!fs.existsSync(path.join(root, 'libraries/styles', styleId + '.json'))) { console.error(`Unknown style: ${styleId}. See libraries/styles/.`); process.exit(1); }
const moods = JSON.parse(fs.readFileSync(path.join(root, 'libraries/music/moods.json'), 'utf8')), mood = moods.find(m => m.id === moodId);
if (!mood) { console.error(`Unknown mood: ${moodId}. Have: ${moods.map(m => m.id).join(', ')}`); process.exit(1); }
const dir = path.join(root, 'films', slug);
if (fs.existsSync(dir)) { console.error('Already exists, nothing changed: ' + dir); process.exit(1); }

const card = k => (text.match(new RegExp(`^-\\s*${k}[：:]\\s*(.*)$`, 'm')) || [])[1]?.trim() || '';
const seconds = Number((card('时长').match(/\d+/) || [30])[0]);
const barSec = 240 / mood.bpm, totalBars = Math.max(4, Math.round(seconds / barSec));
// First-draft form. Rewrite it once the dramatic turns of this script are clear.
const a = Math.max(1, Math.round(totalBars * 0.25)), c = Math.max(1, Math.round(totalBars * 0.25)), d = Math.max(1, Math.round(totalBars * 0.15)), b = Math.max(1, totalBars - a - c - d);
const camel = slug.replace(/-(\w)/g, (_, x) => x.toUpperCase()).replace(/^\d/, m => 'f' + m);

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'content-package.md'), text);
fs.writeFileSync(path.join(dir, 'score.mjs'), `// First draft from the mood "${mood.id}". The score leads: decide form and turns here, then cut the picture to it.
export default {
  title: ${JSON.stringify(slug)},
  bpm: ${mood.bpm},
  meter: 4,
  key: ${JSON.stringify(mood.key)},
  mode: ${JSON.stringify(mood.mode)},
  palette: ${JSON.stringify(mood.palette)},
  seed: 11,
  motif: { name: 'object', notes: ${JSON.stringify(mood.motif)} },
  sections: [
    { id: 'statement', role: 'the situation', bars: ${a}, tension: 0.15, harmony: ${JSON.stringify(mood.harmony.low)}, motif: true },
    { id: 'build', role: 'the idea develops', bars: ${b}, tension: 0.5, harmony: ${JSON.stringify(mood.harmony.mid)}, motif: true },
    { id: 'peak', role: 'the name or the turn lands', bars: ${c}, tension: 0.9, harmony: ${JSON.stringify(mood.harmony.high)}, motif: true, motifOctave: 5 },
    { id: 'release', role: 'thin out, leave the question', bars: ${d}, tension: 0.22, harmony: ${JSON.stringify(mood.harmony.low)} },
  ],
  cues: {},
  sfx: [{ at: 'peak', name: 'riser', options: { seconds: ${(barSec * 0.75).toFixed(2)} }, gain: 0.5 }, { at: 'peak', name: 'impact', gain: 0.8 }],
};
`);
fs.writeFileSync(path.join(dir, 'treatment.md'), `# ${slug} · 导演方案

**模式：** ${mode === 'reference' ? `参考（\`references/private/${refId}/card.md\`）。说明从参考片学什么、哪里不同。` : '原创。写清楚这部片的世界观从哪来。'}

**世界观：**

**贯穿物：** ${card('贯穿物')}

**画风：** \`${styleId}\`

**音乐：** \`${moodId}\`，${mood.bpm} BPM，${mood.key} ${mood.mode}。动机代表什么：

**亮度曲线：**

| 小节 | 时间 | 和声与配器 | 画面 | 字 |
|---|---|---|---|---|

**进度：** 接手前先读，改完更新。
`);
fs.writeFileSync(path.join(dir, 'Film.tsx'), `import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {MusicProvider, Timeline, useMusic} from '../../src/lib/music';
import {Grain, StyleBackdrop, Vignette} from '../../src/motion';
import {getStyle} from '../../src/styles';
import timeline from './timeline.json';

const style = getStyle(${JSON.stringify(styleId)});

const Scene: React.FC = () => {
  const m = useMusic();
  // Brightness follows the music's tension. Replace this with the world from treatment.md.
  return (
    <AbsoluteFill>
      <StyleBackdrop style={style} />
      <AbsoluteFill style={{background: style.palette.accent2, opacity: m.tension * 0.12 * (0.6 + 0.4 * m.energy)}} />
      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

export const Film: React.FC = () => (
  <MusicProvider timeline={timeline as Timeline}>
    <Audio src={staticFile('films/${slug}/audio.wav')} />
    <Scene />
  </MusicProvider>
);
export const meta = {id: ${JSON.stringify(slug)}, timeline: timeline as Timeline};
`);
const idx = path.join(root, 'films/index.ts');
let s = fs.readFileSync(idx, 'utf8');
s = s.replace(/(export const FILMS = \[)/, `import * as ${camel} from './${slug}/Film';\n\n$1`).replace(/\n\n(import \* as)/g, '\n$1').replace(/\];/, `, ${camel}];`).replace('[, ', '[');
fs.writeFileSync(idx, s);
const r = spawnSync(process.execPath, [path.join(root, 'engine/render-film.mjs'), slug], { encoding: 'utf8' });
process.stdout.write(r.stdout); process.stderr.write(r.stderr);
console.log(`Created films/${slug}. Next: fill treatment.md, rewrite score.mjs, then build Film.tsx.`);
