@echo off
cd /d "%~dp0"
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-windows.ps1" -NoBrowser
if errorlevel 1 goto fail
if not defined LAB_PORT set LAB_PORT=4317
start "" "http://127.0.0.1:%LAB_PORT%/research.html"
exit /b 0
:fail
pause
exit /b 1
