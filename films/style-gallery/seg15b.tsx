// 画风图鉴 · 15b 彩色几何平涂图解叙事（画风库第 15 类里“图解叙事”这一支）。
// 只取这一支的共同画法：渐变天空、浅色太阳、层叠远山；白色无脸几何小人成排；左上角大段叙述字一行行亮出、关键词上色加下划线；
// 金色引线名牌、主角身上的光环、角落大数字、收尾的金框信息卡。内容全是新写的示意，不用任何参考片的故事、文案或构图。
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp01, ease, FONT, Label, lerp, popAt, seg, Seg} from './common';

const OUTLINE = '0 0 2px #23202e, 3px 0 0 #23202e, -3px 0 0 #23202e, 0 3px 0 #23202e, 0 -3px 0 #23202e, 2px 2px 0 #23202e, -2px 2px 0 #23202e, 2px -2px 0 #23202e, -2px -2px 0 #23202e, 0 6px 14px rgba(20,16,30,.45)';
const HL: Record<string, string> = {g: '#f2c14e', b: '#8fc3ea', r: '#e8553f'};
// 叙述字：每段文字有自己亮出的拍；{g:词} {b:词} {r:词} 上色加下划线
const NARR: [number, string][] = [[0.5, '一支{g:三百人}的队伍，'], [2, '天亮从{b:北门}出发，'], [4, '走了整整{r:三天}。']];
const rich = (s: string) => s.split(/(\{[gbr]:[^}]+\})/).filter(Boolean).map((p, i) => {
  const m = p.match(/^\{([gbr]):([^}]+)\}$/);
  return m ? <span key={i} style={{color: HL[m[1]], textDecoration: 'underline', textDecorationColor: HL[m[1]], textDecorationThickness: 5, textUnderlineOffset: 12}}>{m[2]}</span> : <span key={i}>{p}</span>;
});

// 白色无脸几何小人：圆头、深色帽、梯形袍、细腿；举旗的多一根杆
const Walker: React.FC<{x: number; y: number; s: number; t: number; flag?: boolean; lead?: boolean}> = ({x, y, s, t, flag, lead}) => {
  const ph = Math.sin(t * 7 + x * 0.05);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={2} rx={30} ry={5} fill="#000" opacity={0.15} />
      <path d={`M -7 -60 L ${-9 - 8 * ph} 0 M 7 -60 L ${9 + 8 * ph} 0`} stroke="#f2efe8" strokeWidth={8} strokeLinecap="round" />
      <path d="M -14 -150 L 14 -150 L 30 -56 L -30 -56 Z" fill={lead ? '#f6f1e6' : '#ece7dc'} />
      {lead ? <path d="M -12 -146 L 24 -64" stroke="#c8402e" strokeWidth={7} strokeLinecap="round" /> : <rect x={-16} y={-112} width={32} height={6} fill="#8fa3c4" />}
      <circle cx={0} cy={-172} r={19} fill="#f6f3ec" />
      <path d="M -20 -174 A 20 20 0 0 1 20 -174 Z" fill="#2f3a5c" />
      <circle cx={0} cy={-196} r={6} fill="#c8402e" />
      {flag ? <g><path d="M 22 -120 L 22 -300" stroke="#6b4a2a" strokeWidth={5} /><path d="M 22 -300 L 92 -292 L 88 -246 L 22 -252 Z" fill="#c8402e" /><text x={56} y={-262} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={30} fill="#fff4e6">北</text></g> : null}
    </g>
  );
};

export const GeoNarrative: React.FC<Seg> = ({u, B}) => {
  const dusk = ease(seg(u, 8 * B - 0.4, B));
  const rows = [1, 2, 3, 4].map(k => ease(seg(u, k * B - 0.45, 0.45)));
  const march = u * 26;
  const lead = popAt(u, B, 6, 0.4, 2);
  const tag = ease(seg(u, 6 * B + 0.1, 0.4 * B));
  const num = popAt(u, B, 3, 0.3, 2.4);
  const cards: [string, string, string][] = [['人', '三百人', '一支队伍'], ['路', '三天', '天亮出发'], ['门', '北门', '出发的地方']];
  const sky = (a: string, b: string) => `rgb(${[0, 1, 2].map(i => Math.round(lerp(parseInt(a.slice(1 + i * 2, 3 + i * 2), 16), parseInt(b.slice(1 + i * 2, 3 + i * 2), 16), dusk))).join(',')})`;
  return (
    <AbsoluteFill style={{background: `linear-gradient(${sky('#6f9fd6', '#5d5a8e')} 0%, ${sky('#c8d6e2', '#e8946e')} 55%, ${sky('#ecd9b4', '#f3c48a')} 100%)`}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <circle cx={lerp(1380, 1240, dusk)} cy={lerp(300, 560, dusk)} r={150} fill={lerp(0, 1, dusk) > 0.5 ? '#fbd8a8' : '#fbecc8'} opacity={0.22} />
        <circle cx={lerp(1380, 1240, dusk)} cy={lerp(300, 560, dusk)} r={78} fill="#fbecc8" opacity={0.95} />
        <path d="M -40 640 C 260 540 520 600 800 560 C 1100 520 1400 600 1960 560 L 1960 760 L -40 760 Z" fill={dusk > 0.5 ? '#7d6f9e' : '#9aa6c6'} opacity={0.8} />
        <path d="M -40 700 C 300 640 700 690 1100 660 C 1450 640 1700 680 1960 670 L 1960 780 L -40 780 Z" fill={dusk > 0.5 ? '#665d88' : '#7f8db4'} opacity={0.85} />
        <rect x={0} y={760} width={1920} height={320} fill={dusk > 0.5 ? '#c99a6a' : '#dcbc8a'} />
        {Array.from({length: 14}, (_, i) => <rect key={i} x={(i * 211 + 40) % 1900} y={800 + (i % 5) * 50} width={70 + (i % 4) * 40} height={4} rx={2} fill="#c49a62" opacity={0.6} />)}
        {/* 一排排小人一拍一排走进来 */}
        {rows.map((a, r) => a > 0.01 ? <g key={r} opacity={a} transform={`translate(${lerp(-500, 0, a) + march * 0.4} 0)`}>
          {Array.from({length: 9}, (_, i) => <Walker key={i} x={140 + i * 82 + (r % 2) * 41} y={800 + r * 46} s={0.62 + r * 0.06} t={u} flag={r === 3 && i === 8} />)}
        </g> : null)}
        {/* 领队：站出来、光环、金色引线名牌 */}
        {lead > 0.01 ? <g>
          {[0, 1, 2].map(i => { const ph = (u * 0.8 + i / 3) % 1; return <circle key={i} cx={1180} cy={720} r={50 + ph * 150} fill="none" stroke="#f2c14e" strokeWidth={3 * (1 - ph)} opacity={(1 - ph) * lead} />; })}
          <g transform={`translate(0 ${(1 - lead) * 40})`} opacity={clamp01(lead)}><Walker x={1180} y={940} s={1.15} t={u * 0.3} lead /></g>
          <path d={`M 1180 690 L ${lerp(1180, 1300, tag)} ${lerp(690, 600, tag)}`} stroke="#f2c14e" strokeWidth={3} />
          <circle cx={1180} cy={690} r={5} fill="#f2c14e" />
          <text x={1330} y={598} fontFamily={FONT.serif} fontWeight={900} fontSize={44} fill="#f2c14e" stroke="#23202e" strokeWidth={8} paintOrder="stroke" opacity={tag}>领队</text>
        </g> : null}
        {/* 角落大数字 */}
        {num > 0.01 ? <g transform={`translate(1700 470) scale(${num})`}>
          <text textAnchor="end" fontFamily={FONT.serif} fontWeight={900} fontSize={130} fill="#cfe6ff" stroke="#23202e" strokeWidth={10} paintOrder="stroke">300</text>
          <text x={8} textAnchor="start" fontFamily={FONT.serif} fontWeight={900} fontSize={48} fill="#cfe6ff" stroke="#23202e" strokeWidth={8} paintOrder="stroke">人</text>
        </g> : null}
        {/* 收尾：黄昏里三张金框卡，一拍一张 */}
        {dusk > 0.05 ? <rect x={0} y={0} width={1920} height={1080} fill="#1c1626" opacity={0.28 * dusk} /> : null}
        {cards.map(([g, label, sub], i) => { const a = popAt(u, B, 8 + i, 0.35, 2.2); return a > 0.01 ? <g key={g} transform={`translate(${620 + i * 340} 600) scale(${a})`}>
          <rect x={-140} y={-150} width={280} height={300} rx={16} fill="#2c2a3e" opacity={0.94} stroke="#f2c14e" strokeWidth={4} />
          <circle cx={0} cy={-68} r={48} fill="#3a3650" stroke="#f2c14e" strokeWidth={4} />
          <text y={-50} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={52} fill="#f2c14e">{g}</text>
          <text y={50} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={44} fill="#fbf7ee">{label}</text>
          <text y={100} textAnchor="middle" fontFamily={FONT.serif} fontWeight={700} fontSize={26} fill="#f2c14e">{sub}</text>
        </g> : null; })}
      </svg>
      {/* 左上角叙述字块：这一画风里它就是字幕 */}
      <div style={{position: 'absolute', left: 96, top: 84, fontFamily: FONT.serif, fontWeight: 900, fontSize: 64, lineHeight: 1.52, color: '#fbf7ee', textShadow: OUTLINE, letterSpacing: 2, opacity: 1 - ease(seg(u, 7.7 * B, 0.4 * B))}}>
        {NARR.map(([k, s], i) => { const a = clamp01((u - k * B) / 0.22); return <div key={i} style={{opacity: a, transform: `translateY(${(1 - a) * 14}px)`}}>{rich(s)}</div>; })}
      </div>
      <div style={{position: 'absolute', left: 96, top: 84, fontFamily: FONT.serif, fontWeight: 900, fontSize: 64, lineHeight: 1.52, color: '#fbf7ee', textShadow: OUTLINE, letterSpacing: 2, opacity: ease(seg(u, 8 * B, 0.4 * B))}}>
        {rich('第三天黄昏，{g:北门}到了。')}
      </div>
      <Label u={u} no="15b" name="彩色几何平涂图解叙事" desc="渐变天空、无脸几何小人成排，左上角大段叙述字就是字幕" motion="字一行行亮出关键词上色、小人一拍一排走进、领队光环加引线名牌、大数字、黄昏金卡" col="#f2c14e" right shade />
    </AbsoluteFill>
  );
};
