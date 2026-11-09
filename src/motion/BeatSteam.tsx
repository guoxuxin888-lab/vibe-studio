import React from 'react';
// Local SVG space. A reusable small steam system; one drift cycle is four beats.
export const BeatSteam: React.FC<{beat:number; x?:number; y?:number; opacity?:number; color?:string}> = ({beat,x=0,y=0,opacity=1,color='#fff5dc'}) => (
  <g transform={`translate(${x} ${y})`} opacity={opacity} fill="none" stroke={color} strokeLinecap="round">
    {[0,1,2,3,4].map(i=>{
      const p=((beat/4+i*.21)%1+1)%1;
      return <path key={i} d={`M${(i-2)*22} 0 C${(i-2)*22-38} -40 ${(i-2)*22+36} -60 ${(i-2)*22+Math.sin(beat+i)*14} -115`} transform={`translate(${Math.sin(beat*.6+i)*12} ${-p*70})`} opacity={Math.sin(Math.PI*p)*.68} strokeWidth={8-i*.7}/>;
    })}
  </g>
);
