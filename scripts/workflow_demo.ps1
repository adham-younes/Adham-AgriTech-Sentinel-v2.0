# workflow_demo.ps1
Write-Host "Starting Workflow Demo..." -ForegroundColor Green

Write-Host "1. Checking Node.js Version..." -ForegroundColor Cyan
node -v

Write-Host "2. Checking NPM Version..." -ForegroundColor Cyan
npm -v

Write-Host "3. Listing Critical Configuration Files..." -ForegroundColor Cyan
Get-ChildItem -Path . -Filter "*.json" | Select-Object Name, Length

Write-Host "4. Checking Environment Setup..." -ForegroundColor Cyan
if (Test-Path ".env.local") {
    Write-Host "   .env.local found." -ForegroundColor Green
} else {
    Write-Host "   .env.local NOT found." -ForegroundColor Red
}

Write-Host "Workflow Demo Completed Successfully!" -ForegroundColor Green
Write-Host "You only had to approve this script ONCE, but it ran 4 distinct operations." -ForegroundColor Yellow
