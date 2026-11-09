#!/usr/bin/env node
// 把 skills/ 里的两个 Skill 装进 Agent 的技能目录。
//   node setup/install-skills.mjs                 自动：装进本机已经有的 Agent（看它们的配置目录在不在）
//   node setup/install-skills.mjs --agent claude  指定一个或几个，用逗号分开：claude,codex,kimi,agents,trae,workbuddy
//   node setup/install-skills.mjs --list          只列出会装到哪里，不动文件
// 装进去的那份 SKILL.md 开头会写上本机的工程位置，所以在别的文件夹里打开 Agent 也找得到工程。
// 目标位置已经有同名 Skill 时，旧的先移到 ~/.vibe-studio-backup/ 再装，不会直接覆盖。工程搬家或更新后重新运行一次即可。
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const home = os.homedir();
const SKILLS = ['vibe-content-planner', 'vibe-video-producer'];
const TARGETS = {
  claude: { name: 'Claude Code', dir: path.join(home, '.claude', 'skills'), detect: path.join(home, '.claude') },
  codex: { name: 'Codex', dir: path.join(home, '.codex', 'skills'), detect: path.join(home, '.codex') },
  kimi: { name: 'Kimi Code', dir: path.join(home, '.kimi-code', 'skills'), detect: path.join(home, '.kimi-code') },
  agents: { name: '通用目录 ~/.agents/skills（Kimi Code 等会读）', dir: path.join(home, '.agents', 'skills'), detect: path.join(home, '.agents') },
  trae: { name: 'TRAE（本工程的 .trae/skills）', dir: path.join(root, '.trae', 'skills'), detect: null },
  workbuddy: { name: 'WorkBuddy（打成 ZIP，在技能面板里导入）', dir: path.join(root, 'out', 'skills-zip'), detect: null, zip: true },
};

const args = process.argv.slice(2);
const get = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
const listOnly = args.includes('--list');
let want = (get('--agent') || 'auto').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
if (want.includes('all')) want = Object.keys(TARGETS);
if (want.includes('auto')) want = [...Object.keys(TARGETS).filter(k => TARGETS[k].detect && fs.existsSync(TARGETS[k].detect)), 'trae', 'workbuddy'];
const bad = want.filter(k => !TARGETS[k]);
if (bad.length) { console.error(`不认识的 Agent：${bad.join(', ')}。可选：${Object.keys(TARGETS).join(', ')}, all, auto`); process.exit(1); }

// 逐个文件复制：有的 Node 版本 fs.cpSync 遇到中文路径会直接退出
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}
const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
const projectNote = `\n> 本机工程位置：\`${root.replace(/\\/g, '/')}\`。所有命令都在这个目录里运行；不在这个目录时先切过去。（安装脚本写入；工程搬家后在新位置运行 \`node setup/install-skills.mjs\`）\n`;
function stampSkill(dir) {
  const f = path.join(dir, 'SKILL.md');
  const s = fs.readFileSync(f, 'utf8');
  const m = s.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  fs.writeFileSync(f, m ? m[0] + projectNote + s.slice(m[0].length) : projectNote + s);
}
function zipDir(src, out) {
  fs.rmSync(out, { force: true });
  const items = fs.readdirSync(src); // SKILL.md 要在 ZIP 根目录
  const tries = process.platform === 'win32'
    ? [[path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe'), ['-a', '-c', '-f', out, ...items], src],
       ['powershell', ['-NoProfile', '-Command', `Compress-Archive -Path '${src.replace(/'/g, "''")}\\*' -DestinationPath '${out.replace(/'/g, "''")}' -Force`]]]
    : [['zip', ['-qr', out, ...items], src], ['ditto', ['-c', '-k', '.', out], src], ['tar', ['--format=zip', '-c', '-f', out, ...items], src]];
  for (const [cmd, a, cwd] of tries) if (spawnSync(cmd, a, { cwd, stdio: 'ignore' }).status === 0 && fs.existsSync(out)) return true;
  return false;
}

for (const s of SKILLS) if (!fs.existsSync(path.join(root, 'skills', s, 'SKILL.md'))) { console.error(`工程里缺 skills/${s}/SKILL.md，先确认工程是完整的。`); process.exit(1); }
if (!want.length) console.log('没有发现已安装的 Agent。用 --agent 指定，例如 --agent claude。');
const done = [];
for (const k of want) {
  const t = TARGETS[k];
  console.log(`\n${t.name} → ${t.dir}`);
  if (listOnly) continue;
  fs.mkdirSync(t.dir, { recursive: true });
  let allOk = true;
  for (const s of SKILLS) {
    const tmp = path.join(os.tmpdir(), `vibe-skill-${process.pid}-${s}`);
    fs.rmSync(tmp, { recursive: true, force: true });
    copyDir(path.join(root, 'skills', s), tmp);
    stampSkill(tmp);
    if (t.zip) {
      const out = path.join(t.dir, `${s}.zip`);
      if (zipDir(tmp, out)) console.log(`  打包好了 ${out}`);
      else { allOk = false; console.log(`  !! 打包失败：在 WorkBuddy 技能面板里直接导入文件夹 ${path.join(root, 'skills', s)}`); }
    } else {
      const dst = path.join(t.dir, s);
      if (fs.existsSync(dst)) {
        // 备份放到技能目录外面，不然 Agent 会读到两个同名 Skill
        const bak = path.join(home, '.vibe-studio-backup', k, `${s}-${stamp}`);
        fs.mkdirSync(path.dirname(bak), { recursive: true });
        try { fs.renameSync(dst, bak); } catch { copyDir(dst, bak); fs.rmSync(dst, { recursive: true, force: true }); }
        console.log(`  旧版移到 ${bak}`);
      }
      copyDir(tmp, dst);
      console.log(`  装好了 ${s}`);
    }
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  if (allOk) done.push(t.name);
}
if (!listOnly && done.length) {
  if (!fs.existsSync(path.join(root, 'profile.local.md')) && fs.existsSync(path.join(root, 'profile.example.md'))) {
    fs.copyFileSync(path.join(root, 'profile.example.md'), path.join(root, 'profile.local.md'));
    console.log('\n已建 profile.local.md（你的账号规则，照里面的提示填；不填也能用）');
  }
  console.log(`\nSkill 装好了：${done.join('、')}。重启一下 Agent（或新开一个对话）让它读到新 Skill，然后可以这样说：`);
  console.log('  用 vibe-video-producer，把 examples/peak-end-package.md 做成一条约 20 秒的样片。');
}
