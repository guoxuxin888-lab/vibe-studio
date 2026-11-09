import React from 'react';
import {useMusic, clamp01, easeOut} from '../lib/music';
import {FONT, Style} from '../styles';

export type SrtCue = {id: number; start: number; end: number; text: string};
// Speech keeps its original SRT boundaries. Fades are contained inside each cue.
// Used for contiguous subtitles and short utterances; never overlaps the next cue.
export const SrtLine: React.FC<{cues: SrtCue[]; style: Style; y?: number; size?: number; omit?: number[]; highlights?: Record<number,string>; inset?:number}> = ({cues, style, y=916, size=66, omit=[], highlights={},inset}) => {
 const m=useMusic(); const cue=cues.find(c=>m.t>=c.start && m.t<c.end);
 if (!cue || omit.includes(cue.id)) return null;
 const enterBeats=Math.min(0.18,(cue.end-cue.start)/m.beatSec/5);
 const p=clamp01((m.t-cue.start)/(enterBeats*m.beatSec));
 const out=clamp01((cue.end-m.t)/(0.08*m.beatSec));
 const word=highlights[cue.id]; const at=word?cue.text.indexOf(word):-1;
 const parts=at>=0?<>{cue.text.slice(0,at)}<span style={{color:style.palette.accent2}}>{word}</span>{cue.text.slice(at+word.length)}</>:cue.text;
 return <div data-srt-id={cue.id} style={{position:'absolute',top:y,left:inset??300,right:inset??220,textAlign:'center',fontFamily:FONT.serif,fontSize:size,fontWeight:800,color:style.palette.ink,lineHeight:1.18,whiteSpace:'nowrap',opacity:Math.min(p,out),transform:'translateY('+((1-easeOut(p))*8)+'px)',textShadow:'0 3px 6px #120c0a'}}>{parts}</div>;
};
// A restrained beat accent for title/name/decision cues. Color is passed from the film style.
export const CueAccent: React.FC<{cue:string;color:string;x:number;y:number;radius?:number;beats?:number}> = ({cue,color,x,y,radius=60,beats=0.9})=>{
 const m=useMusic();const u=(m.t-m.cue(cue))/m.beatSec;if(u<0||u>beats)return null;
 const p=clamp01(u/beats);return <g opacity={(1-p)*(1-p)}><ellipse cx={x} cy={y} rx={radius*(0.4+easeOut(p)*1.6)} ry={radius*0.34*(0.4+easeOut(p)*1.6)} stroke={color} strokeWidth={4*(1-p)+1} fill='none'/></g>;
};
