#!/usr/bin/env pwsh
# Merge All PRs Script - Safe and Organized
# English version to avoid encoding issues

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

$ErrorActionPreference = "Continue"

# Colors
function Write-Success { Write-Host "[OK] $args" -ForegroundColor Green }
function Write-InfoMsg { Write-Host "[INFO] $args" -ForegroundColor Cyan }
function Write-WarningMsg { Write-Host "[WARN] $args" -ForegroundColor Yellow }
function Write-ErrorMsg { Write-Host "[ERROR] $args" -ForegroundColor Red }
function Write-Header { Write-Host "`n=== $args ===" -ForegroundColor Magenta }

# Statistics
$stats = @{
    Total = 0
    Merged = 0
    Failed = 0
    Skipped = 0
}

Write-Header "Starting PR Merge Process"

if ($DryRun) {
    Write-WarningMsg "Dry Run Mode - No actual merging will occur"
}

# Phase 1: GitHub Actions Dependencies (Safest)
Write-Header "Phase 1: GitHub Actions Dependencies"
$actionsPRs = @(20, 19, 16)

foreach ($pr in $actionsPRs) {
    $stats.Total++
    Write-InfoMsg "Processing PR #$pr..."
    
    try {
        # Check PR status
        $prInfo = gh pr view $pr --json mergeable,mergeStateStatus,title | ConvertFrom-Json
        Write-InfoMsg "Title: $($prInfo.title)"
        Write-InfoMsg "Status: $($prInfo.mergeStateStatus) | Mergeable: $($prInfo.mergeable)"
        
        if ($prInfo.mergeable -eq "MERGEABLE" -or $Force) {
            if (-not $DryRun) {
                Write-InfoMsg "Attempting merge..."
                gh pr merge $pr --merge --auto
                Write-Success "Successfully merged PR #$pr!"
                $stats.Merged++
                Start-Sleep -Seconds 2
            } else {
                Write-InfoMsg "[DRY RUN] Would merge PR #$pr"
                $stats.Merged++
            }
        } else {
            Write-WarningMsg "PR #$pr is not mergeable - skipping"
            $stats.Skipped++
        }
    } catch {
        Write-ErrorMsg "Failed to merge PR #$pr : $_"
        $stats.Failed++
    }
}

# Phase 2: NPM Dependencies (Safe)
Write-Header "Phase 2: NPM Dependencies"
$npmPRs = @(41, 40, 28, 27, 26, 25, 24, 23, 22, 21)

foreach ($pr in $npmPRs) {
    $stats.Total++
    Write-InfoMsg "Processing PR #$pr..."
    
    try {
        $prInfo = gh pr view $pr --json mergeable,mergeStateStatus,title | ConvertFrom-Json
        Write-InfoMsg "Title: $($prInfo.title)"
        
        if ($prInfo.mergeable -eq "MERGEABLE" -or $prInfo.mergeable -eq "UNKNOWN") {
            if (-not $DryRun) {
                Write-InfoMsg "Attempting merge..."
                gh pr merge $pr --merge --auto
                Write-Success "Successfully merged PR #$pr!"
                $stats.Merged++
                Start-Sleep -Seconds 2
            } else {
                Write-InfoMsg "[DRY RUN] Would merge PR #$pr"
                $stats.Merged++
            }
        } else {
            Write-WarningMsg "PR #$pr is not mergeable - skipping"
            $stats.Skipped++
        }
    } catch {
        Write-ErrorMsg "Failed to merge PR #$pr : $_"
        $stats.Failed++
    }
}

# Phase 3: Bug Fixes and Small Improvements
Write-Header "Phase 3: Bug Fixes and Improvements"
$bugfixPRs = @(35, 32, 31, 42, 14)

foreach ($pr in $bugfixPRs) {
    $stats.Total++
    Write-InfoMsg "Processing PR #$pr..."
    
    try {
        $prInfo = gh pr view $pr --json mergeable,mergeStateStatus,title | ConvertFrom-Json
        Write-InfoMsg "Title: $($prInfo.title)"
        
        if ($prInfo.mergeable -eq "MERGEABLE" -or $prInfo.mergeable -eq "UNKNOWN") {
            if (-not $DryRun) {
                Write-InfoMsg "Attempting merge..."
                gh pr merge $pr --merge --auto
                Write-Success "Successfully merged PR #$pr!"
                $stats.Merged++
                Start-Sleep -Seconds 3
            } else {
                Write-InfoMsg "[DRY RUN] Would merge PR #$pr"
                $stats.Merged++
            }
        } else {
            Write-WarningMsg "PR #$pr is not mergeable - skipping"
            $stats.Skipped++
        }
    } catch {
        Write-ErrorMsg "Failed to merge PR #$pr : $_"
        $stats.Failed++
    }
}

# Phase 4: AI Improvements
Write-Header "Phase 4: AI Improvements"
$aiPRs = @(77, 70, 39)

foreach ($pr in $aiPRs) {
    $stats.Total++
    Write-InfoMsg "Processing PR #$pr..."
    
    try {
        $prInfo = gh pr view $pr --json mergeable,mergeStateStatus,title | ConvertFrom-Json
        Write-InfoMsg "Title: $($prInfo.title)"
        
        if ($prInfo.mergeable -eq "MERGEABLE" -or ($prInfo.mergeable -eq "UNKNOWN" -and $Force)) {
            if (-not $DryRun) {
                Write-WarningMsg "This PR contains AI changes - ensure review"
                Write-InfoMsg "Attempting merge..."
                gh pr merge $pr --merge --auto
                Write-Success "Successfully merged PR #$pr!"
                $stats.Merged++
                Start-Sleep -Seconds 3
            } else {
                Write-InfoMsg "[DRY RUN] Would merge PR #$pr"
                $stats.Merged++
            }
        } else {
            Write-WarningMsg "PR #$pr is not mergeable - skipping"
            $stats.Skipped++
        }
    } catch {
        Write-ErrorMsg "Failed to merge PR #$pr : $_"
        $stats.Failed++
    }
}

# Phase 5: Satellite Features
Write-Header "Phase 5: Satellite Features"
$satellitePRs = @(76, 75, 73, 72, 71, 64)

foreach ($pr in $satellitePRs) {
    $stats.Total++
    Write-InfoMsg "Processing PR #$pr..."
    
    try {
        $prInfo = gh pr view $pr --json mergeable,mergeStateStatus,title | ConvertFrom-Json
        Write-InfoMsg "Title: $($prInfo.title)"
        
        if ($prInfo.mergeable -eq "MERGEABLE" -or ($prInfo.mergeable -eq "UNKNOWN" -and $Force)) {
            if (-not $DryRun) {
                Write-WarningMsg "This PR contains Satellite features - ensure review"
                Write-InfoMsg "Attempting merge..."
                gh pr merge $pr --merge --auto
                Write-Success "Successfully merged PR #$pr!"
                $stats.Merged++
                Start-Sleep -Seconds 3
            } else {
                Write-InfoMsg "[DRY RUN] Would merge PR #$pr"
                $stats.Merged++
            }
        } else {
            Write-WarningMsg "PR #$pr is not mergeable - skipping"
            $stats.Skipped++
        }
    } catch {
        Write-ErrorMsg "Failed to merge PR #$pr : $_"
        $stats.Failed++
    }
}

# Phase 6: Major Features (Careful)
Write-Header "Phase 6: Major Features (Requires careful review)"
$majorPRs = @(56, 50, 46, 44, 36, 30)

Write-WarningMsg "Major features need manual review - skipping in auto mode"
Write-InfoMsg "Recommended to review these PRs manually: $($majorPRs -join ', ')"

foreach ($pr in $majorPRs) {
    $stats.Total++
    $stats.Skipped++
}

# Close old/duplicate PRs
Write-Header "Phase 7: Old PRs to Close"
$oldPRs = @(1, 2, 4, 5, 6, 7, 8, 12)

Write-InfoMsg "Old PRs recommended for closure: $($oldPRs -join ', ')"
Write-InfoMsg "Use: gh pr close <number> to close them manually"

# Final Results
Write-Header "Final Results"
Write-Host ""
Write-Host "Statistics:" -ForegroundColor Cyan
Write-Host "  Total PRs: $($stats.Total)" -ForegroundColor White
Write-Success "  Merged: $($stats.Merged)"
Write-ErrorMsg "  Failed: $($stats.Failed)"
Write-WarningMsg "  Skipped: $($stats.Skipped)"
Write-Host ""

$successRate = [math]::Round(($stats.Merged / $stats.Total) * 100, 2)
Write-Host "Success Rate: $successRate%" -ForegroundColor $(if ($successRate -gt 70) { "Green" } elseif ($successRate -gt 40) { "Yellow" } else { "Red" })

Write-Host ""
Write-Header "Next Steps"
Write-InfoMsg "1. Review failed or skipped PRs"
Write-InfoMsg "2. Rebase conflicting branches"
Write-InfoMsg "3. Test application on Vercel"
Write-InfoMsg "4. Review major features manually (#52, #56, #46)"
Write-Host ""

if ($DryRun) {
    Write-WarningMsg "This was a dry run - nothing was actually merged"
    Write-InfoMsg "To perform actual merge, run the script without -DryRun"
}
