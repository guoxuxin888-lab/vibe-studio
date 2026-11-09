#!/usr/bin/env bash
# Vibe Studio 一键安装（macOS / Linux）
# 用法：在工程根目录运行  bash setup/install.sh        国内网络：bash setup/install.sh --china
# 会做：检查/安装 Node 20+（macOS 用 Homebrew，Linux 用 nvm）和 ffmpeg（brew / apt / dnf / pacman）→ npm ci
#       → 准备渲染浏览器（下载失败就用本机的 Chrome/Chromium）→ npm run doctor → 合成示例片音乐并渲染一帧 → 把两个 Skill 装进 Agent。已经装好的会跳过。
# 指定 Agent：--agent=claude,codex,kimi,agents,trae,workbuddy（默认 auto：本机有哪个装哪个）
set -euo pipefail
cd "$(dirname "$0")/.."
CHINA=0; SKIP=0; AGENT=auto
for a in "$@"; do case "$a" in --china) CHINA=1 ;; --skip-check) SKIP=1 ;; --agent=*) AGENT="${a#--agent=}" ;; esac; done

step() { printf '\n\033[36m==> %s\033[0m\n' "$1"; }
ok() { printf '    \033[32mOK\033[0m  %s\n' "$1"; }
warn() { printf '    \033[33m!!\033[0m  %s\n' "$1"; }
fail() { printf '\n\033[31m安装没有完成：%s\033[0m\n手动安装方法见 README 的“安装”一节。\n' "$1"; exit 1; }
has() { command -v "$1" >/dev/null 2>&1; }
node_major() { if has node; then node -v | sed -E 's/^v([0-9]+).*/\1/'; else echo 0; fi; }
SUDO=""; [ "$(id -u)" -ne 0 ] && has sudo && SUDO="sudo"
OS="$(uname -s)"

step '1/7 Node.js（需要 20 以上）'
if [ "$(node_major)" -ge 20 ]; then ok "已安装 Node $(node -v)"
else
  if [ "$OS" = Darwin ] && has brew; then brew install node
  else
    [ "$CHINA" = 1 ] && export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node
    export NVM_DIR="$HOME/.nvm"
    if [ ! -s "$NVM_DIR/nvm.sh" ]; then
      has curl || fail '需要 curl 来安装 nvm。'
      curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash || fail 'nvm 下载失败（国内网络常见）。请从 https://nodejs.org 或 https://npmmirror.com/mirrors/node/ 手动安装 Node 20+。'
    fi
    # shellcheck disable=SC1091
    . "$NVM_DIR/nvm.sh"
    nvm install 22 && nvm use 22
  fi
  [ "$(node_major)" -ge 20 ] || fail '装完仍找不到 Node 20+，请打开新终端再运行一次。'
  ok "已安装 Node $(node -v)"
fi

step '2/7 ffmpeg'
if has ffmpeg && has ffprobe; then ok "$(ffmpeg -version | head -1)"
else
  if [ "$OS" = Darwin ]; then has brew || fail '没有 Homebrew。先按 https://brew.sh 安装，或从 https://evermeet.cx/ffmpeg/ 下载 ffmpeg。'; brew install ffmpeg
  elif has apt-get; then $SUDO apt-get update && $SUDO apt-get install -y ffmpeg
  elif has dnf; then $SUDO dnf install -y ffmpeg || fail 'dnf 装不上 ffmpeg，可能要先启用 RPM Fusion。'
  elif has pacman; then $SUDO pacman -S --noconfirm ffmpeg
  else fail '不认识这个系统的包管理器，请从 https://ffmpeg.org/download.html 安装 ffmpeg。'
  fi
  has ffmpeg || fail 'ffmpeg 装完仍不在 PATH 里。'
  ok '已安装 ffmpeg'
fi
# Linux 上 Remotion 的无头浏览器还要几样系统库；装不上不中断，渲染时再看
if [ "$OS" = Linux ] && has apt-get; then
  $SUDO apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 fonts-noto-cjk >/dev/null 2>&1 || warn '部分系统库没装上，渲染报错时见 README 常见问题'
  $SUDO apt-get install -y libasound2 >/dev/null 2>&1 || $SUDO apt-get install -y libasound2t64 >/dev/null 2>&1 || true
fi

step '3/7 安装依赖（npm ci）'
if [ "$CHINA" = 1 ]; then npm config set registry https://registry.npmmirror.com --location=project; ok '本工程的 npm 改用国内镜像 npmmirror（写在 .npmrc，不影响别的项目）'; fi
npm ci --no-audit --no-fund || fail 'npm ci 失败。网络慢可以加 --china 重新运行。'
ok '依赖装好了'

step '4/7 渲染用的浏览器'
if node tools/remotion.cjs browser ensure; then ok 'Remotion 的无头浏览器准备好了'
else
  warn '浏览器下载失败，改用本机已装的 Chrome/Chromium'
  found=""
  for c in "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" /usr/bin/google-chrome /usr/bin/google-chrome-stable /usr/bin/chromium /usr/bin/chromium-browser /snap/bin/chromium; do [ -x "$c" ] && { found="$c"; break; }; done
  [ -n "$found" ] || fail '没有下载到浏览器，本机也没有 Chrome/Chromium。装一个后重新运行。'
  node -e "const f='studio.local.json',fs=require('fs');const c=fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):{};c.browserExecutable=process.argv[1];fs.writeFileSync(f,JSON.stringify(c,null,2)+'\n')" "$found"
  ok "已写入 studio.local.json：$found"
fi

step '5/7 体检（npm run doctor）'
npm run doctor || fail '体检没通过，看上面 FAIL 那几行。'

if [ "$SKIP" = 0 ]; then
  step '6/7 试跑：合成示例片的音乐，渲染一帧'
  npm run music -- sunk-cost || fail '示例片的音乐没合成出来。'
  mkdir -p out
  node tools/remotion.cjs still sunk-cost out/setup-check.png --frame=150 || fail '渲染没跑通，常见原因是浏览器或系统库，见 README 常见问题。'
  ok '渲染出了 out/setup-check.png'
fi

step '7/7 把两个 Skill 装进 Agent'
node setup/install-skills.mjs --agent "$AGENT" || warn 'Skill 没装上，可以之后运行 node setup/install-skills.mjs --agent claude（换成你用的 Agent）'

printf '\n\033[32m全部完成。\033[0m\n打开预览：npm run studio      做一条新片：见 README“做一部新片”      给 Agent 用：见 skills/README.md\n'
