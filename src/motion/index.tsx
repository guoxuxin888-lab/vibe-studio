// Reusable motion. Each piece is timed in beats and takes colour from the style, never from a hard-coded brand.
import React from 'react';
import {AbsoluteFill, random} from 'remotion';
import {clamp01, easeOut, useMusic} from '../lib/music';
import {FONT, Style} from '../styles';

// Subtitle: characters come into focus one at a time, then the block leaves together.
export const QuietCaption: React.FC<{cue: string; text: string; endCue?: string; end?: number; style: Style; y?: number; size?: number; strong?: boolean; shadow?: string; color?: string}> = ({cue, text, endCue, end, style, y = 915, size = 50, strong, shadow = '0 2px 24px rgba(0,0,0,.65)', color}) => {
  const m = useMusic();
  const start = m.cue(cue), stop = end ?? (endCue ? m.cue(endCue) : start + 2 * m.barSec);
  if (m.t < start - 0.01 || m.t > stop + 0.4) return null;
  const leave = clamp01((m.t - stop) / 0.3);
  const chars = [...text];
  // A line is readable within one beat however long it is.
  const perChar = Math.min(0.07, m.beatSec / chars.length);
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: FONT[style.font], fontSize: size, fontWeight: strong ? 700 : 500, color: color ?? style.palette.ink, letterSpacing: 3, opacity: 1 - leave, filter: `blur(${leave * 8}px)`, textShadow: shadow}}>
      {chars.map((c, i) => {
        const p = easeOut(clamp01((m.t - start - i * perChar) / 0.24));
        return <span key={i} style={{opacity: p, filter: `blur(${(1 - p) * 10}px)`, display: 'inline-block', whiteSpace: 'pre'}}>{c}</span>;
      })}
    </div>
  );
};

// Expanding ring from a point at a cue. Use on landings, one at a time.
export const ImpactRing: React.FC<{cue: string; x: number; y: number; color: string; beats?: number; radius?: number}> = ({cue, x, y, color, beats = 1.5, radius = 620}) => {
  const m = useMusic();
  if (m.t < m.cue(cue)) return null;
  const p = m.after(cue, beats);
  if (p >= 1) return null;
  const e = easeOut(p);
  return <div style={{position: 'absolute', left: x - radius * e, top: y - radius * e, width: radius * 2 * e, height: radius * 2 * e, borderRadius: '50%', border: `${10 * (1 - p) + 1}px solid ${color}`, opacity: (1 - p) ** 1.5}} />;
};

// A number in the corner that keeps changing. Attention has somewhere to go when the picture rests.
export const Counter: React.FC<{label: string; value: number | string; style: Style; x?: number; y?: number}> = ({label, value, style, x = 1640, y = 70}) => (
  <div style={{position: 'absolute', left: x, top: y, fontFamily: FONT[style.font], color: style.palette.ink, textAlign: 'right', width: 220}}>
    <div style={{fontSize: 22, color: style.palette.muted, letterSpacing: 3}}>{label}</div>
    <div style={{fontSize: 68, fontWeight: 700, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums'}}>{value}</div>
  </div>
);

// Film surface, seeded per frame so renders are repeatable.
export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.06}) => {
  const m = useMusic();
  const dots = Array.from({length: 240}, (_, i) => ({x: random(`x${i}${m.frame}`) * 1920, y: random(`y${i}${m.frame}`) * 1080, a: random(`a${i}${m.frame}`)}));
  return <svg style={{position: 'absolute', inset: 0, opacity, mixBlendMode: 'overlay'}} width={1920} height={1080}>{dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={1.3} fill={d.a > 0.5 ? '#fff' : '#000'} />)}</svg>;
};

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.62}) => <AbsoluteFill style={{background: `radial-gradient(ellipse at center, transparent 48%, rgba(0,0,0,${strength}) 100%)`}} />;

// Static version of the background for a style, used by previews and as a starting point for new films.
export const StyleBackdrop: React.FC<{style: Style}> = ({style}) => {
  const {bg, bg2, muted} = style.palette;
  const t = style.texture;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 42%, ${bg2} 0%, ${bg} 74%)`}}>
      {t === 'grid' ? <svg width={1920} height={1080} style={{opacity: 0.28}}><defs><pattern id="g" width={60} height={60} patternUnits="userSpaceOnUse"><path d="M60 0H0V60" fill="none" stroke={muted} strokeWidth={1} /></pattern></defs><rect width={1920} height={1080} fill="url(#g)" /></svg> : null}
      {t === 'hatch' ? <svg width={1920} height={1080} style={{opacity: 0.16}}><defs><pattern id="h" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V14" stroke={muted} strokeWidth={2} /></pattern></defs><rect width={1920} height={1080} fill="url(#h)" /></svg> : null}
      {t === 'wash' ? <svg width={1920} height={1080} style={{opacity: 0.5}}><defs><filter id="w"><feTurbulence baseFrequency="0.006 0.012" numOctaves={4} seed={4} /><feColorMatrix values={`0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 0 0.2  0 0 0 1.1 -0.42`} /></filter></defs><rect width={1920} height={1080} filter="url(#w)" /></svg> : null}
      {t === 'paper' ? <svg width={1920} height={1080} style={{opacity: 0.22, mixBlendMode: 'multiply'}}><defs><filter id="p"><feTurbulence baseFrequency="0.7" numOctaves={3} seed={9} /><feColorMatrix type="saturate" values="0" /></filter></defs><rect width={1920} height={1080} filter="url(#p)" /></svg> : null}
    </AbsoluteFill>
  );
};
