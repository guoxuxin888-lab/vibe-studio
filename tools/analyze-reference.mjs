#!/usr/bin/env node
// npm run reference -- <video> --id <name>
// Reference mode, step one. Measures a case and prepares a card. Results stay in references/private and are never committed.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), video = args[0], i = args.indexOf('--id'), id = i >= 0 ? args[i + 1] : null;
if (!video || !id) { console.error('Usage: npm run reference -- <video> --id <name>'); process.exit(2); }
const out = path.join(root, 'references/private', id), frames = path.join(out, 'frames');
fs.mkdirSync(frames, { recursive: true });
const ff = a => spawnSync('ffmpeg', ['-nostdin', '-y', '-v', 'error', ...a], { encoding: 'utf8' });
const dur = Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], { encoding: 'utf8' }).stdout.trim());
if (!dur) { console.error('Cannot read video: ' + video); process.exit(1); }
const m = spawnSync(process.execPath, [path.join(root, 'tools/measure.mjs'), video, '--json'], { encoding: 'utf8' });
const data = JSON.parse(m.stdout);
fs.writeFileSync(path.join(out, 'measure.json'), JSON.stringify(data, null, 1));
// Contact sheet: the opening at close range, then the whole film.
const hook = [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 6, 8].map(t => t * Math.min(1, dur / 18));
const rest = Array.from({ length: 15 }, (_, k) => hook[9] + (dur - hook[9] - 0.3) * (k + 1) / 15);
const [w, h] = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', video], { encoding: 'utf8' }).stdout.trim().split(',').map(Number);
const fit = w > h ? 'scale=400:225' : 'scale=126:224,pad=400:225:137:0';
[...hook, ...rest].forEach((t, k) => ff(['-ss', String(t), '-i', video, '-frames:v', '1', '-vf', fit, '-q:v', '4', path.join(frames, String(k + 1).padStart(2, '0') + '.jpg')]));
ff(['-framerate', '1', '-i', path.join(frames, '%02d.jpg'), '-vf', 'tile=5x5:padding=2:color=white', '-frames:v', '1', '-q:v', '4', path.join(out, 'sheet.jpg')]);
fs.rmSync(frames, { recursive: true, force: true });
const card = path.join(out, 'card.md');
if (!fs.existsSync(card)) fs.writeFileSync(card, `# 参考卡：${id}

来源：${path.basename(video)}
时长 ${data.seconds} 秒 · 每分钟硬切 ${data.cutsPerMin} · 每分钟画面事件 ${data.visPerMin} · ${data.lufs} LUFS · 约 ${data.bpm} BPM（自动估算，可能差一倍或一半）

看 sheet.jpg 逐段填写，不要只看开头。

## 学什么

| 时间 | 画面 | 动效 | 音乐和音效 | 用在什么场合 |
|---|---|---|---|---|

## 不学什么

- 原文、原画面、原素材、原音乐。
- 颜色和字体，除非本片明确要照这部片。

## 我们换成什么

这部片成立的原理是：
我们的题目里，对应的东西是：
`);
console.log('Wrote ' + out);
console.log(JSON.stringify(data));
