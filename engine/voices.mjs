// Instruments, all synthesised. There are no samples, so renders carry no third-party rights.
// Every voice writes into stereo Float32 buffers: fn(L, R, startSample, midi, velocity, seconds, sr, rand).
import { midiToHz } from './theory.mjs';

const TAU = Math.PI * 2;
const put = (L, R, i, v, pan) => { if (i >= 0 && i < L.length) { L[i] += v * Math.cos((pan + 1) * Math.PI / 4); R[i] += v * Math.sin((pan + 1) * Math.PI / 4); } };

function felted(L, R, start, midi, vel, dur, sr, rand, { partials = 9, bright = 1, pan = 0 } = {}) {
  const f0 = midiToHz(midi), release = 0.28, total = Math.min(dur + release, 7);
  const n = Math.floor(total * sr), B = 0.00035 * 2 ** ((midi - 60) / 24);
  const list = [];
  for (let k = 1; k <= partials; k++) {
    const f = f0 * k * Math.sqrt(1 + B * k * k);
    if (f > sr * 0.42) break;
    list.push({ w: TAU * f / sr, a: (1 / k ** 1.75) * (k === 1 ? 1 : (0.55 + 0.6 * vel) * bright), tau: (2.6 * 2 ** ((60 - midi) / 18)) / (1 + 0.42 * (k - 1)), p: rand() * TAU });
  }
  const atk = Math.floor(sr * (0.004 + 0.012 * (1 - vel)));
  for (let i = 0; i < n; i++) {
    const t = i / sr; let s = 0;
    for (const q of list) s += q.a * Math.exp(-t / q.tau) * Math.sin(q.w * i + q.p);
    const hammer = i < sr * 0.03 ? (rand() * 2 - 1) * 0.05 * vel * (1 - i / (sr * 0.03)) ** 2 : 0;
    const env = Math.min(1, i / atk) * (t > dur ? Math.max(0, 1 - (t - dur) / release) : 1);
    put(L, R, start + i, (s + hammer) * env * vel * 0.26, pan + (midi - 62) * 0.012);
  }
}

function pad(L, R, start, midi, vel, dur, sr, rand, { attack = 0.9, release = 1.3, cutoff = 900, detune = 0.09, voices = 4, pan = 0 } = {}) {
  const f0 = midiToHz(midi), total = dur + release, n = Math.floor(total * sr);
  const osc = [];
  for (let v = 0; v < voices; v++) {
    const f = f0 * 2 ** ((detune * (v - (voices - 1) / 2)) / 12), harm = [];
    for (let k = 1; k <= 12 && f * k < cutoff * 2.2; k++) harm.push({ w: TAU * f * k / sr, a: (1 / k) / (1 + (f * k / cutoff) ** 2), p: rand() * TAU });
    osc.push({ harm, pan: pan + (v / Math.max(1, voices - 1) - 0.5) * 0.9 });
  }
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.min(1, t / attack) * (t > dur ? Math.max(0, 1 - (t - dur) / release) : 1);
    const shaped = env * env * (3 - 2 * env);
    for (const o of osc) { let s = 0; for (const h of o.harm) s += h.a * Math.sin(h.w * i + h.p); put(L, R, start + i, s * shaped * vel * 0.052, o.pan); }
  }
}

function sub(L, R, start, midi, vel, dur, sr) {
  const w = TAU * midiToHz(midi) / sr, n = Math.floor((dur + 0.25) * sr);
  for (let i = 0; i < n; i++) {
    const t = i / sr, env = Math.min(1, t / 0.03) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.25) : 1);
    put(L, R, start + i, (Math.sin(w * i) + 0.16 * Math.sin(2 * w * i)) * env * vel * 0.3, 0);
  }
}

// Karplus-Strong plucked string. Reads close to a guqin or nylon string in the low-mid range.
function pluck(L, R, start, midi, vel, dur, sr, rand, { damp = 0.5, decay = 0.994, pan = 0 } = {}) {
  const period = Math.max(2, Math.round(sr / midiToHz(midi))), line = new Float32Array(period);
  for (let i = 0; i < period; i++) line[i] = (rand() * 2 - 1) * (0.55 + 0.45 * vel);
  let idx = 0, last = 0;
  const n = Math.floor(Math.min(dur + 1.6, 6) * sr);
  for (let i = 0; i < n; i++) {
    const cur = line[idx], next = (1 - damp) * cur + damp * last;
    last = cur; line[idx] = next * decay; idx = (idx + 1) % period;
    put(L, R, start + i, cur * vel * 0.3 * Math.min(1, i / 40), pan);
  }
}

function bell(L, R, start, midi, vel, dur, sr, rand, { pan = 0 } = {}) {
  const f = midiToHz(midi), n = Math.floor(Math.min(dur + 2.8, 6) * sr), wc = TAU * f / sr, wm = TAU * f * 3.51 / sr, p = rand() * TAU;
  for (let i = 0; i < n; i++) {
    const t = i / sr, env = Math.exp(-t / 1.05), idx = 1.3 * Math.exp(-t / 0.28);
    put(L, R, start + i, Math.sin(wc * i + p + idx * Math.sin(wm * i)) * env * vel * 0.13 * Math.min(1, i / 30), pan);
  }
}

function softKick(L, R, start, _m, vel, _d, sr) {
  const n = Math.floor(0.42 * sr); let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr, f = 44 + 72 * Math.exp(-t / 0.035);
    ph += TAU * f / sr;
    put(L, R, start + i, Math.sin(ph) * Math.exp(-t / 0.13) * vel * 0.55 * Math.min(1, i / 28), 0);
  }
}

function lowDrum(L, R, start, midi, vel, _d, sr, rand) {
  const n = Math.floor(1.3 * sr), base = midiToHz(midi); let ph = 0, lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr, f = base * (1 + 1.1 * Math.exp(-t / 0.05));
    ph += TAU * f / sr;
    lp += 0.18 * ((rand() * 2 - 1) - lp);
    put(L, R, start + i, (Math.sin(ph) * Math.exp(-t / 0.36) + lp * 0.6 * Math.exp(-t / 0.05)) * vel * 0.58, 0);
  }
}

function shaker(L, R, start, _m, vel, _d, sr, rand, { pan = 0.15 } = {}) {
  const n = Math.floor(0.07 * sr); let prev = 0;
  for (let i = 0; i < n; i++) {
    const x = rand() * 2 - 1, hp = x - prev; prev = x;
    put(L, R, start + i, hp * Math.exp(-(i / sr) / 0.016) * vel * 0.1, pan);
  }
}

export const VOICES = {
  feltPiano: felted,
  softPiano: (...a) => felted(...a, { partials: 6, bright: 0.65 }),
  warmPad: pad,
  darkPad: (...a) => pad(...a, { cutoff: 480, attack: 1.4, release: 1.8 }),
  airPad: (...a) => pad(...a, { cutoff: 2200, attack: 1.2, release: 1.8, voices: 3, detune: 0.14 }),
  sub,
  pluck,
  mutedPluck: (...a) => pluck(...a, { damp: 0.72, decay: 0.986 }),
  bell,
  softKick,
  lowDrum,
  shaker,
};
