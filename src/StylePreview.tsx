import React from 'react';
import {AbsoluteFill} from 'remotion';
import {StyleBackdrop} from './motion';
import {FONT, getStyle} from './styles';

// One frame that shows what a style feels like: its ground, ink, accents and type.
export const StylePreview: React.FC<{id: string}> = ({id}) => {
  const s = getStyle(id), P = s.palette;
  return (
    <AbsoluteFill style={{zoom: 1280 / 1920}}>
      <div style={{position: 'relative', width: 1920, height: 1080, overflow: 'hidden'}}>
        <StyleBackdrop style={s} />
        <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
          <line x1={240} y1={760} x2={1680} y2={760} stroke={P.muted} strokeWidth={3} />
          <circle cx={1360} cy={330} r={120} fill={P.accent2} opacity={0.9} />
          <g transform="translate(1040 760)" fill={P.ink}><circle cy={-178} r={38} /><path d="M-52 0 L-30 -128 Q0 -146 30 -128 L52 0 Z" /></g>
          <g transform="translate(1240 760)" fill={P.accent}><circle cy={-178} r={38} /><path d="M-52 0 L-30 -128 Q0 -146 30 -128 L52 0 Z" /></g>
        </svg>
        <div style={{position: 'absolute', left: 150, top: 300, fontFamily: FONT[s.font], color: P.ink}}>
          <div style={{fontSize: 118, fontWeight: 900, letterSpacing: 8}}>{s.name}</div>
          <div style={{fontSize: 34, marginTop: 26, color: P.accent, fontWeight: 700}}>{s.id}</div>
          <div style={{fontSize: 30, marginTop: 26, color: P.muted, width: 760, lineHeight: 1.5}}>{s.fits}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
