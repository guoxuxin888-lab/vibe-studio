#!/usr/bin/env node
// 给成片或对标片体检：硬切、画面事件、响度、BPM、画面事件贴音乐起音的倍数，并对照样本四分位范围。
// 用法：node measure.mjs <视频> [--json]
// 依赖 ffmpeg/ffprobe。只是体检，偏离不等于错，也不预测能不能爆。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2), video = args.find(a => !a.startsWith('--'));
if (!video) { console.error('用法：node measure.mjs <视频> [--json]'); process.exit(2); }
const run = (cmd, a) => spawnSync(cmd, a, { encoding: 'utf8', maxBuffer: 1 << 28 });
const dur = Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video]).stdout.trim());
if (!dur) { console.error('读不到时长：' + video); process.exit(1); }

// 硬切 + 每帧变化量
const vis = run('ffmpeg', ['-nostdin', '-hide_banner', '-v', 'info', '-i', video, '-an', '-vf', "scale=240:-2,select='gte(scene,0)',metadata=print:file=-", '-f', 'null', '-']).stdout;
const frames = []; let t = 0;
for (const l of vis.split('\n')) { const a = l.match(/pts_time:([\d.]+)/); if (a) t = Number(a[1]); const b = l.match(/scene_score=([\d.]+)/); if (b) frames.push({ t, s: Number(b[1]) }); }
const cuts = frames.filter(f => f.s > 0.25).map(f => f.t);
const peaks = (vals, k, gap) => { const n = vals.length, m = vals.reduce((a, b) => a + b, 0) / (n || 1); let v = 0; for (const x of vals) v += (x - m) ** 2; const th = m + k * Math.sqrt(v / (n || 1)), out = []; for (let i = 1; i < n - 1; i++) if (vals[i] > th && vals[i] >= vals[i - 1] && vals[i] >= vals[i + 1] && (!out.length || i - out[out.length - 1] >= gap)) out.push(i); return out; };
const visT = peaks(frames.map(f => f.s), 2.5, 6).map(i => frames[i].t);

// 响度
const loud = run('ffmpeg', ['-nostdin', '-hide_banner', '-i', video, '-vn', '-af', 'ebur128', '-f', 'null', '-']).stderr;
const I = Number((loud.match(/I:\s+(-?[\d.]+) LUFS\s*\n\s*Threshold[\s\S]*?LRA:/) || loud.match(/Integrated loudness:\s*\n\s*I:\s+(-?[\d.]+)/) || [])[1]);
const LRA = Number((loud.match(/LRA:\s+([\d.]+) LU\s*\n\s*Threshold/) || [])[1]);

// 起音与 BPM
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vibe-measure-')), pcm = path.join(dir, 'a.pcm');
run('ffmpeg', ['-nostdin', '-y', '-v', 'error', '-i', video, '-vn', '-ac', '1', '-ar', '8000', '-af', 'highpass=f=2500', '-f', 's16le', pcm]);
const fullPcm = path.join(dir, 'full.pcm');
run('ffmpeg', ['-nostdin', '-y', '-v', 'error', '-i', video, '-vn', '-ac', '1', '-ar', '8000', '-f', 's16le', fullPcm]);
let bpm = null, lift = null, onBeat = null;
if (fs.existsSync(pcm) && fs.statSync(pcm).size > 16000) {
  const b = fs.readFileSync(pcm), HOP = 80, n = Math.floor(b.length / 2 / HOP), e = new Float64Array(n);
  for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < HOP; j++) { const v = b.readInt16LE((i * HOP + j) * 2); s += v * v; } e[i] = Math.log1p(Math.sqrt(s / HOP)); }
  const f = new Float64Array(n); for (let i = 1; i < n; i++) f[i] = Math.max(0, e[i] - e[i - 1]);
  const m = f.reduce((a, c) => a + c, 0) / n, x = Array.from(f, v => v - m);
  let bestLag = 0, best = -Infinity;
  for (let lag = 33; lag <= 100; lag++) { let s = 0; for (let i = lag; i < n; i++) s += x[i] * x[i - lag]; if (s > best) { best = s; bestLag = lag; } }
  // 整数滞后会累积漂移，细化到 0.02 帧（10ms 一帧）
  let fineLag = bestLag, fineBest = -Infinity; for (let c = bestLag - 1; c <= bestLag + 1; c += 0.02) { let s = 0; for (let k = 1; k <= 16; k++) { const i0 = Math.round(c * k); for (let i = i0; i < n; i += 3) s += x[i] * x[i - i0]; } if (s > fineBest) { fineBest = s; fineLag = c; } }
  bpm = Math.round(60000 / fineLag) / 10;
  // 贴拍用全频段起音，和样本的测法一致
  const fb = fs.readFileSync(fullPcm), fn = Math.floor(fb.length / 2 / HOP), fe = new Float64Array(fn); for (let i = 0; i < fn; i++) { let s = 0; for (let j = 0; j < HOP; j++) s += (fb.readInt16LE((i * HOP + j) * 2) / 32768) ** 2; fe[i] = Math.log1p(1000 * Math.sqrt(s / HOP)); } const ff = new Array(fn).fill(0); for (let i = 1; i < fn; i++) ff[i] = Math.max(0, fe[i] - fe[i - 1]);
  const on = new Set(peaks(ff, 2, 10));
  const near = (time, shift) => { const c = Math.round((time + shift) * 100); for (let d = -7; d <= 7; d++) if (on.has(c + d)) return true; return false; };
  if (visT.length >= 10) { const hit = visT.filter(v => near(v, 0)).length; let base = 0; const N = 40; for (let k = 0; k < N; k++) base += visT.filter(v => near(v, 1 + k * 0.173)).length; lift = Math.round(hit / (base / N + 0.01) * 100) / 100; }
  let phase = 0, bs = -1; for (let p = 0; p < fineLag; p++) { let s = 0; for (let q = p; q < n; q += fineLag) s += f[Math.round(q)] || 0; if (s > bs) { bs = s; phase = p; } }
  if (cuts.length) onBeat = cuts.filter(c => { const k = (c * 100 - phase) / fineLag; return Math.abs(k - Math.round(k)) * fineLag / 100 <= 0.07; }).length;
}
fs.rmSync(dir, { recursive: true, force: true });

const r = { seconds: Math.round(dur * 10) / 10, cuts: cuts.length, cutsPerMin: Math.round(cuts.length / dur * 600) / 10, visPerMin: Math.round(visT.length / dur * 600) / 10, lufs: I, lra: LRA, bpm, cutsOnBeat: onBeat, lift };
if (args.includes('--json')) { console.log(JSON.stringify(r)); process.exit(0); }
const here = path.dirname(fileURLToPath(import.meta.url));
const ranges = JSON.parse(fs.readFileSync(path.join(here, '..', 'libraries', 'reference-ranges.json'), 'utf8'));
const g = dur <= 31 ? '≤31s' : dur <= 90 ? '31-90s' : dur <= 170 ? '91-170s' : '>170s';
const ref = ranges.groups[g];
console.log(`时长 ${r.seconds} 秒（对照 ${g} 组，样本 ${ref.n} 条的四分位范围）\n`);
const row = (name, v, key) => { const q = ref[key]; const tag = v == null || Number.isNaN(v) ? '无数据' : v < q[0] ? '低于范围' : v > q[1] ? '高于范围' : '范围内'; console.log(`${name}：${v ?? '—'}　样本 ${q[0]}～${q[1]}　${tag}`); };
row('每分钟硬切', r.cutsPerMin, 'cutsPerMin'); row('每分钟画面事件', r.visPerMin, 'visPerMin'); row('响度 LUFS', r.lufs, 'lufs'); row('动态范围 LRA', r.lra, 'lra'); if (r.lift != null) row('贴拍倍数', r.lift, 'lift'); else console.log('贴拍倍数：画面事件少于 10 个，不算');
console.log(`\n硬切 ${r.cuts} 个，其中 ${r.cutsOnBeat ?? '—'} 个贴拍；自动估算 BPM ${r.bpm ?? '—'}（可能差一倍或一半）。`);
console.log('样本里这些数字和点赞都没有明显相关，只用来发现异常，不要为贴合范围去改片。');
