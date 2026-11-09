#!/usr/bin/env bash
# Vibe Studio 引导安装（macOS / Linux）：下载工程，再运行 setup/install.sh
# （Node 20+、ffmpeg、npm ci、渲染浏览器、体检、试渲染一帧、把两个 Skill 装进 Agent）。
#
#   curl -fsSL https://raw.githubusercontent.com/guoxuxin888-lab/vibe-studio/main/setup/bootstrap.sh | bash
#   国内网络：  ... | bash -s -- --china
#   指定 Agent：... | bash -s -- --agent=claude
#   换目录：    curl -fsSL ... | VIBE_DIR=~/work/vibe-studio bash
set -euo pipefail

main() {
  local repo=guoxuxin888-lab/vibe-studio
  local dir="${VIBE_DIR:-$HOME/vibe-studio}"
  if [ -f "$dir/package.json" ]; then
    printf '==> 使用已有的工程 %s\n' "$dir"
    if [ -d "$dir/.git" ] && command -v git >/dev/null 2>&1; then git -C "$dir" pull --ff-only || echo '    git pull 没成功，先用现有的这份'; fi
  else
    if [ -d "$dir" ] && [ -n "$(ls -A "$dir")" ]; then echo "$dir 已经存在，而且不是 Vibe Studio 工程。用 VIBE_DIR 换一个目录。"; exit 1; fi
    local tmp src=""; tmp="$(mktemp -d)"
    if command -v git >/dev/null 2>&1; then
      printf '==> git clone https://github.com/%s\n' "$repo"
      git clone --depth 1 "https://github.com/$repo.git" "$tmp/src" && src="$tmp/src"
    fi
    if [ -z "$src" ]; then
      printf '==> 从 GitHub 下载工程压缩包\n'
      curl -fsSL "https://codeload.github.com/$repo/tar.gz/refs/heads/main" | tar -xz -C "$tmp"
      src="$tmp/vibe-studio-main"
    fi
    mkdir -p "$(dirname "$dir")"
    if [ -d "$dir" ]; then (shopt -s dotglob; mv "$src"/* "$dir"/); else mv "$src" "$dir"; fi
    printf '    工程放在 %s\n' "$dir"
  fi
  cd "$dir"
  # 通过管道运行时，标准输入是这段脚本本身；安装脚本改从终端读，sudo 才能正常问密码
  if [ -r /dev/tty ]; then bash setup/install.sh "$@" </dev/tty; else bash setup/install.sh "$@" </dev/null; fi
}

main "$@"
