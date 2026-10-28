# Intended for a fresh Windows CI checkout, with dependencies and runtime prepared.
# No repository data or credentials are uploaded: only logs and report JSON files.
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$ciRoot = Split-Path -Parent $PSScriptRoot
$ciStarted = [DateTime]::UtcNow
$ciLogRoot = Join-Path $ciRoot 'artifacts/test-results/ci'
$ciResultRoot = if ($env:LAB_TEST_ARTIFACT_DIR) {
    if ([IO.Path]::IsPathRooted($env:LAB_TEST_ARTIFACT_DIR)) {
        [IO.Path]::GetFullPath($env:LAB_TEST_ARTIFACT_DIR)
    } else {
        [IO.Path]::GetFullPath((Join-Path $ciRoot $env:LAB_TEST_ARTIFACT_DIR))
    }
} else { Join-Path $ciRoot 'artifacts/test-results/current' }
New-Item -ItemType Directory -Force -Path $ciLogRoot, $ciResultRoot | Out-Null
$env:LAB_TEST_ARTIFACT_DIR = $ciResultRoot
$env:LAB_ROOT = $ciRoot
$env:LAB_LIBRARY_ONLY = ''
$env:LAB_AGENT_WORKER = ''
$ciSteps = [Collections.Generic.List[object]]::new()
$ciReports = [Collections.Generic.List[object]]::new()
$ciComplete = $false
$ciBuildComplete = $false
$ciFailure = $null
$ciNodeVersion = $null
$ciPnpmVersion = $null

function Invoke-CiCommand {
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$Executable,
        [string[]]$CommandArguments = @()
    )
    $ciCommandStart = [DateTime]::UtcNow
    $ciLogPath = Join-Path $ciLogRoot ($Name + '.log')
    Write-Host "::group::$Name"
    Write-Host ($Executable + ' ' + ($CommandArguments -join ' '))
    $ciCommandError = $null
    try {
        & $Executable @CommandArguments 2>&1 | Tee-Object -FilePath $ciLogPath
        $ciCommandExit = $LASTEXITCODE
    } catch {
        $ciCommandError = $_.Exception.Message
        $ciCommandExit = if ($LASTEXITCODE) { $LASTEXITCODE } else { 1 }
        $ciCommandError | Add-Content -LiteralPath $ciLogPath -Encoding utf8
    } finally {
        Write-Host '::endgroup::'
    }
    $ciSteps.Add([ordered]@{
        name = $Name
        command = ($Executable + ' ' + ($CommandArguments -join ' '))
        exitCode = $ciCommandExit
        passed = ($ciCommandExit -eq 0)
        elapsedMs = [int]([DateTime]::UtcNow - $ciCommandStart).TotalMilliseconds
        error = $ciCommandError
    })
    if ($ciCommandExit -ne 0) {
        throw "CI command failed: $Name (exit $ciCommandExit). See $ciLogPath"
    }
}

Push-Location $ciRoot
try {
    if ([Environment]::OSVersion.Platform -ne [PlatformID]::Win32NT) {
        throw 'This verification script targets Windows x64 only.'
    }
    $ciNode = @(Get-Command node -CommandType Application)[0].Source
    $ciPnpm = @(Get-Command pnpm.cmd -CommandType Application)[0].Source
    $ciNodeVersion = (& $ciNode --version).Trim()
    $ciPnpmVersion = (& $ciPnpm --version).Trim()
    if ($ciNodeVersion -ne 'v24.19.0' -or $ciPnpmVersion -ne '11.19.0') {
        throw "Expected Node v24.19.0 / pnpm 11.19.0; found $ciNodeVersion / $ciPnpmVersion."
    }
    foreach ($ciRuntimeFile in @('runtime/node.exe','runtime/anvil.exe')) {
        if (-not (Test-Path -LiteralPath $ciRuntimeFile -PathType Leaf)) {
            throw "Missing $ciRuntimeFile. Run the workflow runtime preparation step first."
        }
    }

    # Compile Permit2 before the compatibility build creates the source manifest.
    Invoke-CiCommand -Name '01-offline-permit2-build' -Executable $ciPnpm -CommandArguments @('run','build:budget')
    Invoke-CiCommand -Name '02-compatibility-build' -Executable $ciPnpm -CommandArguments @('build')
    $ciBuildComplete = $true
    Invoke-CiCommand -Name '03-release-protection-doctor' -Executable $ciNode -CommandArguments @('dist/cli.mjs','doctor')
    Invoke-CiCommand -Name '04-interface-typecheck' -Executable $ciPnpm -CommandArguments @('run','typecheck:interfaces')
    Invoke-CiCommand -Name '05-mjs-unit-tests' -Executable $ciPnpm -CommandArguments @('test')

    # Integration suites run sequentially: some retain fixed, isolated test ports.
    Invoke-CiCommand -Name '06-budget-core' -Executable $ciNode -CommandArguments @('tests/budget-integration.mjs')
    Invoke-CiCommand -Name '07-budget-parameter-matrix' -Executable $ciNode -CommandArguments @('tests/budget-parameter-matrix.mjs')
    Invoke-CiCommand -Name '08-budget-main-integration' -Executable $ciNode -CommandArguments @('tests/budget-main-integration.mjs')
    Invoke-CiCommand -Name '09-budget-http' -Executable $ciNode -CommandArguments @('tests/budget-http.mjs')
    Invoke-CiCommand -Name '10-unified-windows-launcher' -Executable $ciNode -CommandArguments @('tests/budget-launcher.mjs')
    Invoke-CiCommand -Name '11-original-peer-and-task-integration' -Executable $ciNode -CommandArguments @('tests/v2-integration.mjs')
    Invoke-CiCommand -Name '12-service-integration' -Executable $ciNode -CommandArguments @('tests/service-integration.mjs')

    foreach ($ciReportName in @(
        'v0153-budget-results.json',
        'v0153-parameter-results.json',
        'v0153-main-results.json',
        'v0153-http-results.json',
        'v0153-launcher-results.json',
        'v015-service-results.json'
    )) {
        $ciReportPath = Join-Path $ciResultRoot $ciReportName
        if (-not (Test-Path -LiteralPath $ciReportPath -PathType Leaf)) {
            throw "Missing current CI report: $ciReportName"
        }
        if ((Get-Item -LiteralPath $ciReportPath).LastWriteTimeUtc -lt $ciStarted) {
            throw "Report predates this run: $ciReportName"
        }
        $ciReport = Get-Content -LiteralPath $ciReportPath -Raw | ConvertFrom-Json
        if ($null -eq $ciReport.results -or @($ciReport.results).Count -eq 0) {
            throw "Report has no executed cases: $ciReportName"
        }
        if (@($ciReport.results | Where-Object { $_.passed -isnot [bool] -or $_.passed -ne $true }).Count -gt 0) {
            throw "Report contains failed, blocked or unverified test assertions: $ciReportName"
        }
        $ciReports.Add([ordered]@{
            file = $ciReportName
            passed = @($ciReport.results | Where-Object { $_.passed -eq $true }).Count
            blocked = @($ciReport.results | Where-Object { $_.status -eq 'BLOCKED' }).Count
        })
    }
    $ciComplete = $true
} catch {
    $ciFailure = $_.Exception.Message
    Write-Error -Message $ciFailure -ErrorAction Continue
    throw
} finally {
    $ciBuildHash = $null
    if ($ciBuildComplete -and (Test-Path -LiteralPath 'build-info.json')) {
        try { $ciBuildHash = (Get-Content -LiteralPath 'build-info.json' -Raw | ConvertFrom-Json).sourceHash } catch { }
    }
    [ordered]@{
        schema = 'web3-agent-lab-windows-ci-v1'
        status = if ($ciComplete) { 'passed' } else { 'failed' }
        version = 'V0.15.3'
        commit = $env:GITHUB_SHA
        startedAt = $ciStarted.ToString('o')
        endedAt = [DateTime]::UtcNow.ToString('o')
        node = $ciNodeVersion
        pnpm = $ciPnpmVersion
        compatibilityBuildCompleted = $ciBuildComplete
        buildHash = $ciBuildHash
        typecheckScope = 'Control interfaces and designated type tests; not a full TypeScript runtime migration.'
        cloudModelTested = $false
        browserGuiRun = $false
        macosRun = $false
        steps = @($ciSteps.ToArray())
        reports = @($ciReports.ToArray())
        error = $ciFailure
    } | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath (Join-Path $ciLogRoot 'summary.json') -Encoding utf8
    Pop-Location
}
