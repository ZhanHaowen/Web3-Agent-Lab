$ErrorActionPreference = 'Stop'
$labRoot = Split-Path -Parent $PSScriptRoot
$labPort = if ($env:LAB_PORT) { $env:LAB_PORT } else { '4317' }
$labUrl = "http://127.0.0.1:$labPort"
$health = $null
try {
    $health = Invoke-RestMethod -Uri "$labUrl/api/health" -TimeoutSec 2
} catch { }
if ($health.app -eq 'web3-agent-lab') {
    $expectedBuild = Get-Content -LiteralPath (Join-Path $labRoot 'build-info.json') -Raw | ConvertFrom-Json
    if ($health.version.sourceHash -ne $expectedBuild.sourceHash) {
        throw 'Another Web3 Agent Lab build is using this port. Stop the old version with its stop.cmd before starting V0.13, or select another LAB_PORT and LAB_CHAIN_PORT.'
    }
    Start-Process $labUrl
    exit 0
}
$labNode = Join-Path $labRoot 'runtime\node.exe'
$labEntry = Join-Path $labRoot 'dist\server.mjs'
if (-not (Test-Path -LiteralPath $labNode)) { throw 'Bundled Node runtime is missing. Extract the complete Windows ZIP first.' }
New-Item -ItemType Directory -Force -Path (Join-Path $labRoot 'data') | Out-Null
$env:LAB_ROOT = $labRoot
$process = Start-Process -FilePath $labNode -ArgumentList @('"' + $labEntry + '"') -WorkingDirectory $labRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $labRoot 'data\server.stdout.log') -RedirectStandardError (Join-Path $labRoot 'data\server.stderr.log') -PassThru
for ($attempt = 0; $attempt -lt 60; $attempt++) {
    if ($process.HasExited) { throw "Server exited. See data\server.stderr.log. Port $labPort may be occupied." }
    try {
        $health = Invoke-RestMethod -Uri "$labUrl/api/health" -TimeoutSec 1
        if ($health.app -eq 'web3-agent-lab') { Start-Process $labUrl; Write-Host "Web3 Agent Lab: $labUrl"; exit 0 }
    } catch { }
    Start-Sleep -Milliseconds 250
}
throw 'Startup timed out. See data\server.stderr.log.'
