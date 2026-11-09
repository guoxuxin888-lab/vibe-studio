// 画风图鉴各段共用：时间工具、左上角画风说明、底部字幕、右下角标注。
import React from 'react';
import {FONT} from '../../src/styles';

export const SEG = 8; // 秒，等于 12 拍
export type Seg = {u: number; B: number; c: (n: string) => number; base: number};
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const seg = (t: number, a: number, d: number) => clamp01((t - a) / d);
export const ease = (x: number) => 1 - (1 - clamp01(x)) ** 3;
export const easeIn = (x: number) => clamp01(x) ** 3;
export const easeInOut = (x: number) => { const p = clamp01(x); return p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2; };
export const back = (x: number, s = 2) => { const p = clamp01(x) - 1; return x <= 0 ? 0 : x >= 1 ? 1 : 1 + (s + 1) * p ** 3 + s * p ** 2; };
export const hit = (t: number, at: number, k = 8) => (t >= at ? Math.exp(-(t - at) * k) : 0);
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
// 第 k 拍弹出来（拍上到位）
export const popAt = (u: number, B: number, k: number, d = 0.35, s = 2.2) => back(seg(u, k * B - d, d), s);
export const beatPulse = (u: number, B: number, k = 6) => Math.exp(-((u / B) % 1) * B * k);

export const Label: React.FC<{u: number; no: string; name: string; desc: string; motion: string; col: string; dark?: boolean; shade?: boolean; right?: boolean}> = ({u, no, name, desc, motion, col, dark, shade, right}) => {
  const a = ease(u / 0.6);
  const sub = dark ? 'rgba(30,26,36,.8)' : 'rgba(255,250,240,.82)', sub2 = dark ? 'rgba(30,26,36,.6)' : 'rgba(255,250,240,.55)';
  return (
    <div style={{position: 'absolute', ...(right ? {right: 64, textAlign: 'right' as const} : {left: 64}), top: 52, opacity: a, transform: `translateY(${(1 - a) * 12}px)`, fontFamily: FONT.serif, textShadow: dark ? 'none' : '0 2px 12px rgba(0,0,0,.6)', ...(shade ? {background: `linear-gradient(${right ? 270 : 90}deg, rgba(8,12,30,.78), rgba(8,12,30,.55) 70%, rgba(8,12,30,0))`, padding: right ? '14px 20px 16px 60px' : '14px 60px 16px 20px', ...(right ? {marginRight: -20} : {marginLeft: -20}), borderRadius: 12} : {})}}>
      <div style={{fontSize: 46, fontWeight: 900, color: col, letterSpacing: 4}}><span style={{opacity: 0.6, marginRight: 16}}>{no}</span>{name}</div>
      <div style={{fontSize: 26, color: sub, marginTop: 8}}>{desc}</div>
      <div style={{fontSize: 22, color: sub2, marginTop: 6}}>动效：{motion}</div>
    </div>
  );
};
export const Mark: React.FC<{dark?: boolean}> = ({dark}) => <div style={{position: 'absolute', right: 56, bottom: 36, fontFamily: FONT.sans, fontSize: 20, color: dark ? 'rgba(30,26,36,.5)' : 'rgba(255,250,240,.45)', letterSpacing: 2}}>Vibe Studio 画风图鉴 · 原创示意</div>;
// 字幕：可以有一个上色的词
export const Line: React.FC<{u: number; from: number; to: number; text: string; hl?: string; hlCol?: string; col?: string; y?: number; dark?: boolean}> = ({u, from, to, text, hl, hlCol = '#ff7aa8', col, y = 930, dark}) => {
  if (u < from - 0.05 || u > to + 0.35) return null;
  const a = ease((u - from) / 0.3) * (1 - clamp01((u - to) / 0.3));
  const parts = hl && text.includes(hl) ? text.split(hl) : [text];
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: FONT.serif, fontWeight: 700, fontSize: 48, color: col ?? (dark ? '#2a2430' : '#f4ecdc'), opacity: a, filter: `blur(${(1 - a) * 6}px)`, letterSpacing: 3, textShadow: dark ? '0 1px 10px rgba(255,255,255,.7)' : '0 2px 18px rgba(0,0,0,.7)'}}>
      {parts.length > 1 ? <>{parts[0]}<span style={{color: hlCol}}>{hl}</span>{parts[1]}</> : text}
    </div>
  );
};
export {FONT};
