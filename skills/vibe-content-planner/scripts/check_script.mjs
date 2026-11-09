#!/usr/bin/env node
// 字幕稿体检：只查长度和格式，不判断内容好坏，也不预测能不能爆。
// 用法：node check_script.mjs <稿子.md|txt> [--seconds 120] [--voiceover] [--json]
// --voiceover：口播自然段只估时并检查正文，不套字幕首句/拆屏字数阈值。
// 字幕稿每行一屏，口播稿按自然段：可带 “- 8s ” 前缀；〔〕里是画面标注，不计入字数；# 开头和空行跳过。
import fs from 'node:fs';

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--seconds');
if (!file) { console.error('用法：node check_script.mjs <稿子> [--seconds 秒数] [--voiceover] [--json]'); process.exit(2); }
const secIdx = args.indexOf('--seconds');
const target = secIdx >= 0 ? Number(args[secIdx + 1]) : null;

export function parse(raw) {
  // 内容包只查正文一节；既有内容包保留“字幕稿”节名，独立稿也支持“口播稿”“配音稿”。
  const body = raw.replace(/\r\n/g, '\n').replace(/^---\n[\s\S]*?\n---\n/, '');
  const sec = body.match(/^## (?:字幕稿|口播稿|配音稿)\s*\n([\s\S]*?)(?=^## |(?![\s\S]))/m);
  const text = sec ? sec[1] : body;
  return text.split(/\r?\n/).map(l => l.trim())
    .filter(l => l && !l.startsWith('#') && !l.startsWith('---') && !l.startsWith('|'))
    .map(l => {
      const m = l.match(/^(?:[-*]\s*)?(?:(\d+(?:\.\d+)?)s\s+)?(.*)$/);
      return { t: m[1] != null ? Number(m[1]) : null, text: m[2].replace(/〔[^〕]*〕/g, '').replace(/（[^）]*待核对[^）]*）/g, '').trim() };
    }).filter(r => r.text);
}
const han = s => (s.match(/[一-龥]/g) || []).length;
const sentences = s => s.split(/(?<=[。？！?!])/).map(x => x.trim()).filter(Boolean);

export function check(rows, targetSec, { voiceover = false } = {}) {
  const issues = [], total = rows.reduce((s, r) => s + han(r.text), 0);
  const est = Math.round(total / 4.5);
  const first = rows[0]?.text || '';
  const firstHan = han(sentences(first)[0] || first);
  const last = rows[rows.length - 1]?.text || '';
  const longest = rows.reduce((m, r) => Math.max(m, ...r.text.split(/[，。；：！？,;:!?]/).map(han)), 0);
  const over = rows.filter(r => r.text.split(/[。！？?!]/).some(x => han(x) > 32));
  if (voiceover) {
    if (total === 0) issues.push('口播稿没有可读的中文正文，请检查正文与文件格式。');
  } else {
    if (firstHan > 24) issues.push(`第一句 ${firstHan} 字，2 秒内读不完。样本的第一句大多在 24 字以内。`);
    if (firstHan === 0) issues.push('第一屏没有文字。无字开头要靠画面撑，确认这是有意的。');
    if (longest > 20) issues.push(`最长一个分句 ${longest} 字，手机上容易读不完，建议拆屏。`);
    if (over.length) issues.push(`${over.length} 屏单句超过 32 字：${over.slice(0, 3).map(r => r.text.slice(0, 18) + '…').join(' / ')}`);
    if (targetSec) {
      const cps = total / targetSec;
      if (cps > 7) issues.push(`按 ${targetSec} 秒算 ${cps.toFixed(1)} 字/秒，偏快（样本长片中位约 5，含图内标签）。`);
      if (total > 150 && cps < 2.5) issues.push(`按 ${targetSec} 秒算 ${cps.toFixed(1)} 字/秒，偏慢，确认有足够的画面在撑。`);
    }
    // 带时间的稿子：查每屏停留
    const timed = rows.filter(r => r.t != null);
    if (timed.length >= 3) {
      let tight = 0;
      for (let i = 0; i + 1 < timed.length; i++) { const gap = timed[i + 1].t - timed[i].t; if (gap > 0 && han(timed[i].text) / gap > 10) tight++; }
      if (tight / timed.length > 0.2) issues.push(`${tight} 屏的停留时间不够读完（超过 10 字/秒），占 ${Math.round(tight / timed.length * 100)}%。`);
    }
  }
  const hasEvidence = /\d{4}\s*年|研究|实验|论文|《[^》]+》|参考/.test(rows.map(r => r.text).join(''));
  const endType = /[？?]\s*$/.test(last) ? '问句' : /评论|留言|写一|打在/.test(last) ? '评论任务' : '断言';
  const notes = []; if (total >= 200 && !hasEvidence) notes.push('长稿里没看到年份、研究或出处。情绪片可以没有；知识片要确认事实表已写。');
  return { mode: voiceover ? 'voiceover' : 'subtitle', screens: rows.length, totalHan: total, estSeconds: est, firstSentenceHan: firstHan, longestClause: longest, endType, hasEvidence, issues, notes };
}

if (process.argv[1] && process.argv[1].endsWith('check_script.mjs')) {
  const rows = parse(fs.readFileSync(file, 'utf8'));
  const r = check(rows, target, { voiceover: args.includes('--voiceover') });
  if (args.includes('--json')) { console.log(JSON.stringify(r)); process.exit(0); }
  if (r.mode === 'voiceover') console.log(`口播正文 ${r.totalHan} 字 · 按4.5字/秒粗估约 ${r.estSeconds} 秒，实际以试读或录音为准；不检查字幕拆屏字数。`);
  else console.log(`屏数 ${r.screens} · 总字数 ${r.totalHan} · 按 4.5 字/秒约 ${r.estSeconds} 秒 · 第一句 ${r.firstSentenceHan} 字 · 最长分句 ${r.longestClause} 字 · 结尾：${r.endType}`);
  if (r.issues.length) { console.log('\n需要判断：'); r.issues.forEach(i => console.log('- ' + i)); }
  else console.log(r.mode === 'voiceover' ? '\n正文格式未发现问题；事实、自然口语和实际时长仍需核对。' : '\n长度和格式没发现问题。这不代表内容好，还要自己读一遍。');
}
