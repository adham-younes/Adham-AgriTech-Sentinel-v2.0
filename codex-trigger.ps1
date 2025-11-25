param(
    [ValidateSet('vision', 'architecture', 'documentation')]
    [string]$UpdateType = 'vision'
)

Write-Host ""
Write-Host "CODEx Write Workflow Trigger" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking GitHub CLI..." -ForegroundColor Yellow
gh --version | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: GitHub CLI not installed" -ForegroundColor Red
    Write-Host "Install from: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}
Write-Host "OK: GitHub CLI found" -ForegroundColor Green

Write-Host "Checking authentication..." -ForegroundColor Yellow
gh auth status 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not authenticated" -ForegroundColor Red
    Write-Host "Run: gh auth login" -ForegroundColor Yellow
    exit 1
}
Write-Host "OK: Authenticated" -ForegroundColor Green

Write-Host "Checking CODEX_PAT secret..." -ForegroundColor Yellow
$secrets = gh secret list 2>&1 | Out-String
if ($secrets -notmatch "CODEX_PAT") {
    Write-Host "ERROR: CODEX_PAT secret not found" -ForegroundColor Red
    Write-Host "Run: .\setup-codex-pat.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "OK: Secret found" -ForegroundColor Green

Write-Host "Triggering workflow ($UpdateType)..." -ForegroundColor Yellow
Write-Host "  Using: codex-write-simple.yml" -ForegroundColor Gray
gh workflow run codex-write-simple.yml -f update_type=$UpdateType
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to trigger workflow" -ForegroundColor Red
    Write-Host "  Trying original workflow..." -ForegroundColor Yellow
    gh workflow run codex-write.yml -f update_type=$UpdateType
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Both workflows failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host "OK: Workflow triggered" -ForegroundColor Green

Write-Host ""
Write-Host "View runs: gh run list --workflow=codex-write.yml" -ForegroundColor Gray
Write-Host ""
