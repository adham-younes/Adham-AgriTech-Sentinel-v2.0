# CODEx Write Workflow Guide

## Overview

The `codex-write` workflow enables automated documentation updates to your repository. It's designed to allow CODEx or other automation tools to safely commit and push changes.

## Features

✅ **Safe Git Operations** - Uses Personal Access Token (PAT) for authentication  
✅ **Input Options** - Choose what type of update to perform  
✅ **Validation** - Checks files before committing  
✅ **Skip CI** - Prevents infinite workflow loops with `[skip ci]`  
✅ **Summary Reports** - Provides detailed execution summaries  

## Prerequisites

### 1. Create a Personal Access Token (PAT)

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Configure the token:
   - **Name:** `CODEX_PAT`
   - **Expiration:** 90 days (or as needed)
   - **Scopes:** Select:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `workflow` (Update GitHub Action workflows)

4. Click "Generate token" and **copy the token immediately**

### 2. Add Token to Repository Secrets

```powershell
# Using GitHub CLI
gh secret set CODEX_PAT

# Or manually:
# 1. Go to your repository on GitHub
# 2. Settings → Secrets and variables → Actions
# 3. Click "New repository secret"
# 4. Name: CODEX_PAT
# 5. Value: Paste your token
# 6. Click "Add secret"
```

### 3. Verify Secret

```powershell
gh secret list
```

You should see `CODEX_PAT` in the list.

## Usage

### Method 1: GitHub Web Interface

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select **codex-write** workflow from the left sidebar
4. Click **Run workflow** button
5. Select the update type:
   - `vision` - Updates the vision document
   - `architecture` - Updates architecture docs
   - `documentation` - Updates general documentation
6. Click **Run workflow**

### Method 2: GitHub CLI

```powershell
# Update vision document
gh workflow run codex-write.yml -f update_type=vision

# Update architecture
gh workflow run codex-write.yml -f update_type=architecture

# Check workflow status
gh run list --workflow=codex-write.yml --limit 5

# View latest run
gh run view
```

### Method 3: PowerShell Script

Create a helper script `run-codex-write.ps1`:

```powershell
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('vision', 'architecture', 'documentation')]
    [string]$UpdateType = 'vision'
)

Write-Host "🤖 Running CODEx Write Workflow..." -ForegroundColor Cyan
Write-Host "Update Type: $UpdateType" -ForegroundColor Yellow
Write-Host ""

# Trigger workflow
gh workflow run codex-write.yml -f update_type=$UpdateType

Write-Host "✓ Workflow triggered successfully!" -ForegroundColor Green
Write-Host ""

# Wait a moment for the run to register
Start-Sleep -Seconds 3

# Get the latest run
Write-Host "Fetching run status..." -ForegroundColor Cyan
$run = gh run list --workflow=codex-write.yml --limit 1 --json databaseId,status,conclusion,url | ConvertFrom-Json | Select-Object -First 1

if ($run) {
    Write-Host ""
    Write-Host "Latest Run Details:" -ForegroundColor Yellow
    Write-Host "  ID: $($run.databaseId)" -ForegroundColor White
    Write-Host "  Status: $($run.status)" -ForegroundColor White
    Write-Host "  URL: $($run.url)" -ForegroundColor Cyan
    Write-Host ""
    
    # Open in browser
    Write-Host "Opening workflow in browser..." -ForegroundColor Yellow
    Start-Process $run.url
}
```

Usage:
```powershell
# Run with default (vision)
.\run-codex-write.ps1

# Run with specific type
.\run-codex-write.ps1 -UpdateType architecture
```

## What Gets Updated

### Vision Document (`vision`)

Updates `docs/architecture/adham-agritech-vision.md` with:
- Platform vision and goals
- Technical architecture overview
- Current status and roadmap
- Timestamp and automation metadata

### Architecture (`architecture`)

Updates `docs/architecture/latest-update.md` with:
- Architecture change log
- Timestamp of update

### Documentation (`documentation`)

Reserved for future general documentation updates.

## Security Best Practices

### ✅ DO

- Use GitHub's `users.noreply.github.com` email for bot commits
- Set PAT expiration dates (90 days recommended)
- Use `[skip ci]` in commit messages to prevent loops
- Validate changes before committing
- Use `persist-credentials: false` in checkout

### ❌ DON'T

- Hardcode tokens in workflow files
- Use personal email addresses for bot commits
- Push to protected branches without proper permissions
- Commit sensitive information

## Troubleshooting

### Error: "Permission denied"

**Cause:** PAT doesn't have required permissions

**Solution:**
```powershell
# Check if secret exists
gh secret list

# If missing, add it
gh secret set CODEX_PAT
```

### Error: "refusing to allow a Personal Access Token to create or update workflow"

**Cause:** PAT lacks `workflow` scope

**Solution:** Recreate PAT with `workflow` scope enabled

### Error: "No changes to commit"

**Cause:** Files are already up to date

**Solution:** This is normal behavior, not an error

### Workflow doesn't trigger

**Solution:**
```powershell
# Check workflow file syntax
gh workflow view codex-write.yml

# List all workflows
gh workflow list

# Enable the workflow if disabled
gh workflow enable codex-write.yml
```

## Monitoring

### View Workflow Runs

```powershell
# List recent runs
gh run list --workflow=codex-write.yml --limit 10

# View specific run
gh run view <run-id>

# Watch a running workflow
gh run watch
```

### Check Commit History

```powershell
# View CODEx commits
git log --author="codex-bot" --oneline -10

# View changes in vision document
git log --follow docs/architecture/adham-agritech-vision.md
```

## Customization

### Add New Update Types

Edit `.github/workflows/codex-write.yml`:

```yaml
inputs:
  update_type:
    options:
      - vision
      - architecture
      - documentation
      - your_new_type  # Add here
```

Then add a corresponding step:

```yaml
- name: Update your new type
  if: github.event.inputs.update_type == 'your_new_type'
  run: |
    # Your update logic here
```

### Change Target Branch

To push to a different branch:

```yaml
- name: Commit and push changes
  run: |
    git push origin HEAD:your-branch-name  # Change 'main' to your branch
```

### Add Notifications

Add a notification step:

```yaml
- name: Notify on success
  if: success()
  run: |
    # Send notification (Slack, Discord, email, etc.)
```

## Integration with CODEx

To integrate with CODEx automation:

1. **Trigger from CODEx:**
   ```bash
   curl -X POST \
     -H "Accept: application/vnd.github+json" \
     -H "Authorization: Bearer $GITHUB_TOKEN" \
     https://api.github.com/repos/OWNER/REPO/actions/workflows/codex-write.yml/dispatches \
     -d '{"ref":"main","inputs":{"update_type":"vision"}}'
   ```

2. **Use in CI/CD Pipeline:**
   ```yaml
   - name: Trigger CODEx update
     run: gh workflow run codex-write.yml -f update_type=vision
   ```

## FAQ

**Q: Why use PAT instead of GITHUB_TOKEN?**  
A: `GITHUB_TOKEN` has limited permissions and cannot trigger other workflows or push to protected branches.

**Q: Can I run this workflow automatically?**  
A: Yes, add a schedule trigger:
```yaml
on:
  workflow_dispatch:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday
```

**Q: How do I prevent infinite loops?**  
A: The workflow uses `[skip ci]` in commit messages, which prevents triggering other workflows.

**Q: Can multiple people use this workflow?**  
A: Yes, the workflow is designed for team use. Each run is independent.

## Related Files

- `.github/workflows/codex-write.yml` - Main workflow file
- `.github/workflows/codex.yml` - Read-only validation workflow
- `docs/architecture/adham-agritech-vision.md` - Vision document
- `CODEX_COMMANDS.md` - CODEx command reference
- `CODEX_INTEGRATION_GUIDE.md` - Integration guide

## Support

For issues or questions:
1. Check workflow logs in GitHub Actions
2. Review this guide
3. Check `CODEX_INTEGRATION_GUIDE.md`
4. Open an issue on GitHub

---

**Last Updated:** 2025-01-02  
**Version:** 1.0.0  
**Maintained by:** Adham AgriTech Team
