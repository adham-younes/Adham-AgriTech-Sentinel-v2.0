#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Setup script for CODEx PAT (Personal Access Token)

.DESCRIPTION
    This script helps you set up the CODEX_PAT secret required for the codex-write workflow.
    It guides you through creating a PAT and adding it to your repository.

.EXAMPLE
    .\setup-codex-pat.ps1
#>

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
    param(
        [int]$Number,
        [string]$Message
    )
    Write-Host ""
    Write-ColorOutput "[$Number] $Message" -Color Cyan
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

function Write-WarningMsg {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

Clear-Host
Write-Header "CODEx PAT Setup Wizard"

# Check GitHub CLI
Write-Step 1 "Checking GitHub CLI installation"
$ghVersion = gh --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-ErrorMsg "GitHub CLI (gh) is not installed!"
    Write-Host ""
    Write-InfoMsg "Please install GitHub CLI from: https://cli.github.com/"
    Write-Host ""
    Write-ColorOutput "After installation, run this script again." -Color Yellow
    exit 1
}
Write-Success "GitHub CLI is installed"
Write-ColorOutput "  Version: $($ghVersion -split "`n" | Select-Object -First 1)" -Color Gray

# Check authentication
Write-Step 2 "Checking GitHub authentication"
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-WarningMsg "Not authenticated with GitHub"
    Write-Host ""
    Write-InfoMsg "Launching GitHub authentication..."
    Write-Host ""
    
    gh auth login
    
    if ($LASTEXITCODE -ne 0) {
        Write-ErrorMsg "Authentication failed!"
        exit 1
    }
    
    Write-Success "Successfully authenticated!"
} else {
    Write-Success "Already authenticated with GitHub"
}

# Check if secret already exists
Write-Step 3 "Checking for existing CODEX_PAT secret"
$secrets = gh secret list 2>&1 | Out-String
if ($secrets -match "CODEX_PAT") {
    Write-WarningMsg "CODEX_PAT secret already exists!"
    Write-Host ""
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    
    if ($overwrite -ne 'y' -and $overwrite -ne 'Y') {
        Write-InfoMsg "Keeping existing secret. Setup cancelled."
        exit 0
    }
    Write-Host ""
}

# Instructions for creating PAT
Write-Header "Create Personal Access Token (PAT)"

Write-ColorOutput "You need to create a Personal Access Token with the following permissions:" -Color Yellow
Write-Host ""
Write-ColorOutput "Required Scopes:" -Color White
Write-ColorOutput "  ✓ repo (Full control of private repositories)" -Color Green
Write-ColorOutput "  ✓ workflow (Update GitHub Action workflows)" -Color Green
Write-Host ""

Write-InfoMsg "Opening GitHub token creation page in your browser..."
Write-Host ""

# Open PAT creation page
$tokenUrl = "https://github.com/settings/tokens/new?description=CODEX_PAT&scopes=repo,workflow"
Start-Process $tokenUrl

Write-Host ""
Write-ColorOutput "Follow these steps in your browser:" -Color Yellow
Write-Host ""
Write-ColorOutput "1. Set token name: CODEX_PAT" -Color White
Write-ColorOutput "2. Set expiration: 90 days (recommended)" -Color White
Write-ColorOutput "3. Select scopes:" -Color White
Write-ColorOutput "   ☑ repo" -Color Green
Write-ColorOutput "   ☑ workflow" -Color Green
Write-ColorOutput "4. Click 'Generate token'" -Color White
Write-ColorOutput "5. Copy the token (you won't see it again!)" -Color White
Write-Host ""

Write-WarningMsg "IMPORTANT: Copy the token before closing the browser tab!"
Write-Host ""

# Wait for user to create token
Read-Host "Press Enter when you have copied the token"

# Prompt for token
Write-Host ""
Write-Step 4 "Adding CODEX_PAT secret to repository"
Write-Host ""
Write-ColorOutput "Paste your Personal Access Token below:" -Color Yellow
Write-WarningMsg "The token will be hidden as you type"
Write-Host ""

# Read token securely
$token = Read-Host "Token" -AsSecureString
$tokenPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($token)
)

if ([string]::IsNullOrWhiteSpace($tokenPlain)) {
    Write-ErrorMsg "No token provided!"
    exit 1
}

# Validate token format (should start with ghp_)
if ($tokenPlain -notmatch '^ghp_[a-zA-Z0-9]+$') {
    Write-WarningMsg "Token format doesn't match expected pattern (ghp_...)"
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne 'y' -and $continue -ne 'Y') {
        Write-InfoMsg "Setup cancelled."
        exit 0
    }
}

# Add secret
Write-Host ""
Write-InfoMsg "Adding secret to repository..."
$tokenPlain | gh secret set CODEX_PAT

if ($LASTEXITCODE -ne 0) {
    Write-ErrorMsg "Failed to add secret!"
    exit 1
}

Write-Success "CODEX_PAT secret added successfully!"

# Verify secret
Write-Step 5 "Verifying secret"
$secrets = gh secret list 2>&1 | Out-String
if ($secrets -match "CODEX_PAT") {
    Write-Success "Secret verified!"
} else {
    Write-ErrorMsg "Secret verification failed!"
    exit 1
}

# Test workflow
Write-Host ""
Write-Header "Setup Complete!"

Write-Success "CODEX_PAT is configured and ready to use!"
Write-Host ""

Write-ColorOutput "Next Steps:" -Color Yellow
Write-Host ""
Write-ColorOutput "1. Test the workflow:" -Color White
Write-ColorOutput "   .\run-codex-write.ps1" -Color Gray
Write-Host ""
Write-ColorOutput "2. Or trigger manually:" -Color White
Write-ColorOutput "   gh workflow run codex-write.yml -f update_type=vision" -Color Gray
Write-Host ""
Write-ColorOutput "3. View workflow runs:" -Color White
Write-ColorOutput "   gh run list --workflow=codex-write.yml" -Color Gray
Write-Host ""

Write-InfoMsg "For more information, see: CODEX_WRITE_GUIDE.md"
Write-Host ""

# Ask if user wants to test now
$test = Read-Host "Do you want to test the workflow now? (y/N)"
if ($test -eq 'y' -or $test -eq 'Y') {
    Write-Host ""
    Write-InfoMsg "Launching test workflow..."
    Write-Host ""
    
    if (Test-Path ".\run-codex-write.ps1") {
        & ".\run-codex-write.ps1" -UpdateType vision
    } else {
        gh workflow run codex-write.yml -f update_type=vision
        Write-Success "Workflow triggered!"
        Write-InfoMsg "Check status with: gh run list --workflow=codex-write.yml"
    }
}

Write-Host ""
Write-Success "All done! 🎉"
Write-Host ""
