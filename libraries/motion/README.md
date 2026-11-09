# 动效库

组件在 `src/motion/index.tsx`。规则：按拍计时，颜色从画风来，一个组件只做一件事。

| 组件 | 用在什么时候 | 音乐上挂在哪 |
|---|---|---|
| `QuietCaption` | 所有字幕，字逐个聚焦，整块退场 | 起点放在拍上，长度按阅读 |
| `ImpactRing` | 落地、概念名。一条片 1–2 次 | 强拍 |
| `Counter` | 角落持续变化的数字 | 跳字放在拍上 |
| `Grain`、`Vignette` | 画面质感 | 暗角可以跟张力变化 |
| `StyleBackdrop` | 画风的底，新片的起点 | 亮度跟张力 |
| `BeatSteam`（`src/motion/BeatSteam.tsx`） | 煮食、热茶的纸本蒸汽；传入当前拍数 | 四拍漂移一轮 |

## 待补（按拍重写）

同物变形、推入物体内部、翻页、线条生长、粒子聚散、一变多矩阵、聚光灯、盖章、划掉改字、打字再删、分屏对比、天平。

## 加一个组件

1. 接收 `style` 取颜色，用 `useMusic()` 取时间。
2. 时长用拍数，不要写秒。
3. 在上面的表里写清场合。参考片的颜色和字体不要带进来。

## 有配音连续字幕与重音

- SrtLine（src/motion/BeatNarration.tsx）：修订SRT时轴，显隐在本句边界内；短句整行显影，相邻句不叠加，每句最多一词上色。
- CueAccent（同文件）：片名、名字、落门的轻环形重音，按cue和拍数计时，颜色由影片画风传入。

- ShadowPuppetChoreography（src/motion/ShadowPuppetChoreography.ts）：侧身皮影双脚世界锚点、摆腿和双骨IK；支撑脚固定，手部锁道具握点。
