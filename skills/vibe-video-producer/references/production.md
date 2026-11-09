# 生产

工程用 Remotion。方法看工程的 `docs/DESIGN.md`、`docs/MUSIC.md`、`libraries/motion/README.md`。最短范例：`films/sunk-cost/`。开工前现场核对这些路径。

公开仓库里不放个人路径、账号内容、品牌素材、配音和别人的作品。这些放在不进 git 的目录（`references/private/`、`public/films/`、`out/`），或者写进 `profile.local.md`。

样本 47/51 横屏，新片默认横屏；竖版只在用户要求时做。

## 项目文件

```bash
npm run new -- <slug> --package <内容包.md> --mode original --style <画风> --mood <音乐情绪>
npm run new -- <slug> --package <内容包.md> --mode reference --reference <案例id> --style <画风> --mood <音乐情绪>
```

它先校验内容包，通过才建目录。目录名用 ASCII。

```
films/<slug>/
  content-package.md   内容包副本，字幕和事实的唯一来源
  source.srt           配音片：字幕时间的唯一来源
  treatment.md         导演方案：世界观、音乐设计、节拍表、进度
  score.mjs            总谱：段落、cue、音效
  Film.tsx             画面
  timeline.json        由总谱生成，不要手改
public/films/<slug>/   配音、配乐、音效轨，不进 git
references/private/    参考片拆解，不进 git
out/                   样片、成片，不进 git
```

## 已有音轨建片（配音、现成曲）

`npm run new` 末尾会合成原创音乐，不适合已经有配音或现成曲的片子。两种做法：

**做法一：只合成音效轨（推荐，最省事）。**

1. `node tools/check-package.mjs <内容包.md> --json` 通过才建。手动建 `films/<slug>/` 和 `public/films/<slug>/`，复制内容包、SRT，配音放 `public/films/<slug>/voice.wav`。
2. 现成曲按 `references/sound.md` 测出 BPM 和进鼓点，决定把源曲哪个拍对到影片哪一秒，算出取曲偏移，用 ffmpeg 从偏移处截好放 `bgm.wav`。
3. 写 `score.mjs`：`sections` 每段都写 `rest: true`（不合成音乐），总小节数决定片长；`cues` 里放 SRT 每句起点和全部动作拍点；`sfx` 里把音效挂到动作 cue 上。拍点用 `T0 + k × 一拍` 算，`T0` 是影片里进鼓那一刻。
4. `npm run music -- <slug>` 生成 `timeline.json` 和只有音效的 `audio.wav`。
5. `Film.tsx` 里三条 `<Audio>`：bgm、音效、配音，音量函数里做人声让位。先读 `films/index.ts`，只新增本片，不改别的注册。

**做法二：单独写 build-timeline。** 不需要任何合成时，写本片的 `build-timeline.mjs` 只生成 timeline JSON：

~~~js
import fs from 'node:fs';
import score from './score.mjs';
const {fps,duration,bpm,meter,sections,cues}=score;
const frames=Math.round(duration*fps);
if(!Array.isArray(sections)||!sections.length) throw new Error('Timeline needs non-empty sections');
if(![fps,duration,bpm,meter].every(x=>Number.isFinite(x)&&x>0)||Math.abs(frames/fps-duration)>1/48000)
  throw new Error('Use a finite, frame-aligned timeline duration');
const timeline={fps,duration,frames,bpm,meter,beatSec:60/bpm,barSec:60/bpm*meter,
  key:'existing-track',mode:'existing-track',sections,cues,
  chords:[],hits:[],motif:[],energy:Array.from({length:frames},()=>0)};
fs.writeFileSync(new URL('./timeline.json',import.meta.url),JSON.stringify(timeline,null,2)+'\n');
~~~

两种做法都在工程根运行 `npx tsc --noEmit` 和 `npm run doctor`，确认 timeline 帧数、命名 cue、音频路径和字幕真源一致，再渲样片。

## 顺序

1. **导演方案**：写 `treatment.md`，接手前先读它的进度，改完更新。
2. **音乐与总谱**：原创写谱后合成；现成曲先比选、测拍和源偏移。语义、动作、音效 cue 共表，做法见 `references/beat-sync.md`。声音要实际听，只看响度不算过。
3. **样片**：覆盖完整开场语义、贯穿物和重点动作，不硬裁句尾；用户看过也听过才继续全片。先自查最容易失败的完整动作链，修到可审状态再交。
4. **全片分层**：背景（底色和光）→ 主体（贯穿物按叙事动作，阅读时可停住）→ 文字（字幕、大字、角标）→ 仪表（计数）。
5. **分章审看**：每章抽帧，看字有没有被挡、会不会读不完、物有没有穿帮。
6. **体检和渲染**：`npm run doctor` 通过后渲染。

## 写法

- 动作用 `useMusic()` 读取同一 cue/拍格。音乐动作按拍计，配音语义 cue 保留确认时码，改 BPM 不能拉伸配音和字幕；落点按实际 fps 量化。
- 字幕逐字对回内容包。写一个小脚本把字幕块拼起来和内容包正文逐字比对，不一致不交。想改字、删句或改事实，提回 `vibe-content-planner`。
- 动效先查 `libraries/motion/README.md`，缺的按拍写进 `src/motion/`，写明场合，颜色从画风取。参考片的颜色字体不要带进来。
- 新画风写进 `libraries/styles/`，新情绪写进 `libraries/music/moods.json`，新音效写进 `engine/sfx.mjs` 并登记目录。
- 不要让动效元素停在或划过字、人脸；手端、脚底、尾带都纳入动态轮廓。镜像人物只翻一层（身子），头和道具在局部坐标里画。
- 人物弯腰、鞠躬绕胯转，腿不动；坐着的人用桌子挡住下半身，袍子不能从桌边露出来。
- AI 图交付前逐张查常识。开源前确认这些素材能公开，否则放在不进 git 的目录。
- AI 视频：要动的东西必须在首帧里，镜头固定（运镜后期做），姿势写到角度和手指，花钱前放大查图，一条查过再跑下一条。

## 渲染与声音导出

Remotion 的临时文件很大。系统盘小时，在 `studio.local.json` 里写 `"tempDir": "E:/vibe-tmp"`（或设环境变量 `VIBE_TEMP_DIR`），`tools/remotion.cjs` 会把这次渲染的 TEMP 指过去。

导出流程（每条片都一样）：

```bash
node tools/remotion.cjs render <slug> out/<slug>/picture.mp4 --concurrency=6
node tools/remotion.cjs render <slug> out/<slug>/mix-raw.wav --codec=wav
# 两遍 loudnorm 到 -14 LUFS、真峰 -1.5 dB，输出 48kHz 16bit PCM
node tools/mux-pcm-audio.mjs out/<slug>/picture.mp4 out/<slug>/mix.wav out/<slug>/final.mp4 <秒数>
node tools/audit-audio-sync.mjs out/<slug>/mix.wav out/<slug>/final.mp4 --fps 30 --tolerance-ms 1 --report out/<slug>/qc.json
```

- 混音先看原始混音的峰值（ffmpeg astats）。配音本身峰值接近 0 dB 时，三条音轨在 Remotion 里统一乘 0.6 留余量，再做响度归一，否则会削波。
- 原尺寸关键帧要实际查看；落地、伸手、切点有疑点时补查相邻帧。修复后核文件版本，旧截图不能证明新修复。
- 需要重封装时用 `tools/mux-pcm-audio.mjs`，从原 mix WAV 取声音，不复用已偏移的旧编码音轨。

## 交片自检

- [ ] 第一句读得完，画面已在讲同一件事
- [ ] 贯穿物和内容包一致，结尾回到它
- [ ] 字幕和内容包逐字一致，每句最多一个词上色
- [ ] 深色场景里字幕的底色查过，看得清
- [ ] 手机上能读完（缩到 375 宽看）
- [ ] 最终 MP4 前中后三窗同步已核，强落点对实际接触帧
- [ ] 成片 I/TP/LRA 已核，原始混音没有削波
- [ ] 音乐和音效有人实际听过；没有则标待听审，不把机器通过当听感通过
- [ ] 跑过 `tools/measure.mjs`，偏离处有理由
- [ ] 亮度曲线有一次明显变化
- [ ] 内容包标“示意”的地方画面上写明
- [ ] AI 图和图中文字查过

## 交回

成片路径和最终时长写进内容包的“制作记录”，把状态改成 `待发布`。发布文案和复盘由 `vibe-content-planner` 负责。
