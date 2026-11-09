# Vibe Studio 一键安装（Windows）
# 用法：双击 setup\install-windows.cmd，或在工程根目录运行：
#   powershell -NoProfile -ExecutionPolicy Bypass -File setup\install.ps1          # 默认
#   powershell -NoProfile -ExecutionPolicy Bypass -File setup\install.ps1 -China   # 国内网络：npm 走 npmmirror
# 指定 Agent：-Agent claude,codex,kimi,agents,trae,workbuddy（默认 auto：本机有哪个装哪个）
# 会做：检查/安装 Node 20+ 和 ffmpeg（用 Windows 自带的 winget）→ npm ci → 准备渲染浏览器（下载失败就用本机的 Edge 或 Chrome）
#       → npm run doctor → 合成示例片的音乐并渲染一帧，确认整条链能跑通 → 把两个 Skill 装进 Agent。已经装好的会跳过。
param([switch]$China, [switch]$SkipCheck, [string]$Agent = 'auto')
# 不用 Stop：Windows PowerShell 5.1 在输出被抓取时，会把 npm、winget 写到 stderr 的提示当成错误；外部命令都看退出码
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Step($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok($m) { Write-Host "    OK  $m" -ForegroundColor Green }
function Warn($m) { Write-Host "    !!  $m" -ForegroundColor Yellow }
function Fail($m) { Write-Host "`n安装没有完成：$m" -ForegroundColor Red; Write-Host "手动安装方法见 README 的“安装”一节。"; exit 1 }
function Refresh-Path { $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User') }
function Node-Major { try { $v = (& node -v) 2>$null; if ($v -match '^v(\d+)') { return [int]$Matches[1] } } catch {} ; return 0 }
function Has($cmd) { return [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Winget-Install($id, $name) {
  if (-not (Has 'winget')) { Fail "没有找到 winget，无法自动安装 $name。请从官网安装后重新运行本脚本。" }
  Write-Host "    正在用 winget 安装 $name（第一次可能要几分钟）..."
  & winget install -e --id $id --accept-source-agreements --accept-package-agreements --silent
  Refresh-Path
}

Step '1/7 Node.js（需要 20 以上）'
$major = Node-Major
if ($major -ge 20) { Ok "已安装 Node $(& node -v)" }
else {
  if ($major -gt 0) { Warn "当前 Node 版本太旧：$(& node -v)" }
  Winget-Install 'OpenJS.NodeJS.LTS' 'Node.js LTS'
  $major = Node-Major
  if ($major -lt 20) { Fail '装完仍找不到 Node 20+。请关掉这个窗口重新打开再运行一次；还不行就从 https://nodejs.org 下载 LTS 版安装。' }
  Ok "已安装 Node $(& node -v)"
}

Step '2/7 ffmpeg'
if ((Has 'ffmpeg') -and (Has 'ffprobe')) { Ok ((& ffmpeg -version | Select-Object -First 1)) }
else {
  Winget-Install 'Gyan.FFmpeg' 'ffmpeg'
  if (-not (Has 'ffmpeg')) { Fail 'ffmpeg 装完仍不在 PATH 里。请关掉窗口重新打开再运行；或者从 https://www.gyan.dev/ffmpeg/builds/ 下载，把 bin 目录加进 PATH。' }
  Ok '已安装 ffmpeg'
}

Step '3/7 安装依赖（npm ci）'
if ($China) { & npm config set registry https://registry.npmmirror.com --location=project; Ok '本工程的 npm 改用国内镜像 npmmirror（写在工程根目录 .npmrc，不影响别的项目）' }
& npm ci --no-audit --no-fund
if ($LASTEXITCODE -ne 0) { Fail 'npm ci 失败。网络慢可以加 -China 参数重新运行。' }
Ok '依赖装好了'

Step '4/7 渲染用的浏览器'
& node tools/remotion.cjs browser ensure
if ($LASTEXITCODE -eq 0) { Ok 'Remotion 的无头浏览器准备好了' }
else {
  Warn '浏览器下载失败，改用本机已装的 Edge 或 Chrome'
  $cands = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe", "$env:ProgramFiles\Google\Chrome\Application\chrome.exe", "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe", "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe")
  $found = $cands | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
  if (-not $found) { Fail '没有下载到浏览器，本机也没有 Edge 或 Chrome。装一个 Chrome 后重新运行。' }
  $cfgPath = Join-Path $root 'studio.local.json'
  $cfg = @{}
  if (Test-Path $cfgPath) { (Get-Content $cfgPath -Raw | ConvertFrom-Json).PSObject.Properties | ForEach-Object { $cfg[$_.Name] = $_.Value } }
  $cfg['browserExecutable'] = $found.Replace('\', '/')
  [IO.File]::WriteAllText($cfgPath, ($cfg | ConvertTo-Json), (New-Object Text.UTF8Encoding $false))
  Ok "已写入 studio.local.json：$found"
}

Step '5/7 体检（npm run doctor）'
& npm run doctor
if ($LASTEXITCODE -ne 0) { Fail '体检没通过，看上面 FAIL 那几行。' }

if (-not $SkipCheck) {
  Step '6/7 试跑：合成示例片的音乐，渲染一帧'
  & npm run music -- sunk-cost
  if ($LASTEXITCODE -ne 0) { Fail '示例片的音乐没合成出来。' }
  New-Item -ItemType Directory -Force -Path (Join-Path $root 'out') | Out-Null
  & node tools/remotion.cjs still sunk-cost out/setup-check.png --frame=150
  if ($LASTEXITCODE -ne 0) { Fail '渲染没跑通，常见原因是浏览器，见 README 常见问题。' }
  Ok '渲染出了 out\setup-check.png'
}

Step '7/7 把两个 Skill 装进 Agent'
& node setup/install-skills.mjs --agent $Agent
if ($LASTEXITCODE -ne 0) { Warn 'Skill 没装上，可以之后运行 node setup/install-skills.mjs --agent claude（换成你用的 Agent）' }

$fonts = @("$env:WINDIR\Fonts", "$env:LOCALAPPDATA\Microsoft\Windows\Fonts") | ForEach-Object { Get-ChildItem $_ -Filter 'NotoSerifSC*' -ErrorAction SilentlyContinue }
if (-not $fonts) { Warn '没找到思源宋体 Noto Serif SC，中文会退回系统宋体。想和示例一样好看，从 https://fonts.google.com/noto/specimen/Noto+Serif+SC 下载安装。' }

Write-Host "`n全部完成。" -ForegroundColor Green
Write-Host '打开预览：npm run studio      做一条新片：见 README“做一部新片”      给 Agent 用：见 skills\README.md'
