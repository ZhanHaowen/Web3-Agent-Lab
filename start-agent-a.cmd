@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if defined LAB_DATA_DIR (
    set "labAgentData=%LAB_DATA_DIR%"
) else (
    set "labAgentData=%~dp0data"
)
if defined LAB_PORT (
    set "labAgentPort=%LAB_PORT%"
) else (
    set "labAgentPort=4317"
)
set "labAgentProfile=%labAgentData%\agents\agent-a"
if not exist "%labAgentProfile%\profile.json" goto missing_profile
if not exist "%labAgentProfile%\identity.token" goto missing_profile
if not exist "%labAgentProfile%\wallet-secret.json" goto missing_profile
if not exist "%labAgentProfile%\model-secret.json" goto missing_profile
if not exist "%~dp0runtime\node.exe" (
    echo 缺少随包 Node 运行环境。请完整解压 Windows 压缩包。
    pause
    exit /b 1
)
set "LAB_ROOT=%~dp0"
"%~dp0runtime\node.exe" "%~dp0dist\agent-worker.mjs" --profile "%labAgentProfile%" --control "http://127.0.0.1:%labAgentPort%"
if errorlevel 1 pause
exit /b
:missing_profile
echo 尚未找到完整的 agent-a 配置。请先运行 start.cmd 和 open-task-center.cmd，在 GUI 中创建名为 agent-a 的离线配置。
echo 使用自定义数据目录时，请先设置正确的 LAB_DATA_DIR。
pause
exit /b 1
