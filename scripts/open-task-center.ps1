$ErrorActionPreference = 'Stop'
$labControlRoot = Split-Path -Parent $PSScriptRoot
$labControlPort = if ($env:LAB_PORT) { $env:LAB_PORT } else { '4317' }
$labControlPortNumber = 0
if (-not [int]::TryParse($labControlPort, [ref]$labControlPortNumber) -or $labControlPortNumber -lt 1 -or $labControlPortNumber -gt 65535) {
    throw 'LAB_PORT 无效，请填写 1 至 65535 的端口号。'
}
$labControlData = if ($env:LAB_DATA_DIR) {
    if ([IO.Path]::IsPathRooted($env:LAB_DATA_DIR)) { [IO.Path]::GetFullPath($env:LAB_DATA_DIR) }
    else { [IO.Path]::GetFullPath((Join-Path $labControlRoot $env:LAB_DATA_DIR)) }
} else { Join-Path $labControlRoot 'data' }
$labControlTokenPath = Join-Path $labControlData 'control-admin.token'
$labControlSecret = $null
$labControlAdminUrl = $null
try {
    if (-not (Test-Path -LiteralPath $labControlTokenPath -PathType Leaf)) {
        throw '尚未找到本实例的管理员凭据。请先运行本目录的 start.cmd，再打开任务中心。'
    }
    try { $labControlSecret = (Get-Content -LiteralPath $labControlTokenPath -Raw).Trim() }
    catch { throw '无法读取本实例的管理员凭据。请先运行本目录的 start.cmd，并确认当前用户有权读取本实例数据目录。' }
    if ($labControlSecret -notmatch '^[a-f0-9]{64}$') {
        throw '本实例的管理员凭据格式无效。请核对 LAB_DATA_DIR，并重新运行本目录的 start.cmd。'
    }
    $labControlOrigin = "http://127.0.0.1:$labControlPortNumber"
    try {
        $labControlHealth = Invoke-RestMethod -Uri "$labControlOrigin/api/health" -TimeoutSec 2
        $labControlStatus = Invoke-RestMethod -Uri "$labControlOrigin/api/status" -TimeoutSec 2
        $labControlBuild = Get-Content -LiteralPath (Join-Path $labControlRoot 'build-info.json') -Raw | ConvertFrom-Json
    } catch {
        throw '无法确认本实例控制服务。请先运行本目录的 start.cmd；自定义端口时须设置相同的 LAB_PORT 和 LAB_DATA_DIR。'
    }
    if ($labControlHealth.app -ne 'web3-agent-lab' -or $labControlHealth.version.sourceHash -ne $labControlBuild.sourceHash) {
        throw '此端口运行的不是本目录的构建。请先关闭旧实例，再运行本目录的 start.cmd。'
    }
    if (-not $labControlStatus.dataDirectory -or [IO.Path]::GetFullPath($labControlStatus.dataDirectory) -ne [IO.Path]::GetFullPath($labControlData)) {
        throw '此端口的数据目录与 LAB_DATA_DIR 不一致。请核对本实例端口和数据目录后再运行 start.cmd。'
    }
    $labControlAdminUrl = $labControlOrigin + '/tasks.html#admin=' + [Uri]::EscapeDataString($labControlSecret)
    try { Start-Process -FilePath $labControlAdminUrl | Out-Null }
    catch { throw '无法打开浏览器。请检查默认浏览器设置后重试；管理员凭据不会输出到控制台。' }
    Write-Host '任务中心管理入口已打开。页面初始化后会清除地址中的管理员凭据。'
} finally {
    $labControlSecret = $null
    $labControlAdminUrl = $null
}
