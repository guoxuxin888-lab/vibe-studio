# Vibe Studio

把知识做成短片的开源工作室。音乐是全片的总谱，画面、动效和音效都从同一条时间线上长出来。

*A music-first studio for short knowledge films, built on [Remotion](https://www.remotion.dev). The score is the master clock: picture, motion and sound effects all read from it. Music and effects are synthesised from code, so renders carry no third-party rights.*

## 它做什么

- **两种创作方式**：照参考案例学手法，或者从一个世界观原创。两条路都收束成同一份导演方案。
- **音乐先行**：先写谱，再剪片。换和弦、落拍、休止都是画面可以读取的事件，改速度时全片一起移动。
- **原创音乐和音效**：代码写谱、本地合成，同时导出 MIDI，可以换成真人演奏或自己的音色。
- **画风库、音乐库、音效库、动效库**：都是可读可改的文件，加一种风格只需要加一个文件。

## 五分钟跑起来

需要 Node 20 以上和 ffmpeg。中文字体建议装 Noto Serif SC。

国内网络：npm 可以换成 `npm config set registry https://registry.npmmirror.com`。Remotion 渲染要用一个无头浏览器，默认会去下载，下载慢或下不动时，在工程根目录新建 `studio.local.json`，指向本机的 Chrome 或 Edge：

```json
{ "browserExecutable": "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "tempDir": "E:/vibe-tmp" }
```

`tempDir` 可选，系统盘小时把渲染临时文件放到大盘。

```bash
npm install
npm run music -- sunk-cost
npm run studio
```

示例片在 `films/sunk-cost`。先读它的 `treatment.md` 和 `score.mjs`，这是整套方法最短的样子。

## 做一部新片

```bash
# 原创
npm run new -- my-film --package 内容包.md --mode original --style ink-wash --mood ink-and-time

# 参考
npm run reference -- 案例.mp4 --id case-01
npm run new -- my-film --package 内容包.md --mode reference --reference case-01 --style blueprint --mood mechanism

npm run music -- my-film
npm run render -- my-film out/my-film.mp4
npm run doctor
```

## 用 Agent 来做

`skills/` 里有两个 Skill：`vibe-content-planner`（选题和写稿）和 `vibe-video-producer`（画面、音乐、成片）。装进 Claude Code、Codex、Kimi Code、WorkBuddy 或 TRAE 后，把内容包交给它就能开做，安装方法见 [skills/README.md](skills/README.md)。你自己的账号规则写进 `profile.local.md`（模板 [profile.example.md](profile.example.md)）。

## 目录

```
engine/      作曲和合成：乐理、音色、音效、时间线
src/         Remotion：音乐时钟、动效组件、画风
libraries/   画风库、音乐库、音效库、动效库
films/       每部片一个目录：内容包、导演方案、总谱、画面
tools/       建片、参考分析、体检、混音封装、音画同步检查
skills/      给 Agent 用的两个 Skill
references/  你的参考片拆解，只留在本地，不进仓库
docs/        设计和方法
```

- [项目设计](docs/DESIGN.md)
- [音乐怎么决定画面](docs/MUSIC.md)
- [动效库](libraries/motion/README.md)
- [画风图鉴](docs/STYLE-GALLERY.md)：常见画风各一段 8 秒原创示意片

## 许可

代码、画风、谱子和合成产物按 [MIT](LICENSE) 发布。依赖的 Remotion 有自己的许可，公司使用可能需要付费，详见 [NOTICE](NOTICE.md)。
