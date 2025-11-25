# Check Workflow Status and Open in Browser

Write-Host "Checking workflow status..." -ForegroundColor Cyan
Write-Host ""

# Get the latest run
$run = gh run list --workflow vercel-cli-deploy.yml --limit 1 --json databaseId,status,conclusion,url | ConvertFrom-Json | Select-Object -First 1

if ($run) {
    Write-Host "Latest Run:" -ForegroundColor Yellow
    Write-Host "  ID: $($run.databaseId)" -ForegroundColor Cyan
    Write-Host "  Status: $($run.status)" -ForegroundColor Cyan
    Write-Host "  Conclusion: $($run.conclusion)" -ForegroundColor Cyan
    Write-Host "  URL: $($run.url)" -ForegroundColor Cyan
    Write-Host ""
    
    # Open in browser
    Write-Host "Opening in browser..." -ForegroundColor Yellow
    Start-Process $run.url
    
    Write-Host ""
    Write-Host "Check the browser for detailed error logs!" -ForegroundColor Green
} else {
    Write-Host "No workflow runs found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "To check GitHub Secrets:" -ForegroundColor Yellow
Write-Host "  gh secret list" -ForegroundColor Cyan
Write-Host ""
