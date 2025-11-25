# Test All Services - PowerShell Script
# This script tests all configured API services

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🧪 Adham AgriTech - Service Testing" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Change to project directory
Set-Location $PSScriptRoot

# Run the test script
Write-Host "Running tests..." -ForegroundColor Yellow
node scripts\test-all-services.js

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Test completed!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
