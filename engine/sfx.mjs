// Sound effects, synthesised and pitched. A hit tuned to the key of the music sits inside the score
// instead of on top of it, which is the difference between an effect and an accent.
import { midiToHz, rng } from './theory.mjs';

const TAU = Math.PI * 2;
const stereo = (sec, sr) => { const n = Math.floor(sec * sr); return [new Float32Array(n), new Float32Array(n)]; };

function noiseBand(L, R, sr, rand, { from, to, peak = 0.5, q = 0.8, gain = 0.5, pan = [0, 0] }) {
  // State-variable band-pass with a swept centre frequency.
  let lo = 0, bd = 0;
  const n = L.length;
  for (let i = 0; i < n; i++) {
    const p = i / n, c = from * (to / from) ** p;
    const f = Math.min(0.9, 2 * Math.sin(Math.PI * c / sr));
    const hi = (rand() * 2 - 1) - lo - q * bd;
    bd += f * hi; lo += f * bd;
    const env = p < peak ? p / peak : ((1 - p) / (1 - peak)) ** 1.6;
    const v = bd * env * gain, ang = (pan[0] + (pan[1] - pan[0]) * p + 1) * Math.PI / 4;
    L[i] += v * Math.cos(ang); R[i] += v * Math.sin(ang);
  }
}

export const SFX = {
  // Downbeat hit: a pitched low body, a fast click, then air. pitch = tonic of the current key.
  impact(sr, rand, { midi = 38, gain = 1 } = {}) {
    const [L, R] = stereo(2.4, sr), base = midiToHz(midi); let ph = 0;
    for (let i = 0; i < L.length; i++) {
      const t = i / sr, f = base * (1 + 2.2 * Math.exp(-t / 0.028));
      ph += TAU * f / sr;
      const v = (Math.sin(ph) + 0.22 * Math.sin(ph * 2)) * Math.exp(-t / 0.62) * 0.75 * gain * Math.min(1, i / 16);
      L[i] += v; R[i] += v;
    }
    noiseBand(L.subarray(0, Math.floor(sr * 0.9)), R.subarray(0, Math.floor(sr * 0.9)), sr, rand, { from: 3800, to: 500, peak: 0.02, gain: 0.32 * gain });
    return [L, R];
  },
  // Pre-hit swell. Length is set by the caller so its peak lands exactly on the beat.
  riser(sr, rand, { seconds = 2, gain = 1 } = {}) {
    const [L, R] = stereo(seconds, sr);
    noiseBand(L, R, sr, rand, { from: 240, to: 5200, peak: 0.985, q: 0.5, gain: 0.34 * gain, pan: [-0.45, 0.45] });
    return [L, R];
  },
  whoosh(sr, rand, { seconds = 0.55, gain = 1, direction = 1 } = {}) {
    const [L, R] = stereo(seconds, sr);
    noiseBand(L, R, sr, rand, { from: 500, to: 3400, peak: 0.45, q: 0.65, gain: 0.5 * gain, pan: [-0.8 * direction, 0.8 * direction] });
    return [L, R];
  },
  tick(sr, rand, { midi = 86, gain = 1 } = {}) {
    const [L, R] = stereo(0.09, sr), w = TAU * midiToHz(midi) / sr;
    for (let i = 0; i < L.length; i++) { const t = i / sr, v = Math.sin(w * i) * Math.exp(-t / 0.011) * 0.45 * gain; L[i] += v; R[i] += v; }
    return [L, R];
  },
  // Soft felt tap for things landing, seats folding, a figure standing up.
  thud(sr, rand, { midi = 45, gain = 1 } = {}) {
    const [L, R] = stereo(0.45, sr), w = midiToHz(midi); let ph = 0;
    for (let i = 0; i < L.length; i++) { const t = i / sr; ph += TAU * w * (1 + 0.6 * Math.exp(-t / 0.02)) / sr; const v = Math.sin(ph) * Math.exp(-t / 0.09) * 0.6 * gain * Math.min(1, i / 24); L[i] += v; R[i] += v; }
    return [L, R];
  },
  stamp(sr, rand, { midi = 41, gain = 1 } = {}) {
    const [L, R] = SFX.thud(sr, rand, { midi, gain: gain * 1.1 });
    noiseBand(L.subarray(0, Math.floor(sr * 0.12)), R.subarray(0, Math.floor(sr * 0.12)), sr, rand, { from: 1800, to: 700, peak: 0.03, q: 0.9, gain: 0.55 * gain });
    return [L, R];
  },
  // Paper tearing: short noisy grains speeding up and rising.
  tear(sr, rand, { seconds = 0.7, gain = 1 } = {}) {
    const [L, R] = stereo(seconds, sr), n = L.length; let lp = 0, grain = 0, env = 0;
    for (let i = 0; i < n; i++) {
      const p = i / n;
      if (--grain <= 0) { grain = Math.floor(sr * (0.018 - 0.012 * p) * (0.5 + rand())); env = 0.4 + rand() * 0.6; }
      env *= 0.9992; const x = rand() * 2 - 1; lp += 0.5 * (x - lp);
      const v = (x - lp) * env * (1 - p) ** 0.4 * Math.min(1, p * 25) * 0.42 * gain;
      L[i] += v; R[i] += v * 0.9;
    }
    return [L, R];
  },
  pageTurn(sr, rand, { seconds = 0.62, gain = 1 } = {}) {
    const [L, R] = stereo(seconds, sr);
    noiseBand(L, R, sr, rand, { from: 1400, to: 5200, peak: 0.55, q: 1.1, gain: 0.36 * gain, pan: [0.4, -0.4] });
    return [L, R];
  },
  heartbeat(sr, rand, { gain = 1 } = {}) {
    const [L, R] = stereo(0.75, sr);
    for (const [at, g] of [[0, 1], [0.22, 0.7]]) { const [a, b] = SFX.thud(sr, rand, { midi: 34, gain: gain * g }); const o = Math.floor(at * sr); for (let i = 0; i < a.length && i + o < L.length; i++) { L[i + o] += a[i]; R[i + o] += b[i]; } }
    return [L, R];
  },
  inkDrop(sr, rand, { midi = 76, gain = 1 } = {}) {
    const [L, R] = stereo(0.5, sr), base = midiToHz(midi); let ph = 0;
    for (let i = 0; i < L.length; i++) { const t = i / sr; ph += TAU * base * (1 + 1.4 * t * 6) / sr; const v = Math.sin(ph) * Math.exp(-t / 0.05) * 0.3 * gain * Math.min(1, i / 20); L[i] += v; R[i] += v; }
    return [L, R];
  },
  shimmer(sr, rand, { midi = 81, gain = 1 } = {}) {
    const [L, R] = stereo(2.6, sr);
    for (const m of [0, 7, 12, 19]) { const w = TAU * midiToHz(midi + m) / sr, p = rand() * TAU, pan = rand() * 1.4 - 0.7, d = 0.5 + rand() * 0.5; for (let i = 0; i < L.length; i++) { const t = i / sr, v = Math.sin(w * i + p) * Math.exp(-t / d) * Math.min(1, t / 0.05) * 0.055 * gain; L[i] += v * (1 - pan); R[i] += v * (1 + pan); } }
    return [L, R];
  },
};

export function renderSfx(name, sr, opts = {}, seed = 7) {
  const fn = SFX[name];
  if (!fn) throw new Error(`Unknown effect: ${name}. Available: ${Object.keys(SFX).join(', ')}`);
  return fn(sr, rng(seed), opts);
}
