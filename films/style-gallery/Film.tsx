// 画风图鉴：每种画风一段 8 秒（90 BPM 的 12 拍），演示这种画风的底色、光、人物和字的画法，以及它最典型的动效。
// 全部是原创示意：只取一类画风的共同特征，不复制任何一条参考片的镜头、人物、文案或构图。片段按段切出来放进图鉴页。
// 23 段按编号排列（第 15 类分 15 和 15b）；01、04、08 写在本文件，15b 在 seg15b.tsx，其余在 segs1–3.tsx。
import React from 'react';
import {AbsoluteFill, Audio, random, staticFile} from 'remotion';
import {MusicProvider, Timeline, useMusic} from '../../src/lib/music';
import {FONT} from '../../src/styles';
import timeline from './timeline.json';

import {back, clamp01, ease, easeIn, hit, Label, lerp, Line, Mark, seg, Seg, SEG} from './common';
import {Candle, RedStage, Plaster, LineMan, Ornate, BigNum, Blueprint} from './segs1';
import {Cinnabar, Vase, Puppet, Layers, HanFlat, FlatPeople} from './segs2';
import {Nature, OilPaint, Orbs, Chat, ColdScience, Pixel} from './segs3';
import {GeoNarrative} from './seg15b';

// ── 01 暗金物证：黑底、暖金虚光斑、桌面；证物卡滑上桌，金线连到人，计数滚动，红章落在强拍 ──
const DarkGold: React.FC<Seg> = ({u, B, c, base}) => {
  const L = (n: string) => c(n) - base;
  const card = back(seg(u, L('dgCard') - 0.45, 0.45), 1.4);
  const line = ease(seg(u, L('dgLine'), B));
  const pawn = back(seg(u, L('dgPawn'), 0.4), 2.4), pawn2 = back(seg(u, L('dgPawn') + 0.5 * B, 0.4), 2.4);
  const tag = back(seg(u, L('dgTag'), 0.35), 2.4);
  const count = Math.round(120 * ease(seg(u, L('dgCount') - 2 * B, 2 * B)));
  const stampP = seg(u, L('dgStamp') - 0.16, 0.16), stampHit = hit(u, L('dgStamp'), 7);
  const shake = Math.sin(u * 60) * 6 * stampHit;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 35%, #1b1a28 0%, #0a0a12 70%)'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="dgBlur"><feGaussianBlur stdDeviation="16" /></filter>
          <linearGradient id="dgTable" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2b2118" /><stop offset="1" stopColor="#120e0a" /></linearGradient>
          <filter id="dgGlow"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <g filter="url(#dgBlur)" opacity={ease(u / 1.2)}>
          {Array.from({length: 26}, (_, i) => {
            const x = random('bx' + i) * 1920 + Math.sin(u * 0.4 + i) * 30, y = random('by' + i) * 680 + Math.cos(u * 0.3 + i) * 20;
            return <circle key={i} cx={x} cy={y} r={30 + random('br' + i) * 80} fill={['#c9953a', '#e0b45a', '#a8743a', '#f0d08a'][i % 4]} opacity={0.1 + random('bo' + i) * 0.22} />;
          })}
        </g>
        <g transform={`translate(${shake} 0)`}>
          <rect x={0} y={700} width={1920} height={380} fill="url(#dgTable)" />
          <rect x={0} y={698} width={1920} height={3} fill="#6a5030" opacity={0.7} />
          {/* 证物卡 */}
          <ellipse cx={lerp(-300, 640, card)} cy={712} rx={170} ry={14} fill="#000" opacity={0.4 * card} />
          <g transform={`translate(${lerp(-300, 640, card)} 560) rotate(${lerp(-18, -6, card)})`}>
            <rect x={-150} y={-120} width={300} height={230} rx={4} fill="#efe6cf" />
            <rect x={-150} y={-120} width={300} height={10} fill="#a8321f" />
            <text x={-120} y={-70} fontFamily={FONT.serif} fontWeight={700} fontSize={30} fill="#3a2e22">实验记录</text>
            {[0, 1, 2, 3].map(i => <rect key={i} x={-120} y={-40 + i * 30} width={i === 3 ? 140 : 230} height={8} rx={4} fill="#3a2e22" opacity={0.22} />)}
            {stampP > 0 ? <g transform={`translate(40 40) rotate(-12) scale(${lerp(2.2, 1, easeIn(stampP)) * (1 + 0.08 * stampHit)})`} opacity={clamp01(stampP * 3)}>
              <rect x={-80} y={-36} width={160} height={72} rx={8} fill="none" stroke="#c0392b" strokeWidth={7} />
              <text x={0} y={18} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={48} fill="#c0392b">结论</text>
            </g> : null}
          </g>
          {/* 金线连到人 */}
          {line > 0 ? <g filter="url(#dgGlow)">
            <path d={`M 800 560 L ${lerp(800, 1290, line)} ${lerp(560, 620, line)}`} stroke="#e0b45a" strokeWidth={3} />
            <circle cx={lerp(800, 1290, line)} cy={lerp(560, 620, line)} r={7} fill="#ffe2a0" opacity={line < 1 ? 1 : 0.6} />
          </g> : null}
          {/* 人：奶白色棋子小人，旁边一个灰的作对比 */}
          {[[1320, pawn, '#f1e6cc', 1], [1520, pawn2, '#6c6a72', 0.82]].map(([x, a, col, s], i) => (a as number) > 0.01 ? (
            <g key={i} transform={`translate(${x} 700) scale(${(s as number) * (a as number)})`}>
              <ellipse cx={0} cy={0} rx={60} ry={10} fill="#000" opacity={0.35} />
              <path d="M -52 0 C -52 -70 -26 -96 0 -96 C 26 -96 52 -70 52 0 Z" fill={col as string} />
              <circle cx={0} cy={-128} r={30} fill={col as string} />
            </g>
          ) : null)}
          {tag > 0.01 ? <g transform={`translate(1320 470) scale(${tag})`}>
            <path d="M 0 40 L 0 70" stroke="#e0b45a" strokeWidth={2} />
            <rect x={-90} y={-24} width={180} height={52} rx={26} fill="rgba(20,16,10,.8)" stroke="#e0b45a" strokeWidth={2} />
            <text x={0} y={12} textAnchor="middle" fontFamily={FONT.serif} fontWeight={700} fontSize={28} fill="#f0d08a">关键一环</text>
          </g> : null}
          {u > L('dgCount') - 2 * B ? <g transform="translate(1640 300)">
            <text x={0} y={0} textAnchor="end" fontFamily={FONT.serif} fontWeight={900} fontSize={120} fill="#f0d08a" filter="url(#dgGlow)">{count}</text>
            <text x={10} y={0} fontFamily={FONT.serif} fontSize={34} fill="#c9a96a">份</text>
            <text x={0} y={46} textAnchor="end" fontFamily={FONT.sans} fontSize={22} fill="#8a7a60" letterSpacing={4}>样本数</text>
          </g> : null}
        </g>
      </svg>
      <Line u={u} from={B} to={SEG - 0.5} text="线索摆上桌面，结论落在拍上。" hl="结论" hlCol="#e0b45a" />
      <Label u={u} no="01" name="暗金物证" desc="黑底、暗金虚光斑、桌面；纸张、数字和小物件当证据" motion="证物滑上桌、金线连人、数字滚动、红章落在强拍" col="#f0d08a" />
    </AbsoluteFill>
  );
};

// ── 08 霓虹线图：紫黑星云、一条发光地平线；方块一拍一个，平台期之后曲线在强拍跃起 ──
const Neon: React.FC<Seg> = ({u, B, c, base}) => {
  const L = (n: string) => c(n) - base;
  const dotX = lerp(300, 1100, ease(u / (5 * B)));
  const toChart = ease(seg(u, L('nAxis') - 0.3, 0.6));
  const axis = ease(seg(u, L('nAxis'), 0.8 * B));
  const jump = L('nJump');
  // 曲线：平台段到第 7.5 拍走完，第 8 拍冲到顶
  const plateau = ease(seg(u, L('nAxis') + 0.5 * B, 2.5 * B)), rise = back(seg(u, jump - 0.3 * B, 0.3 * B), 1.2), tail = ease(seg(u, jump, 1.2 * B));
  const pts: [number, number][] = [];
  for (let i = 0; i <= 40; i++) { const f = i / 40; if (f > plateau) break; pts.push([440 + f * 700, 760 + Math.sin(f * 18) * 6]); }
  if (rise > 0) { pts.push([lerp(1140, 1330, clamp01(rise)), lerp(760, 360, rise)]); }
  if (tail > 0) pts.push([lerp(1330, 1470, tail), lerp(360, 330, tail)]);
  const head = pts[pts.length - 1];
  const ring = u >= jump ? seg(u, jump, 0.9) : -1;
  const num = back(seg(u, L('nNum'), 0.4), 2.6);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 30%, #261450 0%, #0c0722 55%, #05030f 100%)'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <filter id="nBlur"><feGaussianBlur stdDeviation="40" /></filter>
          <filter id="nGlow"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <g filter="url(#nBlur)" opacity={0.55}>
          <ellipse cx={600 + Math.sin(u * 0.3) * 60} cy={300} rx={420} ry={180} fill="#5a2a9a" />
          <ellipse cx={1400 + Math.cos(u * 0.25) * 60} cy={420} rx={360} ry={150} fill="#3a1c78" />
        </g>
        {Array.from({length: 60}, (_, i) => <circle key={i} cx={random('sx' + i) * 1920} cy={random('sy' + i) * 1080} r={1 + random('sr' + i) * 1.5} fill="#fff" opacity={0.15 + 0.3 * Math.abs(Math.sin(u * 1.5 + i))} />)}
        {/* 地平线、光点、一拍一个的方块 */}
        <g opacity={1 - toChart}>
          <path d="M 200 560 L 1720 560" stroke="#e9e4ff" strokeWidth={2.5} filter="url(#nGlow)" opacity={ease(u / 0.6)} />
          <circle cx={dotX} cy={560} r={8} fill="#f6ffd8" filter="url(#nGlow)" />
          <path d={`M ${dotX} 548 L ${dotX + 40} 500 L ${dotX + 150} 500`} stroke="#b9b2d8" strokeWidth={1.5} fill="none" opacity={ease(seg(u, B, 0.5))} />
          <text x={dotX + 50} y={492} fontFamily="Consolas, monospace" fontSize={22} fill="#cfc8ee" opacity={ease(seg(u, B, 0.5))}>DAY {String(Math.min(90, Math.round(u / B) * 9)).padStart(3, '0')}</text>
          {['nb1', 'nb2', 'nb3', 'nb4'].map((k, i) => { const a = back(seg(u, L(k), 0.3), 2.6); return a > 0.01 ? <g key={k} transform={`translate(${760 + i * 74} 612) scale(${a})`}><rect x={-30} y={-30} width={60} height={60} rx={6} fill="rgba(182,243,106,.14)" stroke="#b6f36a" strokeWidth={2.5} filter="url(#nGlow)" /></g> : null; })}
        </g>
        {/* 坐标轴和平台期曲线 */}
        {toChart > 0 ? <g opacity={toChart}>
          <path d={`M 420 ${lerp(860, 300, axis)} L 420 860 L ${lerp(420, 1520, axis)} 860`} stroke="#9d96c4" strokeWidth={2.5} fill="none" />
          <text x={430} y={290} fontFamily={FONT.sans} fontSize={22} fill="#9d96c4" opacity={axis}>能力</text>
          <text x={1520} y={900} textAnchor="end" fontFamily={FONT.sans} fontSize={22} fill="#9d96c4" opacity={axis}>时间</text>
          {pts.length > 1 ? <path d={'M ' + pts.map(p => p.join(' ')).join(' L ')} stroke="#c8f57a" strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#nGlow)" /> : null}
          {pts.length > 0 ? <circle cx={head[0]} cy={head[1]} r={11} fill="#f6ffd8" filter="url(#nGlow)" /> : null}
          {ring >= 0 && ring < 1 ? <ellipse cx={1330} cy={360} rx={60 + ring * 240} ry={(60 + ring * 240) * 0.35} fill="none" stroke="#c8f57a" strokeWidth={4 * (1 - ring)} opacity={1 - ring} /> : null}
          {plateau > 0.3 ? <g opacity={ease((plateau - 0.3) * 3)}><path d="M 780 740 L 780 690" stroke="#9d96c4" strokeWidth={1.5} /><text x={780} y={680} textAnchor="middle" fontFamily={FONT.sans} fontSize={24} fill="#cfc8ee">平台期</text></g> : null}
          {num > 0.01 ? <g transform={`translate(1560 300) scale(${num})`}><text textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={130} fill="#c8f57a" filter="url(#nGlow)">10×</text></g> : null}
        </g> : null}
      </svg>
      <Line u={u} from={B} to={SEG - 0.5} text="看似原地踏步，直到某一拍突然跃起。" hl="突然跃起" hlCol="#ff86b4" />
      <Label u={u} no="08" name="霓虹线图" desc="紫黑星云、发光细线和图表，数据就是画面" motion="光点沿线走、方块一拍一个、曲线平台后在强拍跃起、光环扩散" col="#c8f57a" />
    </AbsoluteFill>
  );
};

// ── 04 暗场聚光小人：一束光照着一个无脸小人；光收窄，镜头退开，每个人都有自己的一束光 ──
const Bean: React.FC<{x: number; y: number; col: string; s?: number; sx?: number; sy?: number; tilt?: number}> = ({x, y, col, s = 1, sx = 1, sy = 1, tilt = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${s * sx} ${s * sy}) rotate(${tilt} 0 -60)`}>
    <rect x={-24} y={-78} width={48} height={78} rx={24} fill={col} />
    <circle cx={0} cy={-104} r={24} fill={col} />
  </g>
);
const Cone: React.FC<{x: number; w: number; a: number; warm?: boolean; floorY?: number}> = ({x, w, a, warm = true, floorY = 860}) => {
  const col = warm ? '255,214,140' : '170,190,255';
  return a > 0.01 ? <g opacity={a}>
    <path d={`M ${x - 40} 0 L ${x + 40} 0 L ${x + w} ${floorY} L ${x - w} ${floorY} Z`} fill={`url(#cone${warm ? 'W' : 'C'})`} />
    <ellipse cx={x} cy={floorY} rx={w} ry={w * 0.17} fill={`rgba(${col},0.32)`} />
  </g> : null;
};
const Spot: React.FC<Seg> = ({u, B, c, base}) => {
  const L = (n: string) => c(n) - base;
  const on = u < L('sOn') + 0.5 ? [0, 0.6, 0.15, 0.9, 0.5, 1][Math.min(5, Math.floor(u / 0.08))] : 1;
  const hop = (at: number) => { const v = (u - (at - 0.3 * B)) / (0.3 * B); return v > 0 && v < 1 ? Math.sin(v * Math.PI) : 0; };
  const air = hop(L('sStep')), land = hit(u, L('sStep'), 10);
  const look = Math.sin(seg(u, L('sStep') + B, 1.2 * B) * Math.PI * 2) * 10;
  const narrow = ease(seg(u, L('sNarrow'), B));
  const backP = ease(seg(u, L('sBack') - 0.5 * B, 1.2 * B));
  const z = lerp(1.25, 0.6, backP);
  const others: [number, number, string][] = [[360, 900, '#8fa3d8'], [620, 820, '#c39ad6'], [1300, 820, '#8fc8b8'], [1560, 900, '#d8a28f'], [180, 760, '#b8b0e0'], [1760, 760, '#a3c3e8']];
  return (
    <AbsoluteFill style={{background: '#090b18'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="coneW" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(255,214,140,.55)" /><stop offset="1" stopColor="rgba(255,214,140,.06)" /></linearGradient>
          <linearGradient id="coneC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(170,190,255,.35)" /><stop offset="1" stopColor="rgba(170,190,255,.04)" /></linearGradient>
        </defs>
        <g transform={`translate(960 640) scale(${z}) translate(-960 -720)`}>
          <rect x={-2000} y={860} width={6000} height={1200} fill="#11142a" />
          {others.map(([x, y, col], i) => { const a = ease(seg(u, L('sOthers') + i * 0.22, 0.4)); return <g key={i}><Cone x={x} w={120} a={a * 0.8} warm={false} floorY={y} /><g opacity={0.05 + 0.95 * a}><Bean x={x} y={y} col={col} s={0.9} tilt={i % 2 ? 6 : -6} /></g></g>; })}
          <Cone x={960} w={lerp(240, 140, narrow)} a={on * (1 - 0.25 * narrow)} />
          <Bean x={960} y={860 - air * 60} col="#f2a23a" sx={1 + land * 0.12 - air * 0.06} sy={1 - land * 0.14 + air * 0.08 - narrow * 0.06} tilt={look - narrow * 6} />
        </g>
        <rect x={0} y={0} width={1920} height={1080} fill="url(#vigSpot)" opacity={0} />
      </svg>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 60%, transparent 40%, rgba(0,0,0,.55) 100%)', opacity: 0.6 + 0.4 * narrow * (1 - backP)}} />
      <Line u={u} from={B} to={L('sBack') - 0.3} text="一束光，只照着一个人。" />
      <Line u={u} from={L('sBack') + 0.2} to={SEG - 0.4} text="退远一点，每个人都有自己的光。" hl="自己的光" hlCol="#ffd48c" />
      <Label u={u} no="04" name="暗场聚光小人" desc="暗底、一束光孤立一个无脸小人" motion="灯闪着亮起、小人一跳、光收窄、镜头退开一盏盏亮起" col="#ffd48c" />
    </AbsoluteFill>
  );
};

const SEGMENTS: React.FC<Seg>[] = [DarkGold, Candle, RedStage, Spot, Plaster, LineMan, Ornate, Neon, BigNum, Blueprint, Cinnabar, Vase, Puppet, Layers, HanFlat, GeoNarrative, FlatPeople, Nature, OilPaint, Orbs, Chat, ColdScience, Pixel];

const Scene: React.FC = () => {
  const m = useMusic();
  const t = m.t, B = m.beatSec, c = m.cue as (n: string) => number;
  const i = Math.min(SEGMENTS.length - 1, Math.floor(t / SEG)), base = i * SEG, u = t - base;
  const S = SEGMENTS[i];
  // 每段单独切成片段，所以每段自己从黑里进、退回黑里
  const fade = clamp01(u / 0.2) * clamp01((SEG - u) / 0.2);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <AbsoluteFill style={{opacity: fade}}><S u={u} B={B} c={c} base={base} /></AbsoluteFill>
      <Mark dark={[14, 17, 20].includes(i)} />
    </AbsoluteFill>
  );
};

export const Film: React.FC = () => (
  <MusicProvider timeline={timeline as Timeline}>
    <Audio src={staticFile('films/style-gallery/audio.wav')} />
    <Scene />
  </MusicProvider>
);
export const meta = {id: 'style-gallery', timeline: timeline as Timeline};
