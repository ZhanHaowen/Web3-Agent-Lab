$ErrorActionPreference = 'Stop'
$labPort = if ($env:LAB_PORT) { $env:LAB_PORT } else { '4317' }
$labUrl = "http://127.0.0.1:$labPort"
try {
    $health = Invoke-RestMethod -Uri "$labUrl/api/health" -TimeoutSec 2
    if ($health.app -ne 'web3-agent-lab') { throw 'The selected port is not Web3 Agent Lab.' }
    $labStopRoot = Split-Path -Parent $PSScriptRoot
    $labStopBuild = Get-Content -LiteralPath (Join-Path $labStopRoot 'build-info.json') -Raw | ConvertFrom-Json
    $labStopData = if ($env:LAB_DATA_DIR) { [IO.Path]::GetFullPath($env:LAB_DATA_DIR) } else { Join-Path $labStopRoot 'data' }
    $labStopStatus = Invoke-RestMethod -Uri "$labUrl/api/status" -TimeoutSec 2
    if ($health.version.sourceHash -ne $labStopBuild.sourceHash -or [IO.Path]::GetFullPath($labStopStatus.dataDirectory) -ne [IO.Path]::GetFullPath($labStopData)) { throw 'The selected port belongs to another build or data directory. Use its own stop.cmd.' }
    Invoke-RestMethod -Uri "$labUrl/api/shutdown" -Method Post -Headers @{'X-Lab-Token'=$health.csrfToken} -ContentType 'application/json' -Body '{}' | Out-Null
    Write-Host 'Web3 Agent Lab stopped. Recorded data remains in data/.'
} catch { Write-Host $_.Exception.Message; exit 1 }
