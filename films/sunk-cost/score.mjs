// A 15-second example, 5 bars of 4/4 at 80 BPM, so one bar is exactly 3 seconds.
// Written before any picture. Each bar has one dramatic job, and the picture follows it.
export default {
  title: 'Sunk Cost',
  bpm: 80,
  meter: 4,
  key: 'D',
  mode: 'aeolian',
  palette: 'felt-night',
  seed: 23,
  // The ticket's motif falls and never quite settles. It is the sound of the object.
  motif: { name: 'ticket', notes: [[0, 5, 1, 0.8], [1, 4, 1, 0.68], [2, 3, 2, 0.74]] },
  sections: [
    { id: 'ticket', role: 'statement: the object alone', bars: 1, tension: 0.12, harmony: ['i'], motif: true },
    { id: 'leaving', role: 'others leave, one per beat', bars: 1, tension: 0.36, harmony: ['VI'], motif: true },
    { id: 'because', role: 'held suspension under the reason', bars: 1, tension: 0.64, harmony: ['Vsus4'] },
    { id: 'name', role: 'the name lands on the tonic', bars: 1, tension: 0.92, harmony: ['i'], motif: true, motifOctave: 5 },
    {
      id: 'question', role: 'thins out, ends unresolved', bars: 1, tension: 0.2, harmony: ['iv'],
      notes: [{ part: 'melody', beat: 0, degree: 5, octave: 4, len: 1, vel: 0.5 }, { part: 'melody', beat: 2, degree: 2, octave: 4, len: 2, vel: 0.46 }],
    },
  ],
  cues: {
    lineTicket: { bar: 1, beat: 1 },
    lineBad: { bar: 1, beat: 3 },
    leave1: { bar: 2, beat: 1 },
    leave2: { bar: 2, beat: 2 },
    leave3: { bar: 2, beat: 3 },
    leave4: { bar: 2, beat: 4 },
    lineStay: { bar: 2, beat: 3 },
    lineBecause: { bar: 3, beat: 1 },
    title: { bar: 4, beat: 1 },
    tear: { bar: 4, beat: 3 },
    lineAsk: { bar: 5, beat: 2 },
    lineWorth: { bar: 5, beat: 3 },
    door: { bar: 5, beat: 1 },
  },
  sfx: [
    { at: 'leave1', name: 'thud', options: { midi: 45 }, gain: 0.55 },
    { at: 'leave2', name: 'thud', options: { midi: 45 }, gain: 0.45 },
    { at: 'leave3', name: 'thud', options: { midi: 41 }, gain: 0.55 },
    { at: 'leave4', name: 'thud', options: { midi: 41 }, gain: 0.45 },
    { at: 'title', name: 'riser', options: { seconds: 2.4 }, gain: 0.55 },
    { at: 'title', name: 'impact', options: { midi: 38 }, gain: 0.85 },
    { at: 'tear', name: 'tear', gain: 0.8 },
    { at: 'door', name: 'whoosh', options: { seconds: 1.1, direction: 1 }, gain: 0.26 },
  ],
};
