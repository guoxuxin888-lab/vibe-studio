import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {clamp01, easeInOut, easeOut, MusicProvider, Timeline, useMusic} from '../../src/lib/music';
import {Grain, ImpactRing, QuietCaption, Vignette} from '../../src/motion';
import {FONT, getStyle} from '../../src/styles';
import timeline from './timeline.json';

const style = getStyle('velvet-stage');
const P = style.palette;

// A person seen from behind, no face. Stands, then walks out sideways when their cue arrives.
const Sitter: React.FC<{x: number; y: number; s?: number; leave?: string; dir?: number; hero?: boolean}> = ({x, y, s = 1, leave, dir = 1, hero}) => {
  const m = useMusic();
  const p = leave ? m.after(leave, 2.5) : 0;
  const stand = easeOut(clamp01(p / 0.3));
  const walk = easeInOut(clamp01((p - 0.2) / 0.8));
  const breath = hero ? Math.sin(m.beat * Math.PI / 2) * 1.5 : 0;
  const rim = (hero ? 0.55 : 0.32) + 0.4 * m.tension;
  return (
    <g transform={`translate(${x + walk * 760 * dir} ${y - stand * 54 * s + breath}) scale(${s})`} opacity={1 - clamp01((p - 0.7) / 0.3)}>
      <circle cx={0} cy={-92} r={34} fill="#060203" stroke={P.accent2} strokeOpacity={rim} strokeWidth={2.5} />
      <path d="M-58 44 C-60 -30 -38 -54 0 -54 C38 -54 60 -30 58 44 Z" fill="#060203" stroke={P.accent2} strokeOpacity={rim} strokeWidth={2.5} />
    </g>
  );
};

const Seat: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-72 90 L-72 -8 Q-72 -26 -54 -26 L54 -26 Q72 -26 72 -8 L72 90 Z" fill="#4a1720" />
    <path d="M-72 -8 Q-72 -26 -54 -26 L54 -26 Q72 -26 72 -8" fill="none" stroke="#8a3340" strokeWidth={3} />
  </g>
);

// The ticket is drawn at its home position in the world. The camera moves to it, it does not jump.
const Ticket: React.FC = () => {
  const m = useMusic();
  const landed = m.t >= m.cue('title');
  const slam = landed ? easeOut(m.after('title', 0.35)) : 0;
  const tear = easeInOut(m.after('tear', 1));
  const glow = 0.25 + m.motifPulse(2.4) * 0.5 + (landed ? (1 - m.after('title', 4)) * 0.7 : 0);
  return (
    <g transform="translate(960 800)">
      <ellipse cx={0} cy={0} rx={170} ry={110} fill={P.accent2} opacity={glow * 0.5} style={{filter: 'blur(36px)'}} />
      <path d="M-84 74 C-60 96 -18 100 16 84 L24 44 L-70 40 Z" fill="#17090b" />
      {/* Main part stays in the hand, the stub tears away on beat 3. */}
      <g transform={`rotate(-4)`}>
        <path d="M-120 -58 H64 V-40 a8 8 0 0 0 0 16 V-8 a8 8 0 0 0 0 16 V24 a8 8 0 0 0 0 16 V58 H-120 a10 10 0 0 1 -10 -10 V-48 a10 10 0 0 1 10 -10 Z" fill={P.ink} />
        <text x={-33} y={landed ? 13 : 8} textAnchor="middle" fontFamily={FONT.serif} fontWeight={900} fontSize={landed ? 38 : 18} fill={landed ? P.accent : '#6c5a4c'} letterSpacing={landed ? 2 : 4} opacity={landed ? slam : 0.9} transform={landed ? `translate(-33 3) scale(${1.5 - slam * 0.5}) translate(33 -3)` : undefined}>{landed ? '沉没成本' : 'ADMIT ONE'}</text>
        <g transform={`translate(${tear * 56} ${tear * tear * 250}) rotate(${tear * 32} 96 0)`} opacity={1 - clamp01((m.after('tear', 1.6) - 0.7) / 0.3)}>
          <path d="M70 -58 H130 a10 10 0 0 1 10 10 V48 a10 10 0 0 1 -10 10 H70 V40 a8 8 0 0 0 0 -16 V8 a8 8 0 0 0 0 -16 V-24 a8 8 0 0 0 0 -16 Z" fill={P.ink} />
          <text x={104} y={8} textAnchor="middle" fontFamily={FONT.serif} fontSize={22} fill="#6c5a4c" transform="rotate(90 104 0)">座 7</text>
        </g>
      </g>
    </g>
  );
};

const Scene: React.FC = () => {
  const m = useMusic();
  // Camera, all in beats: open on the ticket, pull out through bar 1, creep in over the suspension,
  // arrive on the downbeat of bar 4, pull back as the music thins.
  const pull = easeInOut(clamp01((m.t - 0.6) / (m.cue('leaving') + 0.8)));
  const creep = easeInOut(m.after('because', 4));
  const hit = easeOut(m.after('title', 0.25));
  const back = easeInOut(m.after('question', 1.5));
  const zoom = 4.2 + (1 - 4.2) * pull + 0.55 * creep + 2.45 * hit - 2.95 * back;
  const focus = clamp01(1 - pull + creep * 0.3 + hit - back * 1.3);
  const worldY = 540 + (800 - 540) * focus;
  const shake = m.t >= m.cue('title') ? (1 - m.after('title', 1)) ** 2 * 14 : 0;
  const stage = 0.18 + 0.82 * m.tension * (0.72 + 0.28 * m.energy);
  const door = easeOut(m.after('door', 3));
  return (
    <AbsoluteFill style={{background: P.bg, overflow: 'hidden'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{transform: `translate(${Math.sin(m.frame * 2.4) * shake}px, ${Math.cos(m.frame * 3.1) * shake}px)`}}>
        <defs>
          <radialGradient id="stage" cx="50%" cy="0%" r="90%"><stop offset="0%" stopColor={P.accent2} stopOpacity={0.9} /><stop offset="55%" stopColor={P.accent} stopOpacity={0.55} /><stop offset="100%" stopColor={P.bg} stopOpacity={0} /></radialGradient>
          <linearGradient id="curtain" x1="0" x2="1"><stop offset="0" stopColor="#3a0d15" /><stop offset=".5" stopColor="#8a1f2c" /><stop offset="1" stopColor="#3a0d15" /></linearGradient>
          <linearGradient id="doorlight" x1="1" x2="0"><stop offset="0" stopColor={P.accent2} stopOpacity={0.9} /><stop offset="1" stopColor={P.accent2} stopOpacity={0} /></linearGradient>
        </defs>
        <g transform={`translate(960 540) scale(${zoom}) translate(-960 ${-worldY})`}>
          {/* Stage: brightness is the tension of the music. */}
          <rect x={260} y={40} width={1400} height={430} fill="url(#curtain)" opacity={stage} />
          {Array.from({length: 22}, (_, i) => <rect key={i} x={260 + i * 64} y={40} width={4} height={430} fill="#000" opacity={0.18 * stage + 0.05} />)}
          <rect x={0} y={0} width={1920} height={760} fill="url(#stage)" opacity={stage * 0.55} />
          <path d="M930 40 L990 40 L1090 470 L830 470 Z" fill={P.accent2} opacity={0.16 + 0.3 * stage} style={{filter: 'blur(10px)'}} />
          <g transform={`translate(960 470) rotate(${Math.sin(m.beat * Math.PI) * 4})`} fill="#090304"><circle cy={-120} r={22} /><path d="M-30 0 L-20 -94 Q0 -104 20 -94 L30 0 Z" /></g>
          <rect x={0} y={470} width={1920} height={610} fill="#120508" />
          {/* Exit on the right. It only opens when the question arrives. */}
          <rect x={1760} y={330} width={92} height={260} fill={P.accent2} opacity={door * 0.95} />
          <path d={`M1760 330 L1760 590 L${1760 - door * 620} 920 L${1760 - door * 620} 640 Z`} fill="url(#doorlight)" opacity={door * 0.5} style={{filter: 'blur(26px)'}} />
          {[300, 520, 740, 1180, 1400, 1620].map(x => <Seat key={x} x={x} y={520} s={0.72} />)}
          <Sitter x={520} y={520} s={0.72} leave="leave1" dir={-1} />
          <Sitter x={1400} y={520} s={0.72} leave="leave2" />
          {[140, 400, 680, 1240, 1520, 1780].map(x => <Seat key={x} x={x} y={690} />)}
          <Seat x={960} y={690} />
          <Sitter x={680} y={690} leave="leave3" dir={-1} />
          <Sitter x={1240} y={690} leave="leave4" />
          <Sitter x={960} y={690} hero />
          <Ticket />
          <ImpactRing cue="title" x={960} y={800} color={P.accent2} radius={200} beats={2} />
        </g>
      </svg>
      <Vignette strength={0.68 - 0.3 * m.tension} />
      <Grain opacity={0.08} />
      <QuietCaption style={style} cue="lineTicket" text="一张票。" end={m.cue('lineBad') - 0.1} y={90} />
      <QuietCaption style={style} cue="lineBad" text="戏很烂。" end={m.cue('leave1') + 1.3} y={90} />
      <QuietCaption style={style} cue="lineStay" text="有人走了，你没走。" endCue="lineBecause" />
      <QuietCaption style={style} cue="lineBecause" text="因为钱，已经花了。" end={m.cue('title') - 0.12} />
      <QuietCaption style={style} cue="lineAsk" text="该问的不是花了多少，" end={15} y={900} />
      <QuietCaption style={style} cue="lineWorth" text="是接下来，还值不值。" end={15} y={970} strong />
    </AbsoluteFill>
  );
};

export const Film: React.FC = () => (
  <MusicProvider timeline={timeline as Timeline}>
    <Audio src={staticFile('films/sunk-cost/audio.wav')} />
    <Scene />
  </MusicProvider>
);
export const meta = {id: 'sunk-cost', timeline: timeline as Timeline};
