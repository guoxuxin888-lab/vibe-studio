# 给 AI 的安装说明

> 这份文件是写给 Agent（Claude Code、Codex、Kimi Code、WorkBuddy、TRAE 等能执行终端命令的 AI）读的。用户把这个链接发给你，就是要你**替他把 Vibe Studio 装好，并把它的两个 Skill 装进你自己**，装完马上能用。请按下面的顺序做，每做完一步用一两句话告诉用户结果。

仓库：https://github.com/guoxuxin888-lab/vibe-studio

## 规则

- 只做下面列的事，不要改工程里的源码。
- 需要管理员授权、sudo 密码、点“是”的时候，停下来让用户自己操作，不要替用户输入密码。
- 命令失败时，先读报错，按“常见问题”处理；同一个错误连续两次没解决，就把报错原文告诉用户，问他怎么办。
- 用户在中国大陆（或者你访问 `https://registry.npmjs.org` 很慢、超时），下面所有带“国内”的选项都打开。

## 第 1 步：确定装在哪

问用户一句“装在哪个文件夹？”，没意见就用默认：Windows 是 `%USERPROFILE%\vibe-studio`，macOS / Linux 是 `~/vibe-studio`。路径里不要有空格。

如果这个文件夹里已经有 `package.json` 和 `setup/`，说明装过了，跳到第 3 步。

## 第 2 步：拿到工程

有 git 就：

```bash
git clone --depth 1 https://github.com/guoxuxin888-lab/vibe-studio.git <目标文件夹>
```

没有 git，或 clone 失败，就下载压缩包解压：`https://codeload.github.com/guoxuxin888-lab/vibe-studio/zip/refs/heads/main`，解压出来的 `vibe-studio-main` 文件夹就是工程，改名成目标文件夹。

## 第 3 步：运行一键安装脚本

在工程根目录运行。`--agent` / `-Agent` 填**你自己**：

| 你是 | 填 |
|---|---|
| Claude Code | `claude` |
| Codex | `codex` |
| Kimi Code | `kimi` |
| TRAE | `trae` |
| WorkBuddy | `workbuddy` |
| 不确定 | `auto`（本机有哪个装哪个） |

Windows（PowerShell）：

```bash
powershell -NoProfile -ExecutionPolicy Bypass -File setup\install.ps1 -Agent claude
```

国内加 `-China`。

macOS / Linux：

```bash
bash setup/install.sh --agent=claude
```

国内加 `--china`。

脚本会依次做 7 步，已经装好的跳过：

1. 检查 Node 20+，缺了就自动装：Windows 用 winget，macOS 用 brew，Linux 用 nvm。
2. 检查 ffmpeg，缺了就自动装。
3. `npm ci` 装依赖。
4. 准备渲染用的无头浏览器，下载失败就用本机的 Edge 或 Chrome。
5. 跑 `npm run doctor`。
6. 合成示例片音乐，渲染一帧到 `out/setup-check.png`。
7. 把 `skills/vibe-content-planner` 和 `skills/vibe-video-producer` 装进你的技能目录，并在装进去的 `SKILL.md` 里写上工程的绝对路径。

脚本运行时间可能超过你的单条命令超时（第一次装 Node 或下载浏览器要几分钟）。能后台运行就后台运行，或者把超时设到 10 分钟。

**看到“全部完成”就成功了。** 把 `out/setup-check.png` 给用户看。

脚本中途失败、又看不懂报错，就按下面“手动分步”从失败的那一步接着做。

## 第 4 步：确认你能用上 Skill

- 装完的 Skill 在这些位置：

  | Agent | 位置 |
  |---|---|
  | Claude Code | `~/.claude/skills/` |
  | Codex | `~/.codex/skills/` |
  | Kimi Code | `~/.kimi-code/skills/` |
  | TRAE | 工程里的 `.trae/skills/` |

  WorkBuddy 会得到 `out/skills-zip/` 里的两个 ZIP，请用户在 WorkBuddy 的技能面板里导入。
- 你的技能目录不在上面的表里，就把工程里 `skills/` 下的两个**文件夹**整个复制到你的技能目录。`SKILL.md` 要和 `references/`、`scripts/` 在一起。
- 大多数 Agent 要新开一个对话或重启，才会读到新 Skill。告诉用户这一点。

## 第 5 步：告诉用户怎么用

装好后，原样告诉用户可以这样开始（在新对话里，最好打开工程文件夹）：

> 用 vibe-video-producer，把 examples/peak-end-package.md 做成一条约 20 秒的样片。原创音乐，画风用 geo-flat。先跑 npm run doctor。做完告诉我成片路径，并说清哪些没看过、没听过。

想先策划选题：

> 用 vibe-content-planner，给“拖延”这个方向出 3 个 Vibe 知识选题。

再提一句：账号自己的规则（账号名、品牌色、敏感词替换）可以写进工程根目录的 `profile.local.md`，两个 Skill 开工前会先读它。

## 手动分步（脚本失败时用）

在工程根目录依次执行：

1. `node -v` 要 ≥ 20。不够就装 Node LTS：
   - Windows：`winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements`
   - macOS：`brew install node`
   - Linux：nvm，`nvm install 22`

   装完要**新开终端**，PATH 才会生效。
2. `ffmpeg -version`。没有就装：
   - Windows：`winget install -e --id Gyan.FFmpeg`
   - macOS：`brew install ffmpeg`
   - Linux：`sudo apt install ffmpeg`
3. 国内：`npm config set registry https://registry.npmmirror.com --location=project`。
4. `npm ci`。
5. `node tools/remotion.cjs browser ensure`。失败就在工程根目录写 `studio.local.json`，路径用正斜杠：`{ "browserExecutable": "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" }`。Mac 上的 Chrome 是 `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`。
6. `npm run doctor`，要看到 `doctor: all good`。
7. `npm run music -- sunk-cost`，然后 `node tools/remotion.cjs still sunk-cost out/setup-check.png --frame=150`。
8. `node setup/install-skills.mjs --agent <你>`。

## 常见问题

- **winget 找不到**：Windows 10 老版本没有，请用户从 Microsoft Store 装“应用安装程序”（App Installer）。或者去官网下载：Node 从 https://nodejs.org ，ffmpeg 从 https://www.gyan.dev/ffmpeg/builds/ 下 `ffmpeg-release-essentials.zip`，解压后把 `bin` 目录加进 PATH。
- **装完 node / ffmpeg 还是找不到**：PATH 没刷新。新开一个终端；或者 Windows 上先执行 `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`。
- **npm ci 网络错**：打开国内镜像（上面第 3 条）再试。
- **Linux 渲染报缺 libnss3、libgbm 等**：`sudo apt install libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 fonts-noto-cjk`。
- **中文字显示成方块**：装中文字体。Windows / macOS 装思源宋体 Noto Serif SC，Linux 装 `fonts-noto-cjk`。
- **GitHub 打不开或很慢**：请用户手动下载 ZIP，或者换一个网络后再试。
