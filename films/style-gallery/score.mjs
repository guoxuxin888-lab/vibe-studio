// 画风图鉴的配乐：23 段（22 种画风，第 15 类分 15 和 15b 两支），每种 3 小节（90 BPM，一拍 0.667 秒，一段正好 8 秒），每段自己的调式和音色。
// 段的第 0 拍就是段落起点；音效挂在各段的拍上。全部由引擎合成，没有外部音乐。
const BPM = 90, B = 60 / BPM, SEG = 12 * B;

// [编号, 调, 调式, 音色, 前两小节张力, 第三小节张力, 前两小节和声, 第三小节和声]
const STYLES = [
  ['01', 'D', 'aeolian', 'felt-night', 0.4, 0.7, ['i', 'VI'], ['iv', 'V']],
  ['02', 'A', 'dorian', 'felt-night', 0.25, 0.55, ['i', 'IV'], ['VII', 'i']],
  ['03', 'C', 'phrygian', 'stone-choir', 0.5, 0.85, ['i', 'bII'], ['iv', 'V']],
  ['04', 'F', 'dorian', 'felt-night', 0.25, 0.6, ['i', 'IV'], ['VII', 'i']],
  ['05', 'E', 'aeolian', 'stone-choir', 0.45, 0.7, ['i', 'i'], ['VI', 'V']],
  ['06', 'G', 'ionian', 'ink-string', 0.5, 0.75, ['I', 'V'], ['IV', 'I']],
  ['07', 'D', 'phrygian', 'stone-choir', 0.7, 0.95, ['i', 'bII'], ['VI', 'V']],
  ['08', 'E', 'lydian', 'glass-pulse', 0.55, 0.9, ['I', 'II'], ['IV', 'I']],
  ['09', 'A', 'aeolian', 'glass-pulse', 0.35, 0.75, ['i', 'VI'], ['iv', 'V']],
  ['10', 'F', 'dorian', 'glass-pulse', 0.5, 0.7, ['i', 'IV'], ['i', 'VII']],
  ['11', 'C', 'phrygian', 'stone-choir', 0.5, 0.9, ['i', 'bII'], ['i', 'V']],
  ['12', 'D', 'phrygian', 'ink-string', 0.4, 0.7, ['i', 'bII'], ['VII', 'i']],
  ['13', 'A', 'aeolian', 'ink-string', 0.4, 0.7, ['i', 'VII'], ['VI', 'i']],
  ['14', 'E', 'dorian', 'felt-night', 0.35, 0.75, ['i', 'VII'], ['VI', 'i']],
  ['15', 'G', 'ionian', 'ink-string', 0.45, 0.7, ['I', 'vi'], ['IV', 'V']],
  ['15b', 'D', 'mixolydian', 'ink-string', 0.5, 0.8, ['I', 'IV'], ['vi', 'V']],
  ['16', 'Bb', 'ionian', 'felt-night', 0.35, 0.6, ['I', 'IV'], ['ii', 'V']],
  ['17', 'F', 'lydian', 'ink-string', 0.3, 0.7, ['I', 'II'], ['IV', 'I']],
  ['18', 'C', 'ionian', 'felt-night', 0.35, 0.7, ['I', 'vi'], ['IV', 'I']],
  ['19', 'D', 'aeolian', 'glass-pulse', 0.4, 0.85, ['i', 'VI'], ['iv', 'V']],
  ['20', 'G', 'ionian', 'glass-pulse', 0.3, 0.65, ['I', 'vi'], ['IV', 'I']],
  ['21', 'E', 'lydian', 'glass-pulse', 0.45, 0.8, ['I', 'II'], ['vi', 'I']],
  ['22', 'A', 'mixolydian', 'glass-pulse', 0.5, 0.85, ['I', 'IV'], ['V', 'I']],
];
const IDX = Object.fromEntries(STYLES.map((s, i) => [s[0], i]));
const at = (no, beat) => +(IDX[no] * SEG + beat * B).toFixed(4);

// 每段的音效：[编号, 拍, 音效, 参数, 增益]。动作在哪一拍完成，声音就挂在哪一拍。
const FX = [
  ['01', 2, 'thud', { midi: 40 }, 0.35], ['01', 3, 'whoosh', { seconds: 0.6, direction: 1 }, 0.15], ['01', 4, 'tick', { midi: 76 }, 0.25], ['01', 6, 'tick', { midi: 81 }, 0.2], ['01', 8, 'stamp', { midi: 43 }, 0.6],
  ['02', 1, 'tick', { midi: 93 }, 0.25], ['02', 2, 'shimmer', { midi: 76 }, 0.2], ['02', 5, 'tick', { midi: 79 }, 0.15], ['02', 6, 'tick', { midi: 83 }, 0.15], ['02', 8, 'shimmer', { midi: 81 }, 0.35],
  ['03', 0, 'impact', { midi: 36 }, 0.3], ['03', 4, 'thud', { midi: 40 }, 0.25], ['03', 6, 'thud', { midi: 38 }, 0.25], ['03', 8, 'impact', { midi: 33 }, 0.6],
  ['04', 0, 'thud', { midi: 36 }, 0.3], ['04', 3, 'tick', { midi: 72 }, 0.18], ['04', 5, 'whoosh', { seconds: 0.8, direction: -1 }, 0.15], ['04', 8, 'whoosh', { seconds: 1.0, direction: 1 }, 0.2], ['04', 9, 'shimmer', { midi: 77 }, 0.25],
  ['05', 2, 'thud', { midi: 38 }, 0.2], ['05', 3, 'thud', { midi: 38 }, 0.2], ['05', 4, 'thud', { midi: 38 }, 0.2], ['05', 5, 'thud', { midi: 38 }, 0.2], ['05', 8, 'stamp', { midi: 40 }, 0.45],
  ['06', 1, 'tick', { midi: 84 }, 0.2], ['06', 4, 'tick', { midi: 79 }, 0.18], ['06', 8, 'thud', { midi: 45 }, 0.4], ['06', 10, 'tick', { midi: 88 }, 0.2],
  ['07', 0, 'riser', { seconds: 1.3 }, 0.3], ['07', 2, 'impact', { midi: 38 }, 0.35], ['07', 5, 'tick', { midi: 86 }, 0.2], ['07', 8, 'impact', { midi: 33 }, 0.6], ['07', 8, 'shimmer', { midi: 88 }, 0.3],
  ['08', 1, 'tick', { midi: 76 }, 0.2], ['08', 2, 'tick', { midi: 79 }, 0.2], ['08', 3, 'tick', { midi: 83 }, 0.2], ['08', 4, 'tick', { midi: 86 }, 0.2], ['08', 8, 'riser', { seconds: 1.3 }, 0.35], ['08', 8, 'shimmer', { midi: 88 }, 0.3], ['08', 9, 'impact', { midi: 40 }, 0.45],
  ['09', 1, 'tick', { midi: 88 }, 0.2], ['09', 2, 'tick', { midi: 86 }, 0.2], ['09', 3, 'tick', { midi: 84 }, 0.2], ['09', 4, 'stamp', { midi: 45 }, 0.4], ['09', 6, 'tick', { midi: 93 }, 0.2], ['09', 8, 'impact', { midi: 36 }, 0.5],
  ['10', 0, 'whoosh', { seconds: 1.2, direction: 1 }, 0.15], ['10', 4, 'tick', { midi: 76 }, 0.2], ['10', 8, 'shimmer', { midi: 81 }, 0.3], ['10', 9, 'tick', { midi: 88 }, 0.2],
  ['11', 1, 'inkDrop', { midi: 64 }, 0.25], ['11', 4, 'tick', { midi: 76 }, 0.2], ['11', 8, 'impact', { midi: 36 }, 0.55],
  ['12', 1, 'tick', { midi: 72 }, 0.18], ['12', 3, 'thud', { midi: 40 }, 0.25], ['12', 8, 'shimmer', { midi: 76 }, 0.35],
  ['13', 2, 'thud', { midi: 43 }, 0.25], ['13', 4, 'thud', { midi: 40 }, 0.25], ['13', 8, 'thud', { midi: 36 }, 0.45], ['13', 8, 'whoosh', { seconds: 0.5, direction: 1 }, 0.2],
  ['14', 0, 'whoosh', { seconds: 1.5, direction: 1 }, 0.15], ['14', 4, 'tick', { midi: 79 }, 0.18], ['14', 8, 'shimmer', { midi: 76 }, 0.35],
  ['15', 1, 'tick', { midi: 79 }, 0.2], ['15', 4, 'stamp', { midi: 48 }, 0.3], ['15', 6, 'tick', { midi: 83 }, 0.2], ['15', 8, 'stamp', { midi: 45 }, 0.45],
  ['15b', 1, 'thud', { midi: 40 }, 0.16], ['15b', 2, 'thud', { midi: 38 }, 0.16], ['15b', 3, 'stamp', { midi: 48 }, 0.3], ['15b', 4, 'thud', { midi: 40 }, 0.16], ['15b', 6, 'shimmer', { midi: 81 }, 0.25], ['15b', 8, 'stamp', { midi: 45 }, 0.4], ['15b', 9, 'tick', { midi: 83 }, 0.2], ['15b', 10, 'tick', { midi: 86 }, 0.2],
  ['16', 1, 'tick', { midi: 79 }, 0.18], ['16', 2, 'tick', { midi: 83 }, 0.18], ['16', 3, 'tick', { midi: 86 }, 0.18], ['16', 8, 'tick', { midi: 96 }, 0.35], ['16', 10, 'whoosh', { seconds: 0.8, direction: -1 }, 0.15],
  ['17', 1, 'tick', { midi: 76 }, 0.15], ['17', 2, 'tick', { midi: 79 }, 0.15], ['17', 3, 'tick', { midi: 83 }, 0.15], ['17', 5, 'inkDrop', { midi: 64 }, 0.25], ['17', 8, 'shimmer', { midi: 84 }, 0.4],
  ['18', 0, 'whoosh', { seconds: 1.5, direction: 1 }, 0.12], ['18', 4, 'shimmer', { midi: 76 }, 0.2], ['18', 8, 'shimmer', { midi: 84 }, 0.35],
  ['19', 1, 'tick', { midi: 79 }, 0.15], ['19', 2, 'tick', { midi: 83 }, 0.15], ['19', 3, 'tick', { midi: 86 }, 0.15], ['19', 4, 'riser', { seconds: 2.5 }, 0.3], ['19', 8, 'impact', { midi: 38 }, 0.5],
  ['20', 1, 'tick', { midi: 88 }, 0.2], ['20', 2, 'tick', { midi: 84 }, 0.2], ['20', 3, 'tick', { midi: 88 }, 0.2], ['20', 5, 'inkDrop', { midi: 60 }, 0.3], ['20', 8, 'impact', { midi: 40 }, 0.45], ['20', 10, 'shimmer', { midi: 81 }, 0.3],
  ['21', 0, 'shimmer', { midi: 76 }, 0.2], ['21', 4, 'tick', { midi: 84 }, 0.2], ['21', 8, 'riser', { seconds: 1.3 }, 0.3], ['21', 8, 'shimmer', { midi: 88 }, 0.3],
  ['22', 1, 'tick', { midi: 72 }, 0.2], ['22', 4, 'tick', { midi: 79 }, 0.18], ['22', 6, 'tick', { midi: 83 }, 0.18], ['22', 8, 'impact', { midi: 40 }, 0.45], ['22', 9, 'tick', { midi: 88 }, 0.2], ['22', 10, 'tick', { midi: 91 }, 0.2],
];

const cues = {};
for (const [no, beat] of FX) cues[`s${no}b${beat}`] = at(no, beat);
// 试点三段用名字读的 cue，保留
Object.assign(cues, {
  dgCard: at('01', 2), dgLine: at('01', 3), dgPawn: at('01', 4), dgTag: at('01', 6), dgCount: at('01', 7), dgStamp: at('01', 8),
  nb1: at('08', 1), nb2: at('08', 2), nb3: at('08', 3), nb4: at('08', 4), nAxis: at('08', 5), nJump: at('08', 8), nNum: at('08', 9),
  sOn: at('04', 0), sStep: at('04', 3), sNarrow: at('04', 5), sBack: at('04', 8), sOthers: at('04', 9),
});

export default {
  title: 'style-gallery',
  bpm: BPM,
  meter: 4,
  key: 'D',
  mode: 'aeolian',
  palette: 'felt-night',
  seed: 21,
  motif: { name: 'object', notes: [[0, 1, 0.5, 0.7], [0.5, 3, 0.5, 0.72], [1, 5, 1, 0.78]] },
  sections: STYLES.flatMap(([no, key, mode, palette, ta, tb, ha, hb]) => [
    { id: `s${no}`, role: `画风 ${no}`, bars: 2, tension: ta, key, mode, palette, harmony: ha, motif: true },
    { id: `s${no}x`, role: `画风 ${no} 落点`, bars: 1, tension: tb, key, mode, palette, harmony: hb, motif: tb > 0.7, motifOctave: tb > 0.8 ? 5 : undefined },
  ]),
  cues,
  sfx: FX.map(([no, beat, name, options, gain]) => ({ at: `s${no}b${beat}`, name, options, gain })),
};
