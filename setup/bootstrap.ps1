# Vibe Studio bootstrap for Windows: download the project, then run setup\install.ps1
# (Node 20+, ffmpeg, npm ci, render browser, doctor, a test render, and the two skills for your agents).
#
#   irm https://raw.githubusercontent.com/guoxuxin888-lab/vibe-studio/main/setup/bootstrap.ps1 | iex
#
# Options: set these in the same PowerShell window before the line above.
#   $env:VIBE_DIR = 'D:\vibe-studio'   where to put the project (default: $HOME\vibe-studio; avoid spaces in the path)
#   $env:VIBE_CHINA = '1'              npm uses the npmmirror registry (mainland China)
#   $env:VIBE_AGENT = 'claude'         which agents get the skills: claude,codex,kimi,agents,trae,workbuddy (default auto)
& {
  # Continue, not Stop: in Windows PowerShell 5.1 a native tool's stderr (git progress, npm warnings) becomes an error record
  # whenever output is captured. Native steps are checked by exit code; cmdlets below use -ErrorAction Stop.
  $ErrorActionPreference = 'Continue'
  $ProgressPreference = 'SilentlyContinue'
  [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor 3072
  $repo = 'guoxuxin888-lab/vibe-studio'
  $dir = if ($env:VIBE_DIR) { $env:VIBE_DIR } else { Join-Path $HOME 'vibe-studio' }
  $hasGit = [bool](Get-Command git -ErrorAction SilentlyContinue)

  if (Test-Path (Join-Path $dir 'package.json')) {
    Write-Host "==> Using the existing project at $dir" -ForegroundColor Cyan
    if ($hasGit -and (Test-Path (Join-Path $dir '.git'))) { & git -C $dir pull --ff-only; if ($LASTEXITCODE -ne 0) { Write-Host '    git pull failed, keeping the current copy' -ForegroundColor Yellow } }
  } else {
    if ((Test-Path $dir) -and (Get-ChildItem $dir -Force | Select-Object -First 1)) { throw "$dir exists and is not a Vibe Studio project. Set `$env:VIBE_DIR to another folder." }
    $parent = Split-Path -Parent $dir
    New-Item -ItemType Directory -Force -Path $parent | Out-Null
    $cloned = $false
    if ($hasGit) {
      Write-Host "==> git clone https://github.com/$repo" -ForegroundColor Cyan
      & git clone --depth 1 "https://github.com/$repo.git" $dir
      $cloned = ($LASTEXITCODE -eq 0)
    }
    if (-not $cloned) {
      Write-Host '==> Downloading the project ZIP from GitHub' -ForegroundColor Cyan
      # Unpack next to the target so the final move is a rename on the same drive
      $tmp = Join-Path $parent ('.vibe-download-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
      New-Item -ItemType Directory -Force -Path $tmp | Out-Null
      $zip = Join-Path $tmp 'main.zip'
      Invoke-WebRequest -UseBasicParsing "https://codeload.github.com/$repo/zip/refs/heads/main" -OutFile $zip -ErrorAction Stop
      Expand-Archive -Path $zip -DestinationPath $tmp -Force -ErrorAction Stop
      if ((Test-Path $dir) -and -not (Get-ChildItem $dir -Force | Select-Object -First 1)) { Remove-Item $dir }
      Move-Item (Join-Path $tmp 'vibe-studio-main') $dir -ErrorAction Stop
      Remove-Item $zip; Remove-Item $tmp
    }
    Write-Host "    Project is at $dir" -ForegroundColor Green
  }

  $a = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $dir 'setup\install.ps1'))
  if ($env:VIBE_CHINA -eq '1') { $a += '-China' }
  if ($env:VIBE_AGENT) { $a += @('-Agent', $env:VIBE_AGENT) }
  & powershell @a
  if ($LASTEXITCODE -ne 0) { Write-Host "Setup stopped. Fix the problem shown above, then run: powershell -NoProfile -ExecutionPolicy Bypass -File $(Join-Path $dir 'setup\install.ps1')" -ForegroundColor Red }
}
