// Music theory helpers. Everything is deterministic: same input, same notes.
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const MODES = {
  ionian: [0, 2, 4, 5, 7, 9, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10],
  // Chinese pentatonic modes, written on a seven-slot grid so degrees stay stable.
  gong: [0, 2, 4, 4, 7, 9, 9],
  yu: [0, 0, 3, 5, 7, 7, 10],
};

export function keyToPc(key) {
  const m = /^([A-G])(#|b)?$/.exec(key);
  if (!m) throw new Error(`Bad key: ${key}`);
  return (NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
}

// Degree 1-based and may run past 7 or below 1. Octave 4 means middle C's octave.
export function degreeToMidi(key, mode, degree, octave = 4) {
  const scale = MODES[mode];
  if (!scale) throw new Error(`Bad mode: ${mode}`);
  const d = degree - 1, oct = Math.floor(d / 7), idx = ((d % 7) + 7) % 7;
  return 12 * (octave + 1 + oct) + keyToPc(key) + scale[idx];
}

const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7 };

// Accepts i, iv, VI, V7, Vsus4, i9, bVII, i/5. Quality comes from the mode, except for
// upper-case numerals, which force a major third, and lower-case, which force a minor third.
export function parseChord(symbol, key, mode) {
  const m = /^(b|#)?(i{1,3}|iv|v|vi{0,2}|I{1,3}|IV|V|VI{0,2})(sus2|sus4|maj7|add9|7|9|dim|\+)?(?:\/(\d))?$/.exec(symbol);
  if (!m) throw new Error(`Bad chord: ${symbol}`);
  const [, accidental, numeral, ext, bassDegree] = m;
  const deg = ROMAN[numeral.toLowerCase()];
  const shift = accidental === 'b' ? -1 : accidental === '#' ? 1 : 0;
  const root = degreeToMidi(key, MODES[mode] ? mode : 'aeolian', deg, 3) + shift;
  const upper = numeral === numeral.toUpperCase();
  const third = ext === 'sus2' ? 2 : ext === 'sus4' ? 5 : upper ? 4 : 3;
  const fifth = ext === 'dim' ? 6 : ext === '+' ? 8 : 7;
  const tones = [0, third, fifth];
  if (ext === '7') tones.push(upper ? 10 : 10);
  if (ext === 'maj7') tones.push(11);
  if (ext === '9' || ext === 'add9') tones.push(14);
  const bass = bassDegree ? root + tones[Math.min(Number(bassDegree) === 5 ? 2 : Number(bassDegree) === 3 ? 1 : 0, 2)] - 12 : root - 12;
  return { symbol, root, bass, tones: tones.map(t => root + t) };
}

// Keep upper voices close to the previous chord, the way a player's hand would move.
export function voiceLead(prev, tones, low = 55, high = 74) {
  const pool = [];
  for (const t of tones) for (let o = -24; o <= 24; o += 12) { const n = t + o; if (n >= low && n <= high) pool.push(n); }
  const pcs = [...new Set(tones.map(t => ((t % 12) + 12) % 12))];
  const target = prev?.length ? prev.reduce((a, b) => a + b) / prev.length : (low + high) / 2;
  return pcs.map(pc => pool.filter(n => ((n % 12) + 12) % 12 === pc).sort((a, b) => Math.abs(a - target) - Math.abs(b - target))[0]).filter(n => n != null).sort((a, b) => a - b);
}

export const midiToHz = m => 440 * 2 ** ((m - 69) / 12);

// Small seeded generator so a score renders identically on every machine.
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
