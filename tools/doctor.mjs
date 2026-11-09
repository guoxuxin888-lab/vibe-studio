#!/usr/bin/env node
// npm run doctor   Checks the tools, libraries and every film. Run it before committing. Exit code 1 on failure.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkPackage } from './check-package.mjs';
import { compose } from '../engine/compose.mjs';
import { SFX } from '../engine/sfx.mjs';
import { VOICES } from '../engine/voices.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fails = [], warns = [];
const ok = (c, m) => { if (!c) fails.push(m); };
const J = f => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
const nodeMajor = Number(process.versions.node.split('.')[0]);
ok(nodeMajor >= 20, `Node ${process.versions.node} is too old: need 20 or newer (需要 Node 20 以上：运行 setup/install-windows.cmd 或 bash setup/install.sh，或见 README“安装”)`);
for (const t of ['ffmpeg', 'ffprobe']) if (spawnSync(t, ['-version']).status !== 0) warns.push(`${t} not found: audio normalising and reference analysis need it (没找到 ${t}：运行 setup 里的一键安装脚本，或见 README“安装”)`);

// Every style complete, every mood composes, every catalogued effect exists.
const need = ['id', 'name', 'fits', 'palette', 'texture', 'figure', 'font', 'light', 'motion', 'music', 'imagePrompt', 'avoid'];
const stylesDir = path.join(root, 'libraries/styles');
for (const f of fs.readdirSync(stylesDir).filter(x => x.endsWith('.json'))) { const s = J('libraries/styles/' + f); for (const k of need) ok(s[k], `${f}: missing ${k}`); ok(`${s.id}.json` === f, `${f}: id differs from file name`); }
const index = fs.readFileSync(path.join(root, 'src/styles/index.ts'), 'utf8');
for (const f of fs.readdirSync(stylesDir).filter(x => x.endsWith('.json'))) ok(index.includes(`/${f}'`), `src/styles/index.ts does not import ${f}`);
for (const m of J('libraries/music/moods.json')) { try { compose({ bpm: m.bpm, key: m.key, mode: m.mode, palette: m.palette, motif: { notes: m.motif }, sections: Object.values(m.harmony).map((h, i) => ({ id: 's' + i, bars: 2, tension: 0.2 + i * 0.3, harmony: h, motif: true })) }); } catch (e) { fails.push(`mood ${m.id}: ${e.message}`); } }
for (const s of J('libraries/sfx/catalog.json')) ok(SFX[s.id], `catalog effect has no recipe: ${s.id}`);
for (const k of Object.keys(SFX)) ok(J('libraries/sfx/catalog.json').some(s => s.id === k), `effect not in catalog: ${k}`);

// The package gate lets a good one through and stops the bad ones.
const good = '---\nstatus: 待制作\n---\n\n## 选题卡\n\n- 目标：收藏\n- 片型：证据链\n- 时长：约 90 秒\n- 声音形式：纯字幕\n- 贯穿物：一张票\n\n## 字幕稿\n\n- 0s 一张票让人多看了一场戏。\n\n## 事实表\n\n| 说法 | 来源 | 状态 |\n|---|---|---|\n| 某实验 | 某论文 | 已核 |\n';
ok(checkPackage(good).ok, 'check-package rejects a valid package');
ok(!checkPackage(good.replace('待制作', '策划中')).ok, 'check-package accepts a package not yet approved');
ok(!checkPackage(good.replace('| 某论文 |', '|  |')).ok, 'check-package accepts an unsourced fact');
ok(!checkPackage(good.replace('已核', '待查')).ok, 'check-package accepts an unverified fact');

// Each film: score composes, cues are inside the film, effects exist, timeline is current, every caption is in the package.
for (const film of fs.readdirSync(path.join(root, 'films'), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)) {
  const dir = path.join(root, 'films', film);
  for (const f of ['content-package.md', 'treatment.md', 'score.mjs', 'Film.tsx', 'timeline.json']) ok(fs.existsSync(path.join(dir, f)), `${film}: missing ${f}`);
  if (!fs.existsSync(path.join(dir, 'score.mjs'))) continue;
  const { default: score } = await import(pathToFileURL(path.join(dir, 'score.mjs')).href);
  // Existing private tracks carry measured duration, sections and cues; do not synthesise them.
  const external = score.source?.kind === 'existing-private-track';
  if (external) {
    ok(Number.isFinite(score.duration) && score.duration > 0, film + ': external duration must be positive');
    ok(Number.isFinite(score.bpm) && score.bpm > 0, film + ': external BPM must be positive');
    for (const s of score.sections) ok(Number.isFinite(s.start) && Number.isFinite(s.end) && s.start >= 0 && s.end > s.start && s.end <= score.duration, film + ': invalid external section ' + s.id);
  }
  const plan = external ? {duration:score.duration,bpm:score.bpm,cues:score.cues,hits:(score.sfx || []).map(h=>({name:h.kind,t:score.cues[h.cue]}))} : compose(score);
  for (const [k, v] of Object.entries(plan.cues)) ok(v >= 0 && v <= plan.duration, `${film}: cue ${k} is outside the music`);
  for (const h of plan.hits) ok(SFX[h.name], `${film}: unknown effect ${h.name}`);
  const tl = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8'));
  ok(Math.abs(tl.duration - plan.duration) < 0.01 && tl.bpm === plan.bpm, `${film}: timeline is stale, run npm run music -- ${film}`);
  for (const [k, v] of Object.entries(plan.cues)) ok(Math.abs((tl.cues[k] ?? -1) - v) < 0.01, `${film}: cue ${k} differs from timeline, run npm run music -- ${film}`);
  const pkg = fs.readFileSync(path.join(dir, 'content-package.md'), 'utf8'), src = fs.readFileSync(path.join(dir, 'Film.tsx'), 'utf8');
  for (const m of src.matchAll(/QuietCaption[^>]*\btext="([^"]+)"/g)) ok(pkg.includes(m[1]), `${film}: caption is not in the content package: ${m[1]}`);
}
ok(Object.keys(VOICES).length > 0, 'no voices');

// Nothing private may be tracked. The only videos allowed are the original style-gallery clips in docs/gallery/ and the README samples in docs/showcase/.
const tracked = spawnSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).stdout.split('\n');
for (const f of tracked) ok(!/^references\/private\/|studio\.local\.json|profile\.local\.md/.test(f) && !(/\.(mp4|mov)$/.test(f) && !/^docs\/(gallery|showcase)\//.test(f)), `must not be tracked: ${f}`);

warns.forEach(w => console.log('warn: ' + w));
if (fails.length) { fails.forEach(f => console.log('FAIL: ' + f)); process.exit(1); }
console.log('doctor: all good');
