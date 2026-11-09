#!/usr/bin/env node
// Is a content package ready for production? Status set, topic card complete, every fact sourced.
// Usage: node tools/check-package.mjs <file> [--json]. Exit code 1 when it is not ready.
import fs from 'node:fs';

export function checkPackage(text) {
  const fails = [], s = text.replace(/\r\n/g, '\n');
  const status = (s.match(/^status:\s*"?([^"\n]+)"?\s*$/m) || [])[1]?.trim();
  if (!['待制作', '制作中'].includes(status)) fails.push(`状态是“${status ?? '缺失'}”，要确认稿子、改成“待制作”后才能开做`);
  const section = n => { const m = s.match(new RegExp(`^## ${n}\\s*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm')); return m ? m[1].trim() : null; };
  const card = section('选题卡'), script = section('字幕稿'), facts = section('事实表');
  if (card == null) fails.push('缺“选题卡”');
  else for (const k of ['目标', '片型', '时长', '声音形式', '贯穿物']) {
    const m = card.match(new RegExp(`^-\\s*${k}[：:]\\s*(.*)$`, 'm'));
    if (!m || !m[1].trim() || /^(约\s*__|_+)/.test(m[1].trim())) fails.push(`选题卡缺“${k}”`);
    else if (k === '声音形式' && m[1].includes('/')) fails.push('声音形式没选定（纯字幕或配音）');
  }
  if (script == null) fails.push('缺“字幕稿”'); else if ((script.match(/[一-龥]/g) || []).length < 5) fails.push('字幕稿是空的');
  if (facts == null) fails.push('缺“事实表”');
  else {
    const rows = facts.split('\n').filter(l => l.startsWith('|')).slice(2).map(l => l.split('|').slice(1, -1).map(c => c.trim()));
    if (!rows.length && !/无需核查/.test(facts)) fails.push('事实表是空的；确实没有可查的事实时，写明“无需核查的事实”和原因');
    rows.forEach((r, i) => {
      if (!r[1]) fails.push(`事实表第 ${i + 1} 行没有来源：${(r[0] || '').slice(0, 20)}`);
      if (/待查|未核/.test(r[2] || '')) fails.push(`事实表第 ${i + 1} 行还没核实：${(r[0] || '').slice(0, 20)}`);
    });
  }
  return { ok: fails.length === 0, status, fails };
}

if (process.argv[1]?.endsWith('check-package.mjs')) {
  const args = process.argv.slice(2), f = args.find(a => !a.startsWith('--'));
  if (!f) { console.error('Usage: node tools/check-package.mjs <file> [--json]'); process.exit(2); }
  const r = checkPackage(fs.readFileSync(f, 'utf8'));
  if (args.includes('--json')) console.log(JSON.stringify(r));
  else if (r.ok) console.log('内容包可以交制作。');
  else { console.log('还不能交制作：'); r.fails.forEach(x => console.log('- ' + x)); }
  process.exit(r.ok ? 0 : 1);
}
