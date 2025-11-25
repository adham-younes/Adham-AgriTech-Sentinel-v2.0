#Requires -Version 5.1
<#
.SYNOPSIS
    Simple script to trigger the CODEx Write workflow

.DESCRIPTION
    Triggers the codex-write GitHub Actions workflow to update documentation

.PARAMETER UpdateType
    Type of update: vision, architecture, or documentation (default: vision)

.EXAMPLE
    .\trigger-codex.ps1
    .\trigger-codex.ps1 -UpdateType architecture
#>

param(
    [ValidateSet('vision', 'architecture', 'documentation')]
    [string]$UpdateType = 'vision'
)

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  CODEx Write Workflow Trigger" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check GitHub CLI
Write-Host "[1/4] Checking GitHub CLI..." -ForegroundColor Cyan
try {
    $null = gh --version 2>&1
    if ($LASTEXITCODE -ne 0) { throw "GitHub CLI not found" }
    Write-Host "  ✓ GitHub CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "  ✗ GitHub CLI is not installed!" -ForegroundColor Red
    Write-Host "  Install from: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Check authentication
Write-Host "[2/4] Checking authentication..." -ForegroundColor Cyan
try {
    $null = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Not authenticated" }
    Write-Host "  ✓ Authenticated with GitHub" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Not authenticated with GitHub!" -ForegroundColor Red
    Write-Host "  Run: gh auth login" -ForegroundColor Yellow
    exit 1
}

# Check secret
Write-Host "[3/4] Checking CODEX_PAT secret..." -ForegroundColor Cyan
$secrets = gh secret list 2>&1 | Out-String
if ($secrets -match "CODEX_PAT") {
    Write-Host "  ✓ CODEX_PAT secret found" -ForegroundColor Green
} else {
    Write-Host "  ✗ CODEX_PAT secret not found!" -ForegroundColor Red
    Write-Host "  Run: .\setup-codex-pat.ps1" -ForegroundColor Yellow
    exit 1
}

# Trigger workflow
Write-Host "[4/4] Triggering workflow..." -ForegroundColor Cyan
Write-Host "  Update Type: $UpdateType" -ForegroundColor White

try {
    $result = gh workflow run codex-write.yml -f update_type=$UpdateType 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to trigger: $result"
    }
    Write-Host "  ✓ Workflow triggered successfully!" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Failed to trigger workflow!" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. View runs:  gh run list --workflow=codex-write.yml" -ForegroundColor Gray
Write-Host "  2. View logs:  gh run view --log" -ForegroundColor Gray
Write-Host "  3. Pull changes: git pull" -ForegroundColor Gray
Write-Host ""
Write-Host "Done!" -ForegroundColor Green
Write-Host ""
