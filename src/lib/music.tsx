// The picture reads the score through this hook, so a change to tempo or form moves every event with it.
import React, {createContext, useContext, useMemo} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';

export type Timeline = {
  fps: number; duration: number; frames: number; bpm: number; meter: number; beatSec: number; barSec: number; key: string; mode: string;
  sections: {id: string; role: string; start: number; end: number; tension: number; rest: boolean}[];
  chords: {t: number; symbol: string; bar: number}[];
  cues: Record<string, number>;
  hits: {t: number; name: string; gain: number}[];
  motif: {t: number; midi: number; vel: number}[];
  energy: number[];
};

const Ctx = createContext<Timeline | null>(null);
export const MusicProvider: React.FC<{timeline: Timeline; children: React.ReactNode}> = ({timeline, children}) => <Ctx.Provider value={timeline}>{children}</Ctx.Provider>;

export const easeOut = (x: number) => 1 - (1 - x) ** 3;
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function useMusic() {
  const tl = useContext(Ctx);
  if (!tl) throw new Error('useMusic needs a MusicProvider');
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return useMemo(() => {
    const t = frame / fps;
    const beat = t / tl.beatSec;
    const section = tl.sections.find(s => t >= s.start && t < s.end) ?? tl.sections[tl.sections.length - 1];
    const idx = tl.sections.indexOf(section);
    // Tension glides into the next section across its last beat rather than jumping.
    const next = tl.sections[idx + 1];
    const toNext = next ? clamp01((t - (section.end - tl.beatSec)) / tl.beatSec) : 0;
    const tension = section.tension + (next ? (next.tension - section.tension) * easeInOut(toNext) : 0);
    const cue = (name: string) => { if (!(name in tl.cues)) throw new Error(`Unknown cue: ${name}`); return tl.cues[name]; };
    return {
      t, frame, beat, bar: Math.floor(beat / tl.meter), beatPhase: beat % 1, section, tension,
      energy: tl.energy[Math.min(frame, tl.energy.length - 1)] ?? 0,
      beatSec: tl.beatSec, barSec: tl.barSec,
      chord: [...tl.chords].reverse().find(c => c.t <= t)?.symbol ?? '',
      cue,
      since: (name: string) => t - cue(name),
      // 0 to 1 over `beats` beats after the cue. Motion is always measured in beats, never seconds.
      after: (name: string, beats = 1) => clamp01((t - cue(name)) / (beats * tl.beatSec)),
      // A decaying accent on each beat, the visual equivalent of a pulse in the low end.
      pulse: (every = 1, decay = 5) => Math.exp(-((beat % every) * tl.beatSec) * decay),
      // A decaying accent from the most recent melody note.
      motifPulse: (decay = 3) => { const last = [...tl.motif].reverse().find(n => n.t <= t); return last ? Math.exp(-(t - last.t) * decay) * last.vel : 0; },
    };
  }, [frame, fps, tl]);
}
