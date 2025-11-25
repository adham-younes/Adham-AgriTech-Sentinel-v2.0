# Monitor and Handle Vercel Deployment Workflow
# This script monitors the workflow, handles failures, and manages secrets

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Monitor & Handler" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get latest workflow run
Write-Host "[1/5] Checking latest workflow run..." -ForegroundColor Yellow
$runs = gh run list --workflow vercel-cli-deploy.yml --limit 1 --json databaseId,status,conclusion,createdAt | ConvertFrom-Json

if ($runs.Count -eq 0) {
    Write-Host "No workflow runs found. Triggering new run..." -ForegroundColor Yellow
    gh workflow run vercel-cli-deploy.yml --ref main
    Start-Sleep -Seconds 5
    $runs = gh run list --workflow vercel-cli-deploy.yml --limit 1 --json databaseId,status,conclusion,createdAt | ConvertFrom-Json
}

$runId = $runs[0].databaseId
$status = $runs[0].status
$conclusion = $runs[0].conclusion

Write-Host "Run ID: $runId" -ForegroundColor Cyan
Write-Host "Status: $status" -ForegroundColor Cyan
Write-Host "Conclusion: $conclusion" -ForegroundColor Cyan
Write-Host ""

# Step 2: Watch the workflow
Write-Host "[2/5] Watching workflow execution..." -ForegroundColor Yellow
Write-Host "Opening in browser and monitoring..." -ForegroundColor Cyan
gh run watch $runId --exit-status

$finalStatus = $LASTEXITCODE

Write-Host ""
if ($finalStatus -eq 0) {
    Write-Host "SUCCESS! Workflow completed successfully" -ForegroundColor Green
} else {
    Write-Host "FAILED! Workflow failed with exit code: $finalStatus" -ForegroundColor Red
    Write-Host ""
    Write-Host "Fetching logs..." -ForegroundColor Yellow
    gh run view $runId --log-failed
    Write-Host ""
    Write-Host "To retry, run: gh workflow run vercel-cli-deploy.yml --ref main" -ForegroundColor Yellow
    exit 1
}

# Step 3: Download artifacts
Write-Host ""
Write-Host "[3/5] Downloading deployment artifacts..." -ForegroundColor Yellow
$artifacts = gh run view $runId --json artifacts | ConvertFrom-Json

$reportArtifact = $artifacts.artifacts | Where-Object { $_.name -eq "async-postdeploy-report" }

if ($reportArtifact) {
    Write-Host "Found artifact: async-postdeploy-report" -ForegroundColor Green
    gh run download $runId --name async-postdeploy-report --dir ./deployment-reports
    Write-Host "Downloaded to: ./deployment-reports" -ForegroundColor Green
    
    # Display report
    if (Test-Path "./deployment-reports/postdeploy-report.txt") {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "Deployment Report" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Get-Content "./deployment-reports/postdeploy-report.txt"
    }
} else {
    Write-Host "No async-postdeploy-report artifact found" -ForegroundColor Yellow
}

# Step 4: Security cleanup
Write-Host ""
Write-Host "[4/5] Security Cleanup..." -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANT: The following files contain sensitive data:" -ForegroundColor Red
Write-Host "  - ALL_ENVIRONMENT_VARIABLES.env" -ForegroundColor Red
Write-Host "  - vercel.env" -ForegroundColor Red
Write-Host "  - vercel-import.env" -ForegroundColor Red
Write-Host "  - vercel-missing-vars.env" -ForegroundColor Red
Write-Host "  - upload-secrets-simple.ps1" -ForegroundColor Red
Write-Host "  - add-vercel-vars.ps1" -ForegroundColor Red
Write-Host ""
Write-Host "These files should be deleted after deployment." -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Delete sensitive files now? (y/n)"
if ($confirm -eq "y") {
    Write-Host "Deleting sensitive files..." -ForegroundColor Yellow
    
    $filesToDelete = @(
        "ALL_ENVIRONMENT_VARIABLES.env",
        "vercel.env",
        "vercel-import.env",
        "vercel-missing-vars.env",
        "upload-secrets-simple.ps1",
        "add-vercel-vars.ps1",
        "update-vercel-vars.ps1",
        "upload-all-secrets.ps1",
        ".env.check"
    )
    
    foreach ($file in $filesToDelete) {
        if (Test-Path $file) {
            Remove-Item $file -Force
            Write-Host "  Deleted: $file" -ForegroundColor Green
        }
    }
    
    Write-Host ""
    Write-Host "Sensitive files deleted!" -ForegroundColor Green
} else {
    Write-Host "Skipped deletion. Remember to delete these files manually!" -ForegroundColor Yellow
}

# Step 5: Key rotation reminder
Write-Host ""
Write-Host "[5/5] Security Recommendations..." -ForegroundColor Yellow
Write-Host ""
Write-Host "CRITICAL: Rotate the following API keys that were exposed:" -ForegroundColor Red
Write-Host "  1. OPENAI_API_KEY" -ForegroundColor Yellow
Write-Host "  2. GROQ_API_KEY" -ForegroundColor Yellow
Write-Host "  3. OPENWEATHER_API_KEY" -ForegroundColor Yellow
Write-Host "  4. NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN" -ForegroundColor Yellow
Write-Host "  5. ESD_CLIENT_SECRET" -ForegroundColor Yellow
Write-Host "  6. EOSDA_API_KEY" -ForegroundColor Yellow
Write-Host "  7. SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
Write-Host "  8. All Firebase keys" -ForegroundColor Yellow
Write-Host ""
Write-Host "After rotating keys:" -ForegroundColor Cyan
Write-Host "  1. Update GitHub Secrets: gh secret set <KEY_NAME>" -ForegroundColor Cyan
Write-Host "  2. Update Vercel Variables: vercel env add <KEY_NAME>" -ForegroundColor Cyan
Write-Host "  3. Update local .env.local" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Monitor Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
