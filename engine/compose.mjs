// compose(score) turns a score into notes, then audio, then a timeline the picture reads from.
// The score is the master clock of a film. Picture, motion and effects all hang from it.
import { degreeToMidi, parseChord, voiceLead, rng } from './theory.mjs';
import { VOICES } from './voices.mjs';
import { renderSfx } from './sfx.mjs';

export const SR = 44100;

export const PALETTES = {
  'felt-night': { chord: 'softPiano', melody: 'feltPiano', bed: 'warmPad', low: 'sub', pulse: 'softKick', hat: 'shaker', sparkle: 'bell' },
  'ink-string': { chord: 'mutedPluck', melody: 'pluck', bed: 'airPad', low: 'sub', pulse: 'lowDrum', hat: null, sparkle: 'bell' },
  'stone-choir': { chord: 'darkPad', melody: 'feltPiano', bed: 'darkPad', low: 'sub', pulse: 'lowDrum', hat: null, sparkle: 'bell' },
  'glass-pulse': { chord: 'mutedPluck', melody: 'bell', bed: 'airPad', low: 'sub', pulse: 'softKick', hat: 'shaker', sparkle: 'bell' },
};

const MIX = { chord: 0.8, melody: 1, bed: 0.85, low: 0.85, pulse: 0.8, hat: 0.7, sparkle: 0.55, counter: 0.6 };
const SEND = { chord: 0.3, melody: 0.38, bed: 0.45, low: 0, pulse: 0.06, hat: 0.1, sparkle: 0.7, counter: 0.5 };

// Tension decides who plays. Sparse music leaves room for reading, density arrives when the idea lands.
const layersFor = t => ({ chord: t >= 0.05, bed: t >= 0.28, low: t >= 0.42, pulse: t >= 0.62, hat: t >= 0.78, sparkle: t >= 0.85 });

export function compose(score) {
  const { bpm, meter = 4, key, mode, sections, motif = null, palette = 'felt-night', seed = 11 } = score;
  const pal = PALETTES[palette];
  if (!pal) throw new Error(`Unknown palette: ${palette}`);
  const beatSec = 60 / bpm, barSec = beatSec * meter;
  const notes = [], rand = rng(seed), chords = [], outSections = [];
  let bar = 0, prevVoicing = null;
  const at = (b, beat = 0) => (b + beat / meter) * barSec;

  for (const sec of sections) {
    // A section may change mode, key or instruments: the court, a joke and a battle should not share one sound.
    const sKey = sec.key ?? key, sMode = sec.mode ?? mode, sPal = sec.palette ? PALETTES[sec.palette] : pal;
    if (!sPal) throw new Error(`Unknown palette: ${sec.palette}`);
    const startBar = bar, tension = sec.tension ?? 0.3, layers = sec.rest ? {} : layersFor(tension);
    const harmony = sec.harmony || ['i'];
    for (let b = 0; b < sec.bars; b++, bar++) {
      if (sec.rest) continue;
      const symbol = harmony[b % harmony.length];
      const chord = parseChord(symbol, sKey, sMode), start = at(bar);
      const voicing = voiceLead(prevVoicing, chord.tones); prevVoicing = voicing;
      chords.push({ t: start, symbol, bar: bar + 1 });
      const vel = 0.42 + 0.42 * tension;
      if (layers.bed) for (const n of voicing) notes.push({ part: 'bed', voice: sPal.bed, t: start, midi: n, vel: 0.5 + 0.4 * tension, dur: barSec });
      if (layers.low) notes.push({ part: 'low', voice: sPal.low, t: start, midi: chord.bass, vel: 0.5 + 0.45 * tension, dur: barSec * 0.96 });
      if (layers.chord) {
        // Low tension: one soft spread chord. Higher: a figure that moves on the beat.
        const pattern = tension < 0.35 ? [0] : tension < 0.62 ? [0, 2] : [0, 1, 2, 3];
        pattern.forEach((p, i) => {
          const tone = tension < 0.35 ? voicing : [voicing[i % voicing.length]];
          tone.forEach((n, j) => notes.push({ part: 'chord', voice: sPal.chord, t: at(bar, p) + j * 0.022, midi: n, vel: vel * (p === 0 ? 1 : 0.76), dur: beatSec * (tension < 0.35 ? meter : 1.8) }));
        });
      }
      if (layers.pulse) for (const p of meter === 4 ? [0, 2] : [0]) notes.push({ part: 'pulse', voice: sPal.pulse, t: at(bar, p), midi: chord.root - 24, vel: (p === 0 ? 0.95 : 0.68) * (0.55 + 0.45 * tension), dur: 0.4 });
      if (layers.hat && sPal.hat) for (let s = 1; s < meter * 2; s += 2) notes.push({ part: 'hat', voice: sPal.hat, t: at(bar, s / 2), midi: 60, vel: 0.5 + 0.35 * tension, dur: 0.05 });
      if (layers.sparkle && sPal.sparkle) notes.push({ part: 'sparkle', voice: sPal.sparkle, t: at(bar, 0), midi: voicing[voicing.length - 1] + 12, vel: 0.5, dur: barSec });
    }
    // The motif is the sound of the film's central object. It is stated where the section asks for it.
    if (motif && sec.motif) {
      const octave = sec.motifOctave ?? 4, line = sec.motif === true ? motif.notes : motif.notes.slice(0, sec.motif);
      for (const [beat, degree, len = 1, accent = 0.75] of line) {
        notes.push({ part: 'melody', voice: sPal.melody, t: at(startBar, beat), midi: degreeToMidi(sKey, sMode, degree, octave), vel: Math.min(1, accent * (0.75 + 0.35 * tension)), dur: len * beatSec });
      }
    }
    for (const n of sec.notes || []) notes.push({ part: n.part || 'counter', voice: n.voice || sPal.melody, t: at(startBar, n.beat), midi: degreeToMidi(sKey, sMode, n.degree, n.octave ?? 5), vel: n.vel ?? 0.6, dur: (n.len ?? 1) * beatSec });
    outSections.push({ id: sec.id, role: sec.role || '', start: at(startBar), end: at(bar), tension, rest: !!sec.rest });
  }
  const duration = at(bar);

  const resolve = pos => {
    if (typeof pos === 'number') return pos;
    if (typeof pos === 'string') { if (!(pos in cues)) throw new Error(`Unknown cue: ${pos}`); return cues[pos]; }
    return at(pos.bar - 1, (pos.beat ?? 1) - 1);
  };
  const cues = {};
  for (const [name, pos] of Object.entries(score.cues || {})) cues[name] = resolve(pos);
  for (const s of outSections) if (!(s.id in cues)) cues[s.id] = s.start;

  const hits = (score.sfx || []).map(h => ({ ...h, t: resolve(h.at) + (h.nudge || 0) }));
  return { notes, chords, sections: outSections, cues, hits, duration, beatSec, barSec, bpm, meter, key, mode, rand };
}

// Algorithmic reverb. Parallel damped combs into allpasses.
function reverb(inL, inR, sr, { room = 0.84, damp = 0.28 } = {}) {
  const combsMs = [29.7, 37.1, 41.1, 43.7, 47.3, 53.1], apMs = [5.0, 1.7];
  const out = side => {
    const input = side ? inR : inL, n = input.length, res = new Float32Array(n);
    for (const ms of combsMs) {
      const len = Math.floor((ms + side * 0.53) * sr / 1000), buf = new Float32Array(len); let idx = 0, f = 0;
      for (let i = 0; i < n; i++) { const y = buf[idx]; f = y * (1 - damp) + f * damp; buf[idx] = input[i] + f * room; idx = (idx + 1) % len; res[i] += y * 0.17; }
    }
    for (const ms of apMs) {
      const len = Math.floor(ms * sr / 1000), buf = new Float32Array(len); let idx = 0;
      for (let i = 0; i < n; i++) { const b = buf[idx], x = res[i], y = -x + b; buf[idx] = x + b * 0.5; idx = (idx + 1) % len; res[i] = y; }
    }
    return res;
  };
  return [out(0), out(1)];
}

const softClip = x => Math.tanh(x * 1.05) / Math.tanh(1.05);

export function renderAudio(plan, { tail = 0.5 } = {}) {
  const total = Math.ceil((plan.duration + tail) * SR), rand = rng(77);
  const parts = {};
  for (const n of plan.notes) {
    if (!parts[n.part]) parts[n.part] = [new Float32Array(total), new Float32Array(total)];
    const fn = VOICES[n.voice];
    if (!fn) throw new Error(`Unknown voice: ${n.voice}`);
    fn(parts[n.part][0], parts[n.part][1], Math.floor(n.t * SR), n.midi, n.vel, n.dur, SR, rand);
  }
  const L = new Float32Array(total), R = new Float32Array(total), wetL = new Float32Array(total), wetR = new Float32Array(total);
  for (const [part, [a, b]] of Object.entries(parts)) {
    const g = MIX[part] ?? 0.6, s = SEND[part] ?? 0.2;
    for (let i = 0; i < total; i++) { L[i] += a[i] * g; R[i] += b[i] * g; wetL[i] += a[i] * s * g; wetR[i] += b[i] * s * g; }
  }
  const [rvL, rvR] = reverb(wetL, wetR, SR);
  for (let i = 0; i < total; i++) { L[i] += rvL[i]; R[i] += rvR[i]; }

  // Effects go in after the music so they keep their edge.
  const fxL = new Float32Array(total), fxR = new Float32Array(total), sfxWetL = new Float32Array(total), sfxWetR = new Float32Array(total);
  for (const h of plan.hits) {
    const [a, b] = renderSfx(h.name, SR, h.options || {}, 7 + Math.floor(h.t * 100));
    // Rising effects end on the beat, everything else starts on it.
    const s = Math.floor((h.name === 'riser' ? h.t - (h.options?.seconds ?? 2) : h.t) * SR), g = h.gain ?? 1;
    for (let i = 0; i < a.length; i++) { const j = s + i; if (j >= 0 && j < total) { fxL[j] += a[i] * g; fxR[j] += b[i] * g; sfxWetL[j] += a[i] * g * 0.25; sfxWetR[j] += b[i] * g * 0.25; } }
  }
  const [fxRvL, fxRvR] = reverb(sfxWetL, sfxWetR, SR, { room: 0.8 });
  for (let i = 0; i < total; i++) { L[i] += fxL[i] + fxRvL[i]; R[i] += fxR[i] + fxRvR[i]; }

  let peak = 0;
  for (let i = 0; i < total; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = peak > 0 ? 0.95 / peak : 1;
  for (let i = 0; i < total; i++) { L[i] = softClip(L[i] * g); R[i] = softClip(R[i] * g); }
  // Close on the last bar so a film can be cut exactly on the music's end.
  const end = Math.floor(plan.duration * SR), fade = Math.floor(0.45 * SR);
  const out = [L.subarray(0, end), R.subarray(0, end)];
  for (let i = 0; i < fade; i++) { const a = (1 - i / fade) ** 2; out[0][end - fade + i] *= a; out[1][end - fade + i] *= a; }
  return out;
}

// Everything the picture needs. Energy comes from the real mix, so a brightness pulse follows what you hear.
export function buildTimeline(plan, L, R, fps = 30) {
  const hop = Math.floor(SR / fps), frames = Math.ceil(plan.duration * fps), raw = [];
  for (let f = 0; f < frames; f++) { let s = 0; const a = f * hop; for (let i = a; i < a + hop && i < L.length; i += 4) s += L[i] * L[i] + R[i] * R[i]; raw.push(Math.sqrt(s / (hop / 2))); }
  const top = Math.max(...raw, 1e-6);
  let slow = 0;
  const energy = raw.map(v => { const n = v / top; slow = n > slow ? n : slow * 0.86 + n * 0.14; return +slow.toFixed(3); });
  return {
    fps, duration: +plan.duration.toFixed(4), frames, bpm: plan.bpm, meter: plan.meter, beatSec: +plan.beatSec.toFixed(5), barSec: +plan.barSec.toFixed(5), key: plan.key, mode: plan.mode,
    sections: plan.sections.map(s => ({ ...s, start: +s.start.toFixed(4), end: +s.end.toFixed(4) })),
    chords: plan.chords.map(c => ({ ...c, t: +c.t.toFixed(4) })),
    cues: Object.fromEntries(Object.entries(plan.cues).map(([k, v]) => [k, +v.toFixed(4)])),
    hits: plan.hits.map(h => ({ t: +h.t.toFixed(4), name: h.name, gain: h.gain ?? 1 })),
    motif: plan.notes.filter(n => n.part === 'melody').map(n => ({ t: +n.t.toFixed(4), midi: n.midi, vel: +n.vel.toFixed(2) })),
    energy,
  };
}

export function writeWav(path, L, R, fs) {
  const n = L.length, b = Buffer.alloc(44 + n * 4);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40);
  const clamp = v => Math.max(-32768, Math.min(32767, Math.round(v * 32767)));
  for (let i = 0; i < n; i++) { b.writeInt16LE(clamp(L[i]), 44 + i * 4); b.writeInt16LE(clamp(R[i]), 46 + i * 4); }
  fs.writeFileSync(path, b);
}

// Standard MIDI, so anyone can replace the synth with real players or their own instruments.
export function writeMidi(path, plan, fs) {
  const vlq = v => { const o = [v & 0x7f]; while ((v >>= 7)) o.unshift((v & 0x7f) | 0x80); return o; };
  const TPQ = 480, tick = s => Math.round(s / plan.beatSec * TPQ);
  const u32 = v => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255];
  const tempo = Math.round(plan.beatSec * 1e6);
  const tracks = [[0, 0xff, 0x51, 3, (tempo >> 16) & 255, (tempo >> 8) & 255, tempo & 255, 0, 0xff, 0x2f, 0]];
  const names = [...new Set(plan.notes.map(n => n.part))];
  names.forEach((part, ci) => {
    const ev = [];
    for (const n of plan.notes.filter(x => x.part === part)) { ev.push([tick(n.t), 0x90 | (ci % 16), n.midi, Math.max(1, Math.round(n.vel * 127))]); ev.push([tick(n.t + n.dur), 0x80 | (ci % 16), n.midi, 0]); }
    ev.sort((a, b) => a[0] - b[0] || (a[1] & 0xf0) - (b[1] & 0xf0));
    const nameBytes = [...Buffer.from(part)], data = [0, 0xff, 0x03, nameBytes.length, ...nameBytes]; let last = 0;
    for (const e of ev) { data.push(...vlq(e[0] - last), e[1], e[2], e[3]); last = e[0]; }
    data.push(0, 0xff, 0x2f, 0); tracks.push(data);
  });
  const chunks = [Buffer.from([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, (tracks.length >> 8) & 255, tracks.length & 255, (TPQ >> 8) & 255, TPQ & 255])];
  for (const t of tracks) chunks.push(Buffer.from([0x4d, 0x54, 0x72, 0x6b, ...u32(t.length)]), Buffer.from(t));
  fs.writeFileSync(path, Buffer.concat(chunks));
}
