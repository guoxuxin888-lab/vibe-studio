@echo off
rem Vibe Studio one-click install for Windows. Double-click this file.
rem Add "-China" to use the npmmirror registry: install-windows.cmd -China
chcp 65001 >nul
cd /d "%~dp0\.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*
echo.
pause
