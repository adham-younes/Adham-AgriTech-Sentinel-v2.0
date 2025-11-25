#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Trigger the CODEx Write workflow to update documentation

.DESCRIPTION
    This script triggers the codex-write GitHub Actions workflow and monitors its execution.
    It provides real-time status updates and opens the workflow run in your browser.

.PARAMETER UpdateType
    Type of update to perform: vision, architecture, or documentation

.PARAMETER Wait
    Wait for the workflow to complete before exiting

.PARAMETER NoBrowser
    Don't open the workflow URL in browser

.EXAMPLE
    .\run-codex-write.ps1
    Runs the workflow with default update type (vision)

.EXAMPLE
    .\run-codex-write.ps1 -UpdateType architecture
    Updates architecture documentation

.EXAMPLE
    .\run-codex-write.ps1 -UpdateType vision -Wait
    Updates vision document and waits for completion
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('vision', 'architecture', 'documentation')]
    [string]$UpdateType = 'vision',
    
    [Parameter(Mandatory=$false)]
    [switch]$Wait,
    
    [Parameter(Mandatory=$false)]
    [switch]$NoBrowser
)

# Color functions
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = 'White'
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-Host "→ $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-InfoMsg {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

# Main execution
try {
    Write-Header "CODEx Write Workflow Trigger"
    
    # Check if gh CLI is installed
    Write-Step "Checking GitHub CLI installation..."
    $ghVersion = gh --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "GitHub CLI (gh) is not installed!"
        Write-InfoMsg "Install from: https://cli.github.com/"
        exit 1
    }
    Write-Success "GitHub CLI is installed"
    
    # Check authentication
    Write-Step "Checking GitHub authentication..."
    $authStatus = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "Not authenticated with GitHub!"
        Write-InfoMsg "Run: gh auth login"
        exit 1
    }
    Write-Success "Authenticated with GitHub"
    
    # Check if CODEX_PAT secret exists
    Write-Step "Checking for CODEX_PAT secret..."
    $secrets = gh secret list 2>&1 | Out-String
    if ($secrets -match "CODEX_PAT") {
        Write-Success "CODEX_PAT secret found"
    } else {
        Write-ErrorMsg "CODEX_PAT secret not found!"
        Write-InfoMsg "Create a PAT and add it with: gh secret set CODEX_PAT"
        Write-InfoMsg "See CODEX_WRITE_GUIDE.md for instructions"
        exit 1
    }
    
    Write-Host ""
    Write-ColorOutput "Configuration:" -Color Yellow
    Write-ColorOutput "  Update Type: $UpdateType" -Color White
    Write-ColorOutput "  Wait for completion: $Wait" -Color White
    Write-ColorOutput "  Open in browser: $(-not $NoBrowser)" -Color White
    Write-Host ""
    
    # Trigger the workflow
    Write-Step "Triggering codex-write workflow..."
    $triggerResult = gh workflow run codex-write.yml -f update_type=$UpdateType 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "Failed to trigger workflow!"
        Write-Host $triggerResult
        exit 1
    }
    
    Write-Success "Workflow triggered successfully!"
    Write-Host ""
    
    # Wait for the run to register
    Write-Step "Waiting for workflow run to register..."
    Start-Sleep -Seconds 3
    
    # Get the latest run
    Write-Step "Fetching workflow run details..."
    $runJson = gh run list --workflow=codex-write.yml --limit 1 --json databaseId,status,conclusion,url,createdAt 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "Failed to fetch workflow run!"
        Write-Host $runJson
        exit 1
    }
    
    $run = $runJson | ConvertFrom-Json | Select-Object -First 1
    
    if (-not $run) {
        Write-ErrorMsg "No workflow run found!"
        exit 1
    }
    
    Write-Host ""
    Write-Header "Workflow Run Details"
    Write-ColorOutput "  Run ID:       $($run.databaseId)" -Color White
    Write-ColorOutput "  Status:       $($run.status)" -Color $(if ($run.status -eq 'completed') { 'Green' } else { 'Yellow' })
    Write-ColorOutput "  Conclusion:   $($run.conclusion)" -Color $(if ($run.conclusion -eq 'success') { 'Green' } elseif ($run.conclusion) { 'Red' } else { 'Gray' })
    Write-ColorOutput "  Created:      $($run.createdAt)" -Color White
    Write-ColorOutput "  URL:          $($run.url)" -Color Cyan
    Write-Host ""
    
    # Open in browser
    if (-not $NoBrowser) {
        Write-Step "Opening workflow in browser..."
        Start-Process $run.url
        Write-Success "Browser opened"
        Write-Host ""
    }
    
    # Wait for completion if requested
    if ($Wait) {
        Write-Header "Waiting for Workflow Completion"
        Write-InfoMsg "Press Ctrl+C to stop waiting (workflow will continue running)"
        Write-Host ""
        
        $maxWaitTime = 300  # 5 minutes
        $waitInterval = 5   # 5 seconds
        $elapsed = 0
        
        while ($elapsed -lt $maxWaitTime) {
            $runJson = gh run list --workflow=codex-write.yml --limit 1 --json status,conclusion 2>&1
            $run = $runJson | ConvertFrom-Json | Select-Object -First 1
            
            if ($run.status -eq 'completed') {
                Write-Host ""
                if ($run.conclusion -eq 'success') {
                    Write-Success "Workflow completed successfully!"
                } elseif ($run.conclusion -eq 'failure') {
                    Write-ErrorMsg "Workflow failed!"
                } else {
                    Write-ColorOutput "Workflow completed with conclusion: $($run.conclusion)" -Color Yellow
                }
                break
            }
            
            Write-Host "." -NoNewline
            Start-Sleep -Seconds $waitInterval
            $elapsed += $waitInterval
        }
        
        if ($elapsed -ge $maxWaitTime) {
            Write-Host ""
            Write-ColorOutput "⏱ Timeout reached. Workflow is still running." -Color Yellow
            Write-InfoMsg "Check status at: $($run.url)"
        }
        
        Write-Host ""
    }
    
    # Show next steps
    Write-Header "Next Steps"
    Write-InfoMsg "View workflow logs:"
    Write-ColorOutput "  gh run view $($run.databaseId)" -Color Gray
    Write-Host ""
    Write-InfoMsg "View workflow output:"
    Write-ColorOutput "  gh run view $($run.databaseId) --log" -Color Gray
    Write-Host ""
    Write-InfoMsg "List all runs:"
    Write-ColorOutput "  gh run list --workflow=codex-write.yml" -Color Gray
    Write-Host ""
    Write-InfoMsg "Check updated files:"
    Write-ColorOutput "  git pull" -Color Gray
    Write-ColorOutput "  cat docs/architecture/adham-agritech-vision.md" -Color Gray
    Write-Host ""
    
    Write-Success "Done!"
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-ErrorMsg "An error occurred: $_"
    Write-Host ""
    Write-InfoMsg "For help, see: CODEX_WRITE_GUIDE.md"
    exit 1
}
