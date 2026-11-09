// 画风图鉴 · 02 03 05 06 07 09 10。每段 12 拍，k 拍 = k × B 秒；只演示一类画风的共同画法和动效，不复制具体参考片。
import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {back, beatPulse, clamp01, ease, easeIn, easeInOut, FONT, hit, Label, lerp, Line, popAt, seg, Seg, SEG} from './common';

// ── 02 烛光暖金光影：一根火柴划亮，蜡烛点着，暖光照出伏案的剪影，字从火光里浮起来 ──
export const Candle: React.FC<Seg> = ({u, B}) => {
  const strike = u >= B ? Math.exp(-(u - B) * 6) : 0;
  const lit = ease(seg(u, 2 * B - 0.2, 0.6));
  const flick = 1 + Math.sin(u * 23) * 0.04 + Math.sin(u * 37) * 0.03;
  const glowR = 260 + 520 * lit;
  const words: [string, number, number, number][] = [['专注', 760, 470, 5], ['耐心', 1150, 420, 6], ['夜', 860, 360, 7]];
  const big = popAt(u, B, 8, 0.3, 2.6);
  return (
    <AbsoluteFill style={{background: '#070504'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <radialGradient id="cGlow"><stop offset="0" stopColor="rgba(255,190,110,.75)" /><stop offset="0.4" stopColor="rgba(220,140,60,.25)" /><stop offset="1" stopColor="rgba(0,0,0,0)" /></radialGradient>
          <filter id="cBlur"><feGaussianBlur stdDeviation="4" /></filter>
        </defs>
        <circle cx={1000} cy={660} r={glowR * flick} fill="url(#cGlow)" opacity={lit} />
        {/* 伏案的剪影和长影子 */}
        <g opacity={0.15 + 0.85 * lit}>
          <path d="M 520 760 L 1180 760 L 1180 790 L 520 790 Z" fill="#1c130c" />
          <path d="M 600 760 C 600 640 640 600 700 590 C 720 560 760 545 790 560 C 830 580 830 630 800 650 C 860 670 880 720 880 760 Z" fill="#0d0907" />
          <path d="M 880 760 L 300 980 L 120 980 L 600 760 Z" fill="#000" opacity={0.35 * lit} />
        </g>
        {/* 蜡烛 */}
        <rect x={985} y={690} width={30} height={70} rx={4} fill="#e8d6b0" />
        {lit > 0.01 ? <g transform={`translate(1000 ${688}) scale(${lit * flick})`}>
          <path d="M 0 -50 C 14 -28 12 -8 0 0 C -12 -8 -14 -28 0 -50 Z" fill="#ffcf73" />
          <path d="M 0 -32 C 6 -20 5 -8 0 -3 C -5 -8 -6 -20 0 -32 Z" fill="#fff4d0" />
        </g> : null}
        {/* 火柴划亮的火星 */}
        {strike > 0.02 ? Array.from({length: 14}, (_, i) => { const a = random('cs' + i) * Math.PI * 2, r = (1 - strike) * 160; return <circle key={i} cx={1000 + Math.cos(a) * r} cy={640 + Math.sin(a) * r * 0.6} r={3} fill="#ffd38a" opacity={strike} />; }) : null}
        {/* 字从火光里浮起来 */}
        {words.map(([w, x, y, k]) => { const a = ease(seg(u, k * B - 0.3, 0.8)); return a > 0.01 ? <text key={w} x={x} y={y - a * 30} textAnchor="middle" fontFamily={FONT.serif} fontWeight={700} fontSize={54} fill="#f2c27a" opacity={a * (1 - 0.5 * clamp01((u - 8 * B) / B))} filter="url(#cBlur)">{w}</text> : null; })}
        {words.map(([w, x, y, k]) => { const a = ease(seg(u, k * B - 0.3, 0.8)); return a > 0.01 ? <text key={'s' + w} x={x} y={y - a * 30} textAnchor="middle" fontFamily={FONT.serif} fontWeight={700} fontSize={54} fill="#ffe2b0" opacity={a * (1 - 0.5 * clamp01((u - 8 * B) / B))}>{w}</text> : null; })}
        {big > 0.01 ? <text x={1000} y={300} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={120 * big} fill="#ffd89a" style={{filter: 'drop-shadow(0 0 24px rgba(255,190,110,.8))'}}>知行</text> : null}
      </svg>
      <Line u={u} from={2 * B} to={SEG - 0.4} text="一点火光，照出一个人的夜晚。" hl="火光" hlCol="#ffc56e" />
      <Label u={u} no="02" name="烛光暖金光影" desc="大面积黑、一处暖金主光、写实的光感和剪影" motion="火柴划亮、烛光铺开、剪影显形、字从火光里浮起" col="#ffc56e" />
    </AbsoluteFill>
  );
};

// ── 03 红黑戏剧舞台：红色透视跑道一拍拍画出来，舞台灯压下来，白色小人走到台中，大字砸下 ──
export const RedStage: React.FC<Seg> = ({u, B}) => {
  const lines = ease(seg(u, 0, 2 * B));
  const walk = ease(seg(u, 3 * B, 4 * B));
  const step = Math.sin(seg(u, 3 * B, 4 * B) * Math.PI * 8);
  const lights = ease(seg(u, 7 * B, 0.4));
  const big = back(seg(u, 8 * B - 0.2, 0.2), 1.4), bigHit = hit(u, 8 * B, 6);
  const shake = Math.sin(u * 70) * 8 * bigHit;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#0b0405, #2a0708 55%, #4a0d0e)'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${shake} 0)`}>
          <path d="M 0 520 L 1920 520 L 1920 1080 L 0 1080 Z" fill="#7a1414" />
          {[-5, -3, -1, 1, 3, 5].map((k, i) => { const x2 = 960 + k * 420; return <path key={i} d={`M ${960 + k * 30} 520 L ${lerp(960 + k * 30, x2, lines)} ${lerp(520, 1080, lines)}`} stroke="#f2e2dc" strokeWidth={4} opacity={0.8} />; })}
          {/* 远处观众席 */}
          {Array.from({length: 40}, (_, i) => <circle key={i} cx={40 + i * 48} cy={470 + (i % 2) * 14} r={14} fill="#1a0507" />)}
          {Array.from({length: 18}, (_, i) => <circle key={'l' + i} cx={60 + i * 106} cy={420} r={4} fill="#ffe7c2" opacity={0.35 + 0.65 * Math.abs(Math.sin(u * 3 + i))} />)}
          {/* 两束舞台灯 */}
          {[[700, -1], [1220, 1]].map(([x, d], i) => <path key={i} d={`M ${x + d * 300} 0 L ${x + d * 340} 0 L ${x + 120} 1000 L ${x - 120} 1000 Z`} fill="rgba(255,230,210,.18)" opacity={lights} />)}
          {/* 白色小人走到台中 */}
          <g transform={`translate(${lerp(300, 960, walk)} 880)`}>
            <circle cx={0} cy={-150} r={20} fill="#f6efe8" />
            <path d={`M 0 -128 L 0 -60 M 0 -60 L ${-12 - 18 * step} 0 M 0 -60 L ${12 + 18 * step} 0 M 0 -110 L ${-22 - 24 * step} -70 M 0 -110 L ${22 + 24 * step} -70`} stroke="#f6efe8" strokeWidth={9} strokeLinecap="round" />
          </g>
          {/* 身后的红影 */}
          <g transform={`translate(${lerp(200, 820, walk)} 880) scale(1.4)`} opacity={0.5 * walk}>
            <circle cx={0} cy={-150} r={20} fill="#c0272b" />
            <path d="M 0 -128 L 0 -60 M 0 -60 L -16 0 M 0 -60 L 16 0" stroke="#c0272b" strokeWidth={9} strokeLinecap="round" />
          </g>
          {big > 0.01 ? <text x={960} y={330} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={170} fill="#fff4ee" transform={`translate(960 330) scale(${lerp(1.8, 1, big)}) translate(-960 -330)`} opacity={clamp01(big * 2)} letterSpacing={20}>抉择</text> : null}
        </g>
      </svg>
      <Line u={u} from={B} to={SEG - 0.4} text="舞台很大，压力从四面八方来。" hl="压力" hlCol="#ff6b6b" />
      <Label u={u} no="03" name="红黑戏剧舞台" desc="红黑对比、舞台、观众席和压迫感" motion="透视线画出舞台、灯压下来、人走到台中、大字砸下震屏" col="#ff8a80" />
    </AbsoluteFill>
  );
};

// ── 05 黑白石膏人偶：一排灰白人偶一拍一步齐步走，第 8 拍全体低头，只有一个站直 ──
export const Plaster: React.FC<Seg> = ({u, B}) => {
  const bow = ease(seg(u, 8 * B - 0.25, 0.3));
  const curtain = ease(u / 0.8);
  const Figure: React.FC<{x: number; y: number; s: number; k: number; up?: boolean}> = ({x, y, s, k, up}) => {
    const stepping = u > 2 * B && u < 6 * B;
    const ph = stepping ? Math.sin(((u - 2 * B) / B) * Math.PI) : 0;
    const lean = up ? 0 : bow * 35;
    return (
      <g transform={`translate(${x + (stepping ? (u - 2 * B) / B * 14 : u >= 6 * B ? 56 : 0)} ${y}) scale(${s})`}>
        <ellipse cx={0} cy={4} rx={40} ry={8} fill="#000" opacity={0.4} />
        <path d={`M -10 -90 L ${-14 - 10 * ph} 0 M 10 -90 L ${14 + 10 * ph} 0`} stroke="url(#pBody)" strokeWidth={18} strokeLinecap="round" />
        <g transform={`rotate(${lean} 0 -90)`}>
          <path d="M -30 -200 C -34 -150 -24 -110 -16 -88 L 16 -88 C 24 -110 34 -150 30 -200 C 10 -214 -10 -214 -30 -200 Z" fill="url(#pBody)" />
          <ellipse cx={0} cy={-236} rx={26} ry={32} fill="url(#pHead)" />
          <path d={`M -28 -190 L ${-44 - 8 * ph} -120 M 28 -190 L ${44 + 8 * ph} -120`} stroke="url(#pBody)" strokeWidth={14} strokeLinecap="round" />
        </g>
        {k === 0 ? null : null}
      </g>
    );
  };
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 30%, #3a3a3e 0%, #121214 70%)'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <linearGradient id="pBody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7a7a7e" /><stop offset="0.45" stopColor="#d8d8d6" /><stop offset="1" stopColor="#8c8c90" /></linearGradient>
          <radialGradient id="pHead" cx="0.4" cy="0.35"><stop offset="0" stopColor="#efefec" /><stop offset="1" stopColor="#8a8a8e" /></radialGradient>
        </defs>
        {Array.from({length: 24}, (_, i) => <rect key={i} x={i * 80} y={0} width={44} height={720} fill="#1c1c20" opacity={0.6 * curtain} />)}
        <rect x={0} y={760} width={1920} height={320} fill="#1a1a1d" />
        {[0, 1].map(row => Array.from({length: 7}, (_, i) => <Figure key={row + '-' + i} x={260 + i * 220 + row * 110} y={row ? 900 : 820} s={row ? 1.0 : 0.85} k={i} up={row === 1 && i === 3} />))}
        <circle cx={260 + 3 * 220 + 110 + 56} cy={900 - 280} r={150} fill="rgba(255,255,255,.08)" opacity={bow} />
      </svg>
      <Line u={u} from={B} to={8 * B - 0.3} text="所有人都在走同一步。" />
      <Line u={u} from={8 * B + 0.2} to={SEG - 0.4} text="只有一个人，没有低头。" hl="没有低头" hlCol="#ffffff" />
      <Label u={u} no="05" name="黑白石膏人偶" desc="黑白灰、雕塑感的人偶，成群排列" motion="人偶一拍一步齐步走、强拍全体低头、一个站直被光照到" col="#e8e8e4" />
    </AbsoluteFill>
  );
};

// ── 06 暗场线条小人：白线一笔画出一个小人，走、助跑、第 8 拍跳过一道缝，落地时身后多了一个红色小人 ──
export const LineMan: React.FC<Seg> = ({u, B}) => {
  const draw = ease(seg(u, 0.2, B));
  const run = ease(seg(u, 2 * B, 5.8 * B));
  const x = lerp(360, 1250, run) + (u > 8 * B ? lerp(0, 220, ease(seg(u, 8 * B, 0.8 * B))) : 0);
  const jumpP = seg(u, 7.6 * B, 0.9 * B), air = Math.sin(jumpP * Math.PI) * (jumpP > 0 && jumpP < 1 ? 1 : 0);
  const ph = Math.sin(u * 9) * (u > 2 * B && u < 7.6 * B ? 1 : 0);
  const red = popAt(u, B, 10, 0.3, 2.4);
  const floor = (x0: number, x1: number) => <path d={`M ${x0} 820 L ${x1} 820`} stroke="#f2f2f2" strokeWidth={4} />;
  return (
    <AbsoluteFill style={{background: '#050505'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {floor(200, 1300)}{floor(1440, 1760)}
        <path d="M 1300 820 L 1300 1000 M 1440 820 L 1440 1000" stroke="#f2f2f2" strokeWidth={2} opacity={0.35} />
        <g transform={`translate(${x} ${820 - air * 140})`} fill="none" stroke="#f6f6f6" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1000" strokeDashoffset={1000 * (1 - draw)}>
          <circle cx={0} cy={-150} r={22} />
          <path d={`M 0 -128 L ${4 * ph} -60 M ${4 * ph} -60 L ${-14 - 22 * ph - (air ? 18 : 0)} 0 M ${4 * ph} -60 L ${14 + 22 * ph + (air ? 18 : 0)} 0 M 0 -110 L ${-24 - 26 * ph - air * 20} ${-70 - air * 40} M 0 -110 L ${24 + 26 * ph + air * 20} ${-70 - air * 40}`} />
        </g>
        {red > 0.01 ? <g transform={`translate(${1360} 820) scale(${red})`} fill="none" stroke="#e8433a" strokeWidth={7} strokeLinecap="round">
          <circle cx={0} cy={-150} r={22} /><path d="M 0 -128 L 0 -60 M 0 -60 L -18 0 M 0 -60 L 18 0 M 0 -110 L -30 -150 M 0 -110 L 30 -150" />
        </g> : null}
      </svg>
      <Line u={u} from={B} to={SEG - 0.4} text="一根线，一个人，动作就是故事。" hl="动作" hlCol="#ff5a4e" />
      <Label u={u} no="06" name="暗场线条小人" desc="黑底、白色线条棍人，靠动作讲故事" motion="一笔画出小人、跑、强拍起跳越过缺口、落地多出一个红色小人" col="#ffffff" />
    </AbsoluteFill>
  );
};

// ── 07 华丽插画：放射光、霓虹描边的英雄剪影、火星乱飞，“1 VS 100”大字在强拍炸开 ──
export const Ornate: React.FC<Seg> = ({u, B}) => {
  const rays = ease(seg(u, 0, 2 * B));
  const heroes = popAt(u, B, 2, 0.4, 1.8);
  const num = back(seg(u, 8 * B - 0.2, 0.25), 1.6), numHit = hit(u, 8 * B, 5);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 70%, #6b2a0c 0%, #1d0b14 55%, #08060d 100%)'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs><filter id="oGlow"><feGaussianBlur stdDeviation="7" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        <g transform={`rotate(${u * 4} 960 760)`} opacity={rays * 0.55}>
          {Array.from({length: 28}, (_, i) => <path key={i} d={`M 960 760 L ${960 + Math.cos(i / 28 * Math.PI * 2) * 1600} ${760 + Math.sin(i / 28 * Math.PI * 2) * 1600} L ${960 + Math.cos((i + 0.4) / 28 * Math.PI * 2) * 1600} ${760 + Math.sin((i + 0.4) / 28 * Math.PI * 2) * 1600} Z`} fill={i % 2 ? '#ff9a3c' : '#1fd1c8'} opacity={0.25} />)}
        </g>
        <path d="M 0 900 C 300 780 520 860 760 800 C 1000 740 1300 840 1920 760 L 1920 1080 L 0 1080 Z" fill="#12070c" />
        {/* 霓虹描边的英雄剪影 */}
        {heroes > 0.01 ? [-2, -1, 0, 1, 2].map(k => <g key={k} transform={`translate(${960 + k * 150} ${820 - Math.abs(k) * -10}) scale(${heroes * (k === 0 ? 1.25 : 1)})`} filter="url(#oGlow)">
          <path d="M -40 0 L -34 -150 C -60 -170 -50 -230 -20 -236 C -24 -280 24 -280 20 -236 C 50 -230 60 -170 34 -150 L 40 0 Z" fill="#160a10" stroke={k === 0 ? '#ffd166' : '#2ee6d6'} strokeWidth={4} />
          <path d={`M 26 -190 L ${70 + k * 5} -320`} stroke={k === 0 ? '#ffd166' : '#2ee6d6'} strokeWidth={5} />
        </g>) : null}
        {/* 火星 */}
        {Array.from({length: 50}, (_, i) => { const ph = (u * (0.3 + random('os' + i) * 0.5) + random('oy' + i)) % 1; return <circle key={i} cx={random('ox' + i) * 1920 + Math.sin(u * 2 + i) * 20} cy={1080 - ph * 900} r={2 + random('or' + i) * 3} fill={i % 3 ? '#ffb347' : '#fff1b8'} opacity={(1 - ph) * 0.9} />; })}
        {num > 0.01 ? <g transform={`translate(960 330) scale(${lerp(2, 1, num) * (1 + 0.05 * numHit)})`} filter="url(#oGlow)">
          <text x={-150} y={0} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={170} fill="#ffd166">1</text>
          <text x={0} y={-20} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={70} fill="#fff4dc">VS</text>
          <text x={190} y={0} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={170} fill="#ff5a3c">100</text>
        </g> : null}
        {numHit > 0.05 ? <circle cx={960} cy={280} r={100 + (1 - numHit) * 700} fill="none" stroke="#ffd166" strokeWidth={10 * numHit} opacity={numHit} /> : null}
      </svg>
      <Line u={u} from={B} to={SEG - 0.4} text="光线、火花、大数字，一帧就要燃。" hl="燃" hlCol="#ffd166" />
      <Label u={u} no="07" name="华丽插画" desc="放射光、霓虹或金色描边、繁复的大场面" motion="放射光转动、剪影亮边弹出、火星上飘、对比大数字在强拍炸开" col="#ffd166" />
    </AbsoluteFill>
  );
};

// ── 09 黑底大数字：100% 一拍拍滚到 1%，点阵出现，强拍上 99 个点变红，只剩 1 个亮 ──
export const BigNum: React.FC<Seg> = ({u, B}) => {
  const steps = [100, 50, 10, 1];
  const k = Math.min(3, Math.max(0, Math.floor(u / B) - 0)); const v = steps[Math.min(3, Math.floor(u / B))] ?? 1;
  const tick = u < 4 * B ? hit(u % B, 0, 10) : 0;
  const settle = popAt(u, B, 4, 0.25, 2.6);
  const grid = ease(seg(u, 5 * B, B));
  const red = u >= 8 * B ? ease(seg(u, 8 * B, 0.5)) : 0;
  return (
    <AbsoluteFill style={{background: '#050506'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(${lerp(960, 560, grid)} 560) scale(${(1 - 0.25 * grid) * (1 + 0.08 * tick)})`}>
          <text x={0} y={60} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={260} fill={u >= 4 * B ? '#f2c14e' : '#f4f4f4'} style={{filter: u >= 4 * B ? 'drop-shadow(0 0 30px rgba(242,193,78,.6))' : 'none'}}>{u < 4 * B ? steps[k] : v}%</text>
          {settle > 0.01 ? <text x={0} y={150} textAnchor="middle" fontFamily={FONT.serif} fontSize={40} fill="#bdb5a0" opacity={settle}>一次成功的概率</text> : null}
        </g>
        {grid > 0.01 ? <g transform="translate(1100 330)" opacity={grid}>
          {Array.from({length: 100}, (_, i) => { const gx = (i % 10) * 46, gy = Math.floor(i / 10) * 46; const one = i === 47; const a = clamp01(grid * 3 - (i % 10) * 0.12); return <circle key={i} cx={gx} cy={gy} r={one ? 13 : 11} fill={one ? '#f2c14e' : red > 0 ? `rgb(${lerp(230, 214, red)},${lerp(230, 60, red)},${lerp(230, 60, red)})` : '#e6e6e6'} opacity={a} style={one ? {filter: 'drop-shadow(0 0 10px #f2c14e)'} : undefined} />; })}
          {red > 0.01 ? <text x={210} y={510} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={64} fill="#e04848" opacity={red}>99% 会失败</text> : null}
        </g> : null}
      </svg>
      <Line u={u} from={B} to={SEG - 0.4} text="一个数字，就是一整段道理。" hl="一个数字" hlCol="#f2c14e" />
      <Label u={u} no="09" name="黑底大数字" desc="几乎只有黑底和一个大数字，配少量点阵" motion="数字一拍一跳地滚、落定发光、点阵铺开、强拍上一片变红只剩一个亮" col="#f2c14e" />
    </AbsoluteFill>
  );
};

// ── 10 建筑与俯视线稿：俯视的蓝图街区，车流光点沿路走，强拍点亮一条从 A 到 B 的路线 ──
export const Blueprint: React.FC<Seg> = ({u, B}) => {
  const draw = ease(seg(u, 0, 2.5 * B));
  const route = ease(seg(u, 8 * B - 0.4 * B, 1.4 * B));
  const counter = Math.round(3652 * ease(seg(u, 4 * B, 4 * B)));
  const roadsH = [260, 520, 780], roadsV = [380, 760, 1140, 1520];
  const path = [[380, 780], [380, 520], [1140, 520], [1140, 260], [1520, 260]];
  const len = path.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - path[i][0], p[1] - path[i][1]), 0);
  return (
    <AbsoluteFill style={{background: '#0d1b2e'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <g transform="translate(960 540) rotate(-8) scale(1.05) translate(-960 -540)">
          {Array.from({length: 40}, (_, i) => <path key={'g' + i} d={`M ${i * 60 - 200} -200 L ${i * 60 - 200} 1300 M -200 ${i * 60 - 200} L 2200 ${i * 60 - 200}`} stroke="#2a4a6e" strokeWidth={1} opacity={0.35} />)}
          {/* 街区：楼的俯视线框 */}
          {roadsV.slice(0, 3).map((x, i) => roadsH.slice(0, 2).map((y, j) => <g key={i + '-' + j} opacity={draw}>
            {[0, 1, 2].map(b => <rect key={b} x={x + 40 + b * 110} y={y + 40} width={90} height={180} fill="none" stroke="#8fc3ea" strokeWidth={2} strokeDasharray="600" strokeDashoffset={600 * (1 - draw)} />)}
          </g>))}
          {roadsH.map(y => <path key={'h' + y} d={`M 200 ${y} L ${lerp(200, 1720, draw)} ${y}`} stroke="#cfe6ff" strokeWidth={6} opacity={0.5} />)}
          {roadsV.map(x => <path key={'v' + x} d={`M ${x} 140 L ${x} ${lerp(140, 900, draw)}`} stroke="#cfe6ff" strokeWidth={6} opacity={0.5} />)}
          {/* 车流光点 */}
          {Array.from({length: 18}, (_, i) => { const horiz = i % 2 === 0, lane = horiz ? roadsH[i % 3] : roadsV[i % 4]; const ph = ((u * (0.08 + random('cv' + i) * 0.08)) + random('cp' + i)) % 1; const p = horiz ? [200 + ph * 1520, lane] : [lane, 140 + ph * 760]; return <g key={i} opacity={draw}><circle cx={p[0]} cy={p[1]} r={6} fill="#ffe08a" /><path d={horiz ? `M ${p[0]} ${p[1]} L ${p[0] - 60} ${p[1]}` : `M ${p[0]} ${p[1]} L ${p[0]} ${p[1] - 60}`} stroke="#ffe08a" strokeWidth={4} opacity={0.4} /></g>; })}
          {route > 0 ? <path d={'M ' + path.map(p => p.join(' ')).join(' L ')} fill="none" stroke="#3ef0e0" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - route)} style={{filter: 'drop-shadow(0 0 12px #3ef0e0)'}} /> : null}
          {[[path[0], 'A'], [path[path.length - 1], 'B']].map(([p, n], i) => { const a = i === 0 ? popAt(u, B, 8, 0.3) : popAt(u, B, 9, 0.3); return a > 0.01 ? <g key={n as string} transform={`translate(${(p as number[])[0]} ${(p as number[])[1]}) scale(${a})`}><circle r={22} fill="#3ef0e0" /><text y={9} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={26} fill="#0d1b2e">{n as string}</text></g> : null; })}
        </g>
        {u > 4 * B ? <g transform="translate(1820 860)"><text textAnchor="end" fontFamily={FONT.sans} fontWeight={900} fontSize={84} fill="#cfe6ff">{counter.toLocaleString()}</text><text y={44} textAnchor="end" fontFamily={FONT.sans} fontSize={24} fill="#7fa0c4">天，同一条路</text></g> : null}
      </svg>
      <Line u={u} from={B} to={SEG - 0.4} text="从高处看，每个人都在结构里。" hl="结构" hlCol="#3ef0e0" />
      <Label u={u} no="10" name="建筑与俯视线稿" desc="蓝图底、俯视或等距的街区和楼宇线框" motion="线稿生长、车流光点沿路走、计数滚动、强拍点亮一条路线" col="#8fc3ea" />
    </AbsoluteFill>
  );
};
void easeIn; void easeInOut; void beatPulse;
