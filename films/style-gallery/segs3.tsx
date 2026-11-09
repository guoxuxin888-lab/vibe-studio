// 画风图鉴 · 17 18 19 20 21 22。每段 12 拍，k 拍 = k × B 秒；只演示一类画风的共同画法和动效，不复制具体参考片。
import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {back, beatPulse, clamp01, ease, FONT, hit, Label, lerp, Line, popAt, seg, Seg, SEG} from './common';

// ── 17 自然风景插画：明亮分层的原野，草一拍长一截；切到地下，金色的根往下蔓延；强拍一株竹笋破土 ──
export const Nature: React.FC<Seg> = ({u, B}) => {
  const grow = (k: number) => ease(seg(u, k * B - 0.3, 0.5));
  const under = ease(seg(u, 4.6 * B, 0.8 * B)) * (1 - ease(seg(u, 7.6 * B, 0.5 * B)));
  const roots = ease(seg(u, 5 * B, 2.5 * B));
  const shoot = back(seg(u, 8 * B - 0.25, 0.35), 2);
  const blades = Array.from({length: 26}, (_, i) => [80 + i * 70 + (random('gx' + i) - 0.5) * 30, 1 + (i % 3), 0.6 + random('gh' + i) * 0.6] as [number, number, number]);
  return (
    <AbsoluteFill style={{background: 'linear-gradient(#a8c8f0 0%, #e6e2f2 45%, #f6e0d0 70%)'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {[[140, 230, 1], [600, 180, 1.3], [1300, 240, 1.1]].map(([x, y, s], i) => <g key={i} transform={`translate(${x + u * 12} ${y}) scale(${s})`} opacity={0.9}><ellipse cx={0} cy={0} rx={110} ry={34} fill="#fff" /><ellipse cx={50} cy={-20} rx={70} ry={34} fill="#fff" /></g>)}
        <path d="M 0 640 C 300 560 600 620 960 580 C 1300 540 1600 600 1920 570 L 1920 760 L 0 760 Z" fill="#b8c8a0" />
        <path d="M 0 700 C 400 650 800 700 1200 670 C 1500 650 1700 690 1920 680 L 1920 780 L 0 780 Z" fill="#8fb07a" />
        <rect x={0} y={760} width={1920} height={320} fill="#5a3e2a" />
        {/* 草：一拍长一截 */}
        {blades.map(([x, k, h], i) => { const g = grow(k); return <path key={i} d={`M ${x - 8} 762 Q ${x + Math.sin(u * 2 + i) * 8} ${762 - 140 * h * g} ${x + 6 + Math.sin(u * 2 + i) * 14} ${762 - 220 * h * g} Q ${x + 4} ${762 - 100 * h * g} ${x + 8} 762 Z`} fill={i % 3 ? '#5aa04a' : '#7ac05a'} />; })}
        {/* 地下：金色的根 */}
        {under > 0.01 ? <g opacity={under}>
          <rect x={0} y={760} width={1920} height={320} fill="#1a1208" opacity={0.6} />
          {Array.from({length: 7}, (_, i) => { const x0 = 960, a = -0.9 + i * 0.3; const L = 260 * roots; return <path key={i} d={`M ${x0} 770 Q ${x0 + Math.sin(a) * L * 0.5} ${770 + L * 0.4} ${x0 + Math.sin(a) * L} ${770 + Math.cos(a) * L * 0.9}`} fill="none" stroke="#ffd36a" strokeWidth={6 - Math.abs(i - 3)} strokeLinecap="round" style={{filter: 'drop-shadow(0 0 8px #ffb84a)'}} />; })}
        </g> : null}
        {shoot > 0.01 ? <g transform={`translate(960 762) scale(1 ${shoot})`}>
          <path d="M -30 0 C -26 -120 -14 -230 0 -320 C 14 -230 26 -120 30 0 Z" fill="#6aa046" />
          {[0, 1, 2].map(i => <path key={i} d={`M -28 ${-60 - i * 80} L 28 ${-60 - i * 80}`} stroke="#4a7a30" strokeWidth={5} />)}
        </g> : null}
        {shoot > 0.5 ? Array.from({length: 10}, (_, i) => { const a = i / 10 * Math.PI, r = 60 + (u - 8 * B) * 160; return <circle key={i} cx={960 - Math.cos(a) * r} cy={762 - Math.sin(a) * r * 0.3} r={6} fill="#5a3e2a" opacity={clamp01(1 - (u - 8 * B) * 1.5)} />; }) : null}
      </svg>
      <Line u={u} from={B} to={SEG - 0.4} text="看不见的时候，根在往下长。" hl="往下长" hlCol="#d8a020" dark />
      <Label u={u} no="17" name="自然风景插画" desc="明亮分层的自然景，以植物或动物为主角" motion="草一拍长一截、剖开地面看金色的根蔓延、强拍一株竹笋破土" col="#4a7a30" dark />
    </AbsoluteFill>
  );
};

// ── 18 名画与油画质感：满屏流动的厚涂笔触，星空在旋，近处一扇窗亮着；强拍镜头推进一颗星 ──
export const OilPaint: React.FC<Seg> = ({u, B}) => {
  const push = ease(seg(u, 8 * B - 0.4 * B, 2.5 * B));
  const z = 1 + push * 1.6;
  // 笔触沿三个漩涡排开，整体慢慢转；漩涡之间铺一层横向的流动笔触
  const centers: [number, number, number][] = [[640, 420, 220], [1260, 400, 190], [1000, 230, 110]];
  const strokes = Array.from({length: 420}, (_, i) => {
    if (i < 300) {
      const [cx, cy, R] = centers[i % 3], ring = 0.25 + (Math.floor(i / 3) % 10) / 10 * 0.95, th = random('ot' + i) * Math.PI * 2 + u * (0.25 + 0.1 * (i % 3));
      const x = cx + Math.cos(th) * R * ring, y = cy + Math.sin(th) * R * ring * 0.8;
      return {x, y, ang: th + Math.PI / 2, len: 30 + random('ol' + i) * 26, col: ['#1f3f8a', '#2a5ab0', '#4a7ad0', '#8ab0e0', '#e8d070', '#c8d8f0'][i % 6]};
    }
    const x = random('ox' + i) * 1920, y = 80 + random('oy' + i) * 620;
    return {x: (x + u * 30) % 1980 - 30, y, ang: Math.sin(x / 200 + u * 0.5) * 0.4, len: 40 + random('ol' + i) * 30, col: ['#1a2e66', '#24448a', '#3a5ea8'][i % 3]};
  });
  const stars: [number, number][] = [[460, 360], [820, 250], [1180, 200], [1520, 140], [960, 380]];
  return (
    <AbsoluteFill style={{background: '#14244a'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <g transform={`translate(1180 200) scale(${z}) translate(-1180 -200)`}>
          {strokes.map((s, i) => <path key={i} d={`M ${s.x - Math.cos(s.ang) * s.len / 2} ${s.y - Math.sin(s.ang) * s.len / 2} L ${s.x + Math.cos(s.ang) * s.len / 2} ${s.y + Math.sin(s.ang) * s.len / 2}`} stroke={s.col} strokeWidth={10} strokeLinecap="round" opacity={0.85} />)}
          {stars.map(([x, y], i) => { const p = 1 + 0.15 * Math.sin(u * 2 + i); return <g key={i}>{[0, 1, 2].map(r => <circle key={r} cx={x} cy={y} r={(28 + r * 18) * p} fill="none" stroke={r ? '#e8d070' : '#fff6c0'} strokeWidth={6} opacity={0.8 - r * 0.25} />)}<circle cx={x} cy={y} r={16 * p} fill="#fff6c0" /></g>; })}
          {/* 远山和村子：厚涂的块面 */}
          {Array.from({length: 70}, (_, i) => { const x = i * 28, y = 700 + Math.sin(i * 0.4) * 30; return <path key={'h' + i} d={`M ${x} ${y} l 30 ${-8 + (i % 3) * 6}`} stroke={i % 2 ? '#2a3a5a' : '#3a4a6a'} strokeWidth={22} strokeLinecap="round" />; })}
          <rect x={0} y={740} width={1920} height={340} fill="#1a2440" />
          {Array.from({length: 60}, (_, i) => <path key={'g' + i} d={`M ${i * 34} ${780 + (i % 4) * 60} l 26 ${-10}`} stroke="#24345a" strokeWidth={14} strokeLinecap="round" />)}
          <g transform="translate(1400 760)"><rect x={-80} y={-120} width={160} height={120} fill="#3a2a2a" /><path d="M -100 -120 L 0 -190 L 100 -120 Z" fill="#2a1e1e" /><rect x={-24} y={-90} width={48} height={50} fill="#ffd36a" opacity={0.8 + 0.2 * Math.sin(u * 7)} /></g>
          {/* 柏树一样的深色火焰形 */}
          <path d={`M 300 1080 C 260 860 320 640 ${360 + Math.sin(u) * 10} 420 C 400 640 440 860 420 1080 Z`} fill="#0e1a12" />
        </g>
      </svg>
      <Line u={u} from={B} to={SEG - 0.4} text="让画里的笔触自己动起来。" hl="笔触" hlCol="#e8d070" />
      <Label u={u} no="18" name="名画与油画质感" desc="名画或油画的厚涂笔触直接成为世界" motion="笔触沿漩涡流动、星光一圈圈脉动、窗里灯火闪、强拍镜头推进一颗星" col="#e8d070" shade />
    </AbsoluteFill>
  );
};

// ── 19 发光天体粒子：黑暗里粒子一拍一拍聚成一颗发光的球，轨道线画出来，强拍光芒炸开、粒子四散 ──
export const Orbs: React.FC<Seg> = ({u, B}) => {
  const gather = ease(seg(u, 0.5 * B, 3.5 * B));
  const orb = ease(seg(u, 3 * B, B)) * (1 + 0.06 * beatPulse(u, B, 5));
  const orbit = ease(seg(u, 4 * B, 2 * B));
  const burst = u >= 8 * B ? ease(seg(u, 8 * B, 1.2 * B)) : 0, bh = hit(u, 8 * B, 4);
  return (
    <AbsoluteFill style={{background: '#04050a'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs><radialGradient id="orbG"><stop offset="0" stopColor="#fff2d0" /><stop offset="0.35" stopColor="#ff9a4a" /><stop offset="0.75" stopColor="#c0401a" /><stop offset="1" stopColor="rgba(120,30,10,0)" /></radialGradient></defs>
        {Array.from({length: 140}, (_, i) => {
          const a = random('pa' + i) * Math.PI * 2, r0 = 300 + random('pr' + i) * 700, r = lerp(r0, 40 + random('pq' + i) * 40, gather) + burst * (300 + random('pb' + i) * 600);
          return <circle key={i} cx={960 + Math.cos(a + u * 0.2) * r} cy={540 + Math.sin(a + u * 0.2) * r * 0.75} r={1.5 + random('ps' + i) * 2.5} fill={i % 4 ? '#ffb070' : '#ffe8c0'} opacity={0.3 + 0.7 * gather * (1 - burst * 0.6)} />;
        })}
        <ellipse cx={960} cy={540} rx={360 * orbit} ry={110 * orbit} fill="none" stroke="#ff9a4a" strokeWidth={2} opacity={0.6 * orbit} transform="rotate(-14 960 540)" />
        {orbit > 0.5 ? <circle cx={960 + Math.cos(u * 2) * 360} cy={540 + Math.sin(u * 2) * 110} r={9} fill="#ffe8c0" transform="rotate(-14 960 540)" /> : null}
        <circle cx={960} cy={540} r={150 * orb + 260 * bh} fill="url(#orbG)" opacity={orb} />
        {burst > 0 ? Array.from({length: 24}, (_, i) => { const a = i / 24 * Math.PI * 2; return <path key={i} d={`M ${960 + Math.cos(a) * 160} ${540 + Math.sin(a) * 160} L ${960 + Math.cos(a) * (180 + 600 * burst)} ${540 + Math.sin(a) * (180 + 600 * burst)}`} stroke="#ffd09a" strokeWidth={3} opacity={1 - burst} />; }) : null}
        {orb > 0.3 ? <text x={1180} y={400} fontFamily={FONT.sans} fontSize={30} fill="#ffb070" opacity={orb}>{(5000 + Math.round(800 * Math.sin(u))).toLocaleString()} K</text> : null}
      </svg>
      <Line u={u} from={B} to={SEG - 0.4} text="黑暗里一颗光，粒子绕着它聚散。" hl="一颗光" hlCol="#ffb070" />
      <Label u={u} no="19" name="发光天体粒子" desc="黑底、发光的球体、粒子和闪光" motion="粒子一拍拍聚拢成球、轨道线画出、球随拍呼吸、强拍光芒炸开粒子四散" col="#ffb070" />
    </AbsoluteFill>
  );
};

// ── 20 聊天界面反差：白底手机聊天一拍一条，正在输入…；一句话之后整屏转暗，大字发光；最后暖光回来 ──
export const Chat: React.FC<Seg> = ({u, B}) => {
  const msgs: [string, boolean, number][] = [['在吗？', true, 1], ['今天怎么样', true, 2], ['还行', false, 3]];
  const typing = u > 3.6 * B && u < 5 * B;
  const dark = ease(seg(u, 5 * B, 0.6 * B)) * (1 - ease(seg(u, 10 * B, 1.2 * B)));
  const big = back(seg(u, 8 * B - 0.25, 0.3), 2), bh = hit(u, 8 * B, 4);
  const warm = ease(seg(u, 10 * B, 1.2 * B));
  const bg = `rgb(${lerp(lerp(246, 10, dark), 250, warm * 0)},${lerp(246, 10, dark)},${lerp(248, 18, dark)})`;
  return (
    <AbsoluteFill style={{background: bg}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        {warm > 0.01 ? <rect x={0} y={0} width={1920} height={1080} fill="#ffe6c4" opacity={warm * 0.85} /> : null}
        <g opacity={1 - dark * 0.85}>
          <rect x={700} y={140} width={520} height={800} rx={48} fill={warm > 0.5 ? '#fff8ee' : '#ffffff'} stroke="#d8d8de" strokeWidth={3} />
          <text x={960} y={210} textAnchor="middle" fontFamily={FONT.sans} fontWeight={700} fontSize={28} fill="#333">好友</text>
          {msgs.map(([m, mine, k], i) => { const a = popAt(u, B, k, 0.25, 2.4); const w = m.length * 34 + 60; return a > 0.01 ? <g key={i} transform={`translate(${mine ? 1180 - w : 740} ${300 + i * 110}) scale(${a})`}><rect width={w} height={70} rx={35} fill={mine ? '#3a8cf0' : '#ececf0'} /><text x={w / 2} y={46} textAnchor="middle" fontFamily={FONT.sans} fontSize={32} fill={mine ? '#fff' : '#333'}>{m}</text></g> : null; })}
          {typing ? <g transform="translate(740 640)"><rect width={130} height={60} rx={30} fill="#ececf0" />{[0, 1, 2].map(i => <circle key={i} cx={36 + i * 30} cy={30} r={8} fill="#999" opacity={0.4 + 0.6 * Math.abs(Math.sin(u * 8 - i))} />)}</g> : null}
          {u > 5 * B - 0.2 ? <g transform={`translate(740 640) scale(${popAt(u, B, 5, 0.2, 2.4)})`}><rect width={140} height={70} rx={35} fill="#ececf0" /><text x={70} y={46} textAnchor="middle" fontFamily={FONT.sans} fontSize={32} fill="#333">哦。</text></g> : null}
        </g>
        {/* 暗下来以后只剩“正在输入”的三个点，一拍一亮，等一个回复 */}
        {big > 0.01 && dark > 0.2 ? <g transform={`translate(960 520) scale(${big})`} opacity={dark}>
          {[-1, 0, 1].map(i => { const k = Math.floor(u / B), on = ((k + i + 3) % 3) === 0; return <circle key={i} cx={i * 120} cy={0} r={34 + (on ? 10 * bh + 8 : 0)} fill={on ? '#ff5a6a' : '#5a2a34'} style={on ? {filter: 'drop-shadow(0 0 24px rgba(255,90,106,.8))'} : undefined} />; })}
        </g> : null}
      </svg>
      <Line u={u} from={B} to={8 * B - 0.3} text="白底聊天，一句话就能让画面暗下来。" hl="一句话" hlCol="#e84a5a" dark={dark < 0.5} />
      <Line u={u} from={10 * B + 0.1} to={SEG - 0.4} text="再亮起来的时候，已经是暖光。" hl="暖光" hlCol="#e8862a" dark />
      <Label u={u} no="20" name="聊天界面反差" desc="白底聊天界面，转暗场，再转暖" motion="气泡一拍一条弹出、正在输入、整屏转暗只剩等待的光点、暖光回来" col="#3a8cf0" dark={dark < 0.5} />
    </AbsoluteFill>
  );
};

// ── 21 冷光粒子科学图解：深色空间里青蓝点云聚成一个细胞，放大镜圈出局部，强拍一束光穿过通道，编号标注 ──
export const ColdScience: React.FC<Seg> = ({u, B}) => {
  const form = ease(seg(u, 0, 3 * B));
  const lens = ease(seg(u, 4 * B, B));
  const beam = ease(seg(u, 8 * B - 0.3, 0.6)), bh = hit(u, 8 * B, 4);
  const tags = popAt(u, B, 9, 0.3, 2.4), tags2 = popAt(u, B, 10, 0.3, 2.4);
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 50%, #0a1a24 0%, #03070c 70%)'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs><filter id="csGlow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        {/* 点云细胞 */}
        <g filter="url(#csGlow)">
          {Array.from({length: 520}, (_, i) => {
            const a = random('ca' + i) * Math.PI * 2, rr = Math.sqrt(random('cr' + i)) * 260, edge = i % 3 === 0;
            const R = edge ? 260 : rr, x0 = random('sx' + i) * 1920, y0 = random('sy' + i) * 1080;
            const x = lerp(x0, 640 + Math.cos(a) * R, form), y = lerp(y0, 540 + Math.sin(a) * R, form);
            return <circle key={i} cx={x + Math.sin(u + i) * 2} cy={y} r={edge ? 2.6 : 1.8} fill={edge ? '#7ff0ff' : '#3ab8d8'} opacity={edge ? 0.9 : 0.55} />;
          })}
          <circle cx={600} cy={500} r={46 * form} fill="none" stroke="#7ff0ff" strokeWidth={2} opacity={0.7} />
        </g>
        {/* 放大镜：局部的膜和通道 */}
        {lens > 0.01 ? <g opacity={lens}>
          <path d={`M 860 470 L ${lerp(860, 1180, lens)} ${lerp(470, 400, lens)}`} stroke="#7ff0ff" strokeWidth={2} />
          <circle cx={820} cy={480} r={40} fill="none" stroke="#7ff0ff" strokeWidth={3} />
          <g transform={`translate(1460 460) scale(${lens})`}>
            <circle r={280} fill="rgba(6,20,30,.9)" stroke="#7ff0ff" strokeWidth={3} />
            <clipPath id="csLens"><circle r={276} /></clipPath>
            <g clipPath="url(#csLens)">
              {[-40, 40].map(y => <g key={y}>{Array.from({length: 26}, (_, i) => <circle key={i} cx={-300 + i * 24} cy={y} r={9} fill="#3ab8d8" opacity={Math.abs(i - 12.5) < 1.6 ? 0 : 0.9} />)}</g>)}
              {[-14, 14].map(x => <rect key={x} x={x - 10} y={-60} width={20} height={120} rx={8} fill="#b0f6ff" opacity={0.8} />)}
              {beam > 0.01 ? <path d={`M 0 ${-280} L 0 ${lerp(-280, 280, beam)}`} stroke="#fff" strokeWidth={10 + 10 * bh} opacity={0.9} style={{filter: 'drop-shadow(0 0 14px #7ff0ff)'}} /> : null}
            </g>
          </g>
        </g> : null}
        {tags > 0.01 ? <g transform={`translate(1700 260) scale(${tags})`}><path d="M -40 30 L -110 120" stroke="#ffd36a" strokeWidth={2} /><text fontFamily={FONT.sans} fontSize={30} fill="#ffd36a">① 感光</text></g> : null}
        {tags2 > 0.01 ? <g transform={`translate(1700 680) scale(${tags2})`}><path d="M -40 -30 L -150 -160" stroke="#ffd36a" strokeWidth={2} /><text fontFamily={FONT.sans} fontSize={30} fill="#ffd36a">② 开门</text></g> : null}
      </svg>
      <Line u={u} from={B} to={SEG - 0.4} text="点云拼出结构，一束光穿过去。" hl="一束光" hlCol="#7ff0ff" />
      <Label u={u} no="21" name="冷光粒子科学图解" desc="深色空间、冷青蓝辉光，点云构成立体结构，配剖面和局部放大" motion="粒子聚成结构、放大镜圈出局部、强拍光束穿过通道、编号标注弹出" col="#7ff0ff" />
    </AbsoluteFill>
  );
};

// ── 22 像素人物曲线图解：聚光台上一个像素小人，身后人生曲线带着节点一段段画，强拍曲线冲高火花四溅，下面柱子比较 ──
const PX = 12;
const PIXEL: string[] = ['..hhhh..', '.hhhhhh.', '.hssssh.', '.sesses.', '.ssssss.', '..ssss..', '.cccccc.', 'cccccccc', 'cc.cc.cc', 'ss.cc.ss', '..pppp..', '..p..p..', '..p..p..', '.bb..bb.'];
const PCOL: Record<string, string> = {h: '#2a1a12', s: '#f2c49a', e: '#1a1010', c: '#3a5ab8', p: '#2a2a3a', b: '#111'};
export const Pixel: React.FC<Seg> = ({u, B}) => {
  const man = popAt(u, B, 1, 0.3, 2.4);
  const curveP = ease(seg(u, 2 * B, 5.6 * B));
  const rise = back(seg(u, 8 * B - 0.2, 0.3), 1.4), bh = hit(u, 8 * B, 4);
  const bars = ease(seg(u, 9 * B, 1.2 * B));
  const pts: [number, number][] = [[700, 520], [820, 480], [940, 560], [1060, 600], [1180, 540], [1300, 570]];
  const n = Math.max(1, Math.round(curveP * (pts.length - 1)));
  const drawn = pts.slice(0, n + 1);
  const top: [number, number] = [lerp(1300, 1460, rise), lerp(570, 260, rise)];
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 40%, #1c2040 0%, #0a0c1a 75%)'}}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs><filter id="pxGlow"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        <path d="M 330 0 L 450 0 L 560 820 L 220 820 Z" fill="rgba(200,210,255,.12)" />
        <rect x={0} y={820} width={1920} height={260} fill="#141830" />
        <g transform={`translate(390 ${820 - PIXEL.length * PX * man}) scale(1 ${man})`}>
          {PIXEL.map((row, y) => row.split('').map((ch, x) => ch === '.' ? null : <rect key={x + '-' + y} x={x * PX - 4 * PX} y={y * PX} width={PX} height={PX} fill={PCOL[ch]} />))}
        </g>
        <rect x={640} y={180} width={920} height={500} rx={16} fill="rgba(20,24,52,.6)" stroke="#3a4278" strokeWidth={2} opacity={curveP > 0 ? 1 : 0} />
        <path d={'M ' + drawn.map(p => p.join(' ')).join(' L ') + (rise > 0 ? ` L ${top[0]} ${top[1]}` : '')} fill="none" stroke="#8ab0ff" strokeWidth={6} strokeLinejoin="round" filter="url(#pxGlow)" />
        {drawn.map(([x, y], i) => i % 2 === 1 ? <g key={i}><circle cx={x} cy={y} r={9} fill="#ff6a7a" /><text x={x} y={y + 44} textAnchor="middle" fontFamily={FONT.sans} fontSize={22} fill="#c8ccf0">{['第一次', '低谷', '转折'][(i - 1) / 2]}</text></g> : null)}
        {rise > 0.01 ? <g><circle cx={top[0]} cy={top[1]} r={12} fill="#fff" filter="url(#pxGlow)" />{bh > 0.05 ? Array.from({length: 14}, (_, i) => { const a = i / 14 * Math.PI * 2, r = 20 + (1 - bh) * 120; return <rect key={i} x={top[0] + Math.cos(a) * r - 4} y={top[1] + Math.sin(a) * r - 4} width={8} height={8} fill={i % 2 ? '#ffd36a' : '#ff6a7a'} opacity={bh} />; }) : null}</g> : null}
        {bars > 0.01 ? [[1630, 18, '#f2a23a'], [1720, 21, '#ff6a7a'], [1810, 74, '#8ab0ff']].map(([x, v, col], i) => <g key={i}><rect x={(x as number) - 32} y={680 - (v as number) * 4 * bars} width={64} height={(v as number) * 4 * bars} fill={col as string} /><text x={x as number} y={670 - (v as number) * 4 * bars} textAnchor="middle" fontFamily={FONT.sans} fontWeight={900} fontSize={34} fill="#fff" opacity={bars}>{v as number}</text></g>) : null}
      </svg>
      <Line u={u} from={B} to={SEG - 0.4} text="像素小人站在台上，人生画成一条线。" hl="一条线" hlCol="#8ab0ff" y={60 + 870} />
      <Label u={u} no="22" name="像素人物曲线图解" desc="像素人物站在聚光台上，发光曲线、事件节点和柱形对比" motion="像素人落地、曲线带节点一段段画、强拍冲高像素火花、柱子长出来比较" col="#8ab0ff" />
    </AbsoluteFill>
  );
};
