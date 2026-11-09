// 画风图鉴 · 11 12 13 14 15 16。每段 12 拍，k 拍 = k × B 秒；只演示一类画风的共同画法和动效，不复制具体参考片。
import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {back, clamp01, ease, FONT, hit, Label, lerp, Line, popAt, seg, Seg, SEG} from './common';

// ── 11 朱砂线描：朱红发光线条一笔笔画出一个侧脸，冠冕线条加上去，强拍一个“王”字在光圈里炸亮 ──
export const Cinnabar: React.FC<Seg> = ({u, B}) => {
  const face = ease(seg(u, 0.2, 3.5 * B));
  const crown = ease(seg(u, 4 * B, 1.5 * B));
  const big = back(seg(u, 8 * B - 0.2, 0.25), 1.6), bh = hit(u, 8 * B, 4);
  const L = 2400;
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 60% 45%, #3a0d06 0%, #140403 60%, #070101 100%)'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs><filter id="ciGlow"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        <g fill="none" stroke="#ff7a3a" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" filter="url(#ciGlow)">
          <path strokeDasharray={L} strokeDashoffset={L * (1 - face)} d="M 1240 300 C 1180 300 1120 340 1100 420 C 1090 460 1060 480 1040 500 C 1060 510 1080 515 1082 530 C 1070 540 1066 556 1080 566 C 1074 580 1078 600 1100 606 C 1110 640 1140 660 1180 664 C 1200 700 1200 760 1180 820 M 1240 300 C 1320 300 1380 360 1390 440 C 1400 520 1370 600 1330 660 C 1310 700 1310 760 1330 820" />
          <path strokeDasharray={600} strokeDashoffset={600 * (1 - face)} d="M 1130 452 C 1150 444 1170 446 1186 456 M 1150 470 C 1160 466 1172 468 1180 474" />
          <path strokeDasharray={1200} strokeDashoffset={1200 * (1 - crown)} d="M 1090 300 L 1400 300 M 1100 300 L 1100 250 L 1390 250 L 1390 300 M 1130 250 L 1130 210 M 1190 250 L 1190 200 M 1250 250 L 1250 195 M 1310 250 L 1310 200 M 1370 250 L 1370 210" />
          {crown > 0.5 ? Array.from({length: 9}, (_, i) => <path key={i} d={`M ${1120 + i * 32} 300 L ${1120 + i * 32} ${300 + 40 * (crown - 0.5) * 2}`} />) : null}
        </g>
        {/* 背后的火光放射线 */}
        <g opacity={0.35 * face}>{Array.from({length: 36}, (_, i) => { const a = i / 36 * Math.PI * 2; return <path key={i} d={`M ${1240 + Math.cos(a) * 320} ${520 + Math.sin(a) * 320} L ${1240 + Math.cos(a) * (420 + 30 * Math.sin(u * 3 + i))} ${520 + Math.sin(a) * (420 + 30 * Math.sin(u * 3 + i))}`} stroke="#ff9a4a" strokeWidth={2} />; })}</g>
        {Array.from({length: 30}, (_, i) => { const ph = (u * 0.25 + random('ce' + i)) % 1; return <circle key={i} cx={1000 + random('cx' + i) * 700} cy={1000 - ph * 800} r={2 + random('cr' + i) * 2} fill="#ffb066" opacity={(1 - ph) * 0.8} />; })}
        {big > 0.01 ? <g transform={`translate(560 500) scale(${lerp(1.8, 1, big) * (1 + 0.04 * bh)})`}>
          <circle r={190} fill="none" stroke="#ff7a3a" strokeWidth={6} filter="url(#ciGlow)" />
          <circle r={210 + 60 * (1 - bh)} fill="none" stroke="#ffb066" strokeWidth={3} opacity={bh} />
          <text y={70} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={220} fill="#ff8a4a" filter="url(#ciGlow)">王</text>
        </g> : null}
      </svg>
      <Line u={u} from={B} to={SEG - 0.4} text="红线一笔笔画出来，火光从字里冒出来。" hl="火光" hlCol="#ffb066" />
      <Label u={u} no="11" name="朱砂线描" desc="黑底朱红发光线条，配火光和大字" motion="线条一笔笔描出人物、冠冕加上去、放射线跳动、强拍大字在光圈里炸亮" col="#ff8a4a" />
    </AbsoluteFill>
  );
};

// ── 12 古文明陶绘壁画：陶罐红绘一样的平面人物和回纹边，两个侧身人物相对，强拍一轮圆日升起 ──
export const Vase: React.FC<Seg> = ({u, B}) => {
  const border = ease(seg(u, 0, 1.5 * B));
  const p1 = popAt(u, B, 2, 0.45, 1.8), p2 = popAt(u, B, 3, 0.45, 1.8);
  const gest = ease(seg(u, 5 * B, B));
  const sun = ease(seg(u, 8 * B - 0.5, 1.2 * B));
  const meander = (y: number) => Array.from({length: 30}, (_, i) => <path key={i} d={`M ${i * 64} ${y + 30} L ${i * 64} ${y} L ${i * 64 + 44} ${y} L ${i * 64 + 44} ${y + 20} L ${i * 64 + 18} ${y + 20} L ${i * 64 + 18} ${y + 10}`} fill="none" stroke="#d8743a" strokeWidth={5} opacity={clamp01(border * 30 - i)} />);
  const Fig: React.FC<{x: number; dir: number; a: number}> = ({x, dir, a}) => a > 0.01 ? (
    <g transform={`translate(${x} 830) scale(${dir * a} ${a})`}>
      <path d="M -40 0 L -26 -180 L 26 -180 L 46 0 Z" fill="#d8743a" />
      <path d="M -26 -170 C -10 -160 10 -160 26 -170" stroke="#1a0f0a" strokeWidth={3} fill="none" />
      {[-140, -100, -60].map(y => <path key={y} d={`M -30 ${y} L 36 ${y}`} stroke="#1a0f0a" strokeWidth={3} />)}
      <circle cx={6} cy={-214} r={34} fill="#d8743a" /><circle cx={22} cy={-218} r={4} fill="#1a0f0a" />
      <path d="M -26 -236 C -16 -262 26 -262 36 -232" stroke="#1a0f0a" strokeWidth={8} fill="none" />
      <path d={`M 20 -160 L ${70} ${-160 - 60 * gest} L ${96} ${-180 - 80 * gest}`} stroke="#d8743a" strokeWidth={14} strokeLinecap="round" fill="none" />
    </g>
  ) : null;
  return (
    <AbsoluteFill style={{background: '#16100c'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <rect x={0} y={250} width={1920} height={620} fill="#1e140e" />
        {meander(210)}{meander(880)}
        <circle cx={960} cy={lerp(900, 420, sun)} r={120} fill="#d8743a" opacity={sun} />
        <circle cx={960} cy={lerp(900, 420, sun)} r={150} fill="none" stroke="#d8743a" strokeWidth={4} strokeDasharray="10 14" opacity={sun} />
        <Fig x={720} dir={1} a={p1} /><Fig x={1200} dir={-1} a={p2} />
      </svg>
      <Line u={u} from={B} to={SEG - 0.4} text="用那个文明自己的画法，讲那个文明的事。" hl="自己的画法" hlCol="#ff9a5c" />
      <Label u={u} no="12" name="古文明陶绘壁画" desc="陶罐红绘、壁画那样的平面侧身人物和纹样" motion="回纹边一节节画出、人物从底边立起、手臂抬起相对、强拍圆日升起" col="#ff9a5c" />
    </AbsoluteFill>
  );
};

// ── 13 皮影剪纸：灯在幕后，琥珀色幕布上一个关节皮影举杆走动，强拍腾空一跃，云纹边框 ──
export const Puppet: React.FC<Seg> = ({u, B}) => {
  const lamp = ease(u / 0.8) * (1 + Math.sin(u * 13) * 0.03);
  const walk = ease(seg(u, B, 6 * B));
  const leap = seg(u, 7.5 * B, B), air = Math.sin(leap * Math.PI) * (leap > 0 && leap < 1 ? 1 : 0);
  const arm = Math.sin(u * 5) * 20 + (u > 4 * B && u < 5.2 * B ? 40 * Math.sin(seg(u, 4 * B, 1.2 * B) * Math.PI) : 0);
  const x = lerp(560, 1280, walk) + (leap > 0 ? 120 * ease(leap) : 0);
  return (
    <AbsoluteFill style={{background: '#0c0603'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs><radialGradient id="puScreen" cx="0.5" cy="0.45"><stop offset="0" stopColor="#f2a65a" /><stop offset="0.7" stopColor="#c9692a" /><stop offset="1" stopColor="#5a2a10" /></radialGradient></defs>
        <rect x={300} y={220} width={1320} height={680} rx={12} fill="url(#puScreen)" opacity={lamp} />
        {/* 云纹边 */}
        {Array.from({length: 22}, (_, i) => <g key={i} transform={`translate(${330 + i * 60} 920)`}><path d="M 0 0 C 0 -24 30 -24 30 0 C 30 -14 50 -14 50 0" fill="none" stroke="#c9692a" strokeWidth={5} /></g>)}
        {Array.from({length: 22}, (_, i) => <g key={'t' + i} transform={`translate(${330 + i * 60} 200) scale(1 -1)`}><path d="M 0 0 C 0 -24 30 -24 30 0 C 30 -14 50 -14 50 0" fill="none" stroke="#c9692a" strokeWidth={5} /></g>)}
        <path d="M 300 780 C 500 740 700 790 960 760 C 1200 730 1400 780 1620 750 L 1620 900 L 300 900 Z" fill="#2a1408" opacity={0.85} />
        <path d="M 1420 760 L 1460 600 L 1500 760 Z M 1480 760 L 1530 560 L 1580 760 Z" fill="#2a1408" opacity={0.85} />
        {/* 关节皮影：身体、腿、可动的手臂和操纵杆 */}
        <g transform={`translate(${x} ${770 - air * 160}) rotate(${air * -12})`} fill="#1a0b05">
          <path d="M -36 -10 L -26 -150 C -40 -170 -30 -200 0 -206 C 30 -200 40 -170 26 -150 L 36 -10 Z" />
          <circle cx={6} cy={-232} r={26} />
          <path d="M -20 -258 C -10 -290 30 -292 40 -262 L 60 -270 L 46 -248 Z" />
          <path d={`M -14 -10 L ${-24 - 14 * Math.sin(u * 8)} 60 M 14 -10 L ${24 + 14 * Math.sin(u * 8)} 60`} stroke="#1a0b05" strokeWidth={14} strokeLinecap="round" />
          <g transform={`rotate(${-arm} 20 -170)`}><path d="M 20 -170 L 90 -150" stroke="#1a0b05" strokeWidth={12} strokeLinecap="round" /><path d="M 90 -150 L 120 -200" stroke="#1a0b05" strokeWidth={10} strokeLinecap="round" /></g>
          <path d="M 4 -120 L 4 340" stroke="#3a1c0c" strokeWidth={4} opacity={0.6} />
        </g>
        <circle cx={960} cy={530} r={260 + 20 * Math.sin(u * 2)} fill="rgba(255,220,160,.12)" />
      </svg>
      <Line u={u} from={B} to={SEG - 0.4} text="灯在幕后，影子在幕前演。" hl="影子" hlCol="#ffc07a" />
      <Label u={u} no="13" name="皮影剪纸" desc="琥珀色亮幕、关节皮影剪影、云纹和纸质边框" motion="幕布亮起、皮影举杆走动手臂摆、强拍腾空一跃" col="#ffc07a" />
    </AbsoluteFill>
  );
};

// ── 14 分层剪影场景：远山、宫殿、树、近景几层剪影以不同速度往后退，角上年份一拍拍走，强拍一盏灯在近景亮起 ──
export const Layers: React.FC<Seg> = ({u, B}) => {
  const pan = u / SEG;
  const year = Math.round(lerp(1, 300, ease(seg(u, B, 7 * B))));
  const lamp = popAt(u, B, 8, 0.4, 2);
  const layer = (speed: number, fill: string, d: string, y = 0) => <g transform={`translate(${-pan * speed} ${y})`}><path d={d} fill={fill} /><path d={d} fill={fill} transform="translate(1920 0)" /></g>;
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#0e1424 0%, #3a2a3e 45%, #c9704a 75%, #e8a060 100%)'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <circle cx={1280} cy={640} r={110} fill="#ffd9a0" opacity={0.85} />
        {layer(80, '#5a3a4a', 'M 0 700 L 200 560 L 380 660 L 600 520 L 820 640 L 1040 540 L 1260 660 L 1500 560 L 1720 650 L 1920 600 L 1920 1080 L 0 1080 Z')}
        {layer(200, '#3a2434', 'M 0 760 L 300 760 L 300 640 L 260 640 L 360 580 L 460 640 L 420 640 L 420 760 L 900 760 L 900 600 L 840 600 L 1000 520 L 1160 600 L 1100 600 L 1100 760 L 1920 760 L 1920 1080 L 0 1080 Z')}
        {layer(420, '#22131e', 'M 0 850 C 200 800 300 860 500 830 L 520 700 L 540 830 C 700 820 760 860 900 840 L 930 680 L 960 840 C 1200 830 1400 870 1600 840 L 1630 720 L 1660 840 C 1780 830 1860 850 1920 845 L 1920 1080 L 0 1080 Z')}
        {layer(760, '#0d0710', 'M 0 960 L 1920 960 L 1920 1080 L 0 1080 Z M 260 960 L 260 760 L 300 760 L 300 960 Z M 1400 960 L 1400 700 L 1450 700 L 1450 960 Z')}
        {lamp > 0.01 ? <g transform={`translate(1200 760) scale(${lamp})`}><circle r={120} fill="rgba(255,200,120,.25)" /><rect x={-18} y={-40} width={36} height={56} rx={8} fill="#ffcf7a" /><path d="M 0 -40 L 0 -120" stroke="#0d0710" strokeWidth={4} /></g> : null}
        <text x={1820} y={200} textAnchor="end" fontFamily={FONT.serif} fill="#ffe2b8"><tspan fontSize={30} fill="#e8d0b8">第 </tspan><tspan fontSize={84} fontWeight={900}>{year}</tspan><tspan fontSize={30} fill="#e8d0b8"> 年</tspan></text>
      </svg>
      <Line u={u} from={B} to={SEG - 0.4} text="一层层剪影往后退，时间往前走。" hl="时间" hlCol="#ffcf7a" />
      <Label u={u} no="14" name="分层剪影场景" desc="远近多层剪影、大气光和夕照，角落年份计数" motion="各层不同速度视差平移、年份一拍拍滚、强拍近景一盏灯亮起" col="#ffcf7a" />
    </AbsoluteFill>
  );
};

// ── 15 古风扁平信息图：渐变天空下的扁平城门，无脸小人走过，地图上的虚线路线一拍一跳，强拍金框卡片弹出 ──
export const HanFlat: React.FC<Seg> = ({u, B}) => {
  const gate = ease(seg(u, 0, B));
  const walk = ease(seg(u, B, 4 * B));
  const route = Math.min(3, Math.max(0, (u - 4 * B) / B)), r = (Math.floor(route) + ease(route - Math.floor(route))) / 3;
  const card = popAt(u, B, 8, 0.35, 2.4);
  const pts: [number, number][] = [[1240, 420], [1380, 360], [1500, 430], [1640, 340]];
  const at = (p: number): [number, number] => { const s = Math.min(2.999, p * 3), i = Math.floor(s), f = s - i; return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]; };
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#8fb2d8 0%, #d8dce0 55%, #f0dcb4 100%)'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <circle cx={1500} cy={210} r={70} fill="#fbe6bf" />
        <path d="M 0 700 C 400 620 800 680 1200 640 C 1500 610 1700 660 1920 640 L 1920 1080 L 0 1080 Z" fill="#a3a9c4" opacity={0.6} />
        <rect x={0} y={820} width={1920} height={260} fill="#e2c08a" />
        {/* 城门 */}
        <g transform={`translate(560 820) scale(1 ${gate})`}>
          <rect x={-300} y={-300} width={600} height={300} fill="#d9b98a" />
          <path d="M -70 0 L -70 -150 A 70 70 0 0 1 70 -150 L 70 0 Z" fill="#3a3346" />
          <rect x={-220} y={-400} width={440} height={100} fill="#b8322a" />
          <path d="M -280 -400 L 280 -400 L 220 -460 L -220 -460 Z" fill="#3a3346" />
          <path d="M -320 -300 L 320 -300 L 300 -320 L -300 -320 Z" fill="#3a3346" />
        </g>
        {/* 无脸小人走过 */}
        <g transform={`translate(${lerp(-100, 900, walk)} 830)`}>
          <ellipse cx={0} cy={0} rx={30} ry={6} fill="#000" opacity={0.15} />
          <path d={`M -8 -70 L ${-10 - 10 * Math.sin(u * 9)} 0 M 8 -70 L ${10 + 10 * Math.sin(u * 9)} 0`} stroke="#f2efe8" strokeWidth={9} strokeLinecap="round" />
          <path d="M -18 -160 L 18 -160 L 36 -64 L -36 -64 Z" fill="#f1ece2" />
          <circle cx={0} cy={-184} r={22} fill="#f6f3ec" /><path d="M -22 -186 A 22 22 0 0 1 22 -186 Z" fill="#3a3f5c" />
        </g>
        {/* 小地图：路线一拍一跳 */}
        <g opacity={ease(seg(u, 3 * B, 0.5))}>
          <rect x={1160} y={280} width={560} height={240} rx={16} fill="rgba(43,45,68,.85)" />
          {route > 0 ? <path d={'M ' + Array.from({length: 31}, (_, i) => at(i / 30 * r).join(' ')).join(' L ')} fill="none" stroke="#f2c14e" strokeWidth={5} strokeDasharray="12 9" /> : null}
          {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === 0 || i === 3 ? 12 : 7} fill={i === 3 ? '#f2c14e' : '#fbf7ee'} />)}
          <text x={1640} y={312} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={26} fill="#f2c14e">终点</text>
        </g>
        {card > 0.01 ? <g transform={`translate(1440 680) scale(${card})`}>
          <rect x={-140} y={-110} width={280} height={220} rx={16} fill="#2c2a3e" stroke="#f2c14e" strokeWidth={4} />
          <circle cx={0} cy={-40} r={40} fill="#3a3650" stroke="#f2c14e" strokeWidth={4} /><text y={-24} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={42} fill="#f2c14e">路</text>
          <text y={64} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={34} fill="#fbf7ee">三天路程</text>
        </g> : null}
      </svg>
      <Line u={u} from={B} to={SEG - 0.4} text="城门、地图、数字，故事和道理一起讲清。" hl="一起讲清" hlCol="#b8322a" dark />
      <Label u={u} no="15" name="古风扁平信息图" desc="渐变天空、扁平的古建筑、无脸小人，加地图和信息卡" motion="城门立起、小人走过、地图路线一拍一跳、强拍金框卡片弹出" col="#b8322a" dark />
    </AbsoluteFill>
  );
};

// ── 16 扁平小人插画：暖色客厅，窗外夜景，圆头扁平小人一拍一个坐进来，强拍碰杯，然后灯暗只剩一个 ──
export const FlatPeople: React.FC<Seg> = ({u, B}) => {
  const people: [number, string, number][] = [[620, '#e8a05a', 1], [820, '#5a8fd8', 2], [1020, '#d86a7a', 3], [1220, '#6ab89a', 4]];
  const cheers = seg(u, 7.6 * B, 0.4 * B), clink = hit(u, 8 * B, 9);
  const dim = ease(seg(u, 10 * B, 1.2 * B));
  return (
    <AbsoluteFill style={{background: '#2a1e2a'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <rect x={0} y={0} width={1920} height={760} fill="#5a3a3e" />
        <rect x={1360} y={140} width={420} height={360} rx={8} fill="#141a34" />
        {Array.from({length: 14}, (_, i) => <rect key={i} x={1390 + (i % 7) * 54} y={280 + Math.floor(i / 7) * 100 + (i % 3) * 20} width={30} height={14} fill="#ffd88a" opacity={0.4 + 0.6 * Math.abs(Math.sin(u + i))} />)}
        <path d="M 1360 320 L 1780 320 M 1570 140 L 1570 500" stroke="#3a2a2e" strokeWidth={10} />
        <rect x={0} y={760} width={1920} height={320} fill="#3a2830" />
        {/* 沙发 */}
        <rect x={480} y={640} width={900} height={180} rx={40} fill="#8a4a3a" />
        <rect x={480} y={560} width={900} height={110} rx={40} fill="#a65a46" />
        {/* 台灯 */}
        <g transform="translate(300 760)"><rect x={-6} y={-260} width={12} height={260} fill="#2a1a1a" /><path d="M -70 -260 L 70 -260 L 40 -340 L -40 -340 Z" fill="#f2c27a" /><circle cy={-200} r={260} fill="rgba(255,200,120,.12)" /></g>
        {people.map(([x, col, k], i) => {
          const a = popAt(u, B, k, 0.35, 2.2);
          const lift = (i === 1 || i === 2) ? cheers : 0;
          return a > 0.01 ? <g key={i} transform={`translate(${x} 720) scale(${a})`} opacity={i === 0 ? 1 : 1 - dim * 0.85}>
            <rect x={-46} y={-120} width={92} height={130} rx={40} fill={col} />
            <circle cx={0} cy={-160} r={44} fill="#f6dcc0" />
            <path d="M -44 -170 C -40 -214 40 -214 44 -170 C 20 -186 -20 -186 -44 -170 Z" fill="#3a2a2a" />
            <path d={`M ${i < 2 ? 40 : -40} -80 L ${(i < 2 ? 1 : -1) * (60 + 30 * lift)} ${-100 - 60 * lift}`} stroke={col} strokeWidth={22} strokeLinecap="round" />
            {lift > 0 || i === 0 ? <g transform={`translate(${(i < 2 ? 1 : -1) * (60 + 30 * lift)} ${-110 - 60 * lift})`}><rect x={-12} y={-24} width={24} height={30} rx={4} fill="#ffe6a8" opacity={0.9} /></g> : null}
          </g> : null;
        })}
        {clink > 0.05 ? Array.from({length: 8}, (_, i) => { const a = i / 8 * Math.PI * 2, r = 30 + (1 - clink) * 90; return <path key={i} d={`M ${920 + Math.cos(a) * r} ${520 + Math.sin(a) * r} l ${Math.cos(a) * 16} ${Math.sin(a) * 16}`} stroke="#ffe6a8" strokeWidth={5} opacity={clink} />; }) : null}
        <rect x={0} y={0} width={1920} height={1080} fill="#0c0810" opacity={dim * 0.55} />
        <circle cx={620} cy={600} r={180} fill="rgba(255,200,120,.18)" opacity={dim} />
      </svg>
      <Line u={u} from={B} to={10 * B - 0.2} text="生活场景一画出来，观众就代入了。" hl="代入" hlCol="#ffc07a" />
      <Line u={u} from={10 * B + 0.2} to={SEG - 0.3} text="散场以后，只剩你一个。" hl="一个" hlCol="#ffc07a" />
      <Label u={u} no="16" name="扁平小人插画" desc="扁平的圆头小人、生活化的室内场景、暖色灯光" motion="小人一拍一个坐进来、强拍举杯碰响、灯暗下来只留一个" col="#ffc07a" />
    </AbsoluteFill>
  );
};
