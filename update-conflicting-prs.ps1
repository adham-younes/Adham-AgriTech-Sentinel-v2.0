#!/usr/bin/env pwsh
# سكريبت تحديث الفروع المتعارضة
# Update Conflicting PRs Script

param(
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"

function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-InfoMsg { Write-Host "ℹ️  $args" -ForegroundColor Cyan }
function Write-WarningMsg { Write-Host "⚠️  $args" -ForegroundColor Yellow }
function Write-ErrorMsg { Write-Host "❌ $args" -ForegroundColor Red }
function Write-Header { Write-Host "`n=== $args ===" -ForegroundColor Magenta }

Write-Header "تحديث الفروع المتعارضة - Update Conflicting Branches"

# حفظ الفرع الحالي
$currentBranch = git branch --show-current
Write-InfoMsg "الفرع الحالي: $currentBranch"

# تحديث main
Write-Header "تحديث main branch"
try {
    git checkout main
    git pull origin main
    Write-Success "تم تحديث main بنجاح"
} catch {
    Write-ErrorMsg "فشل تحديث main: $_"
    exit 1
}

# قائمة الفروع التي تحتاج تحديث
$prsToUpdate = @(
    @{Number=77; Branch="codex/fix-issues-with-smart-contract-service-and-blockchain-dashboard-page-1"},
    @{Number=76; Branch="codex/fix-issues-with-smart-contract-service-and-blockchain-dashboard-page"},
    @{Number=75; Branch="codex/fix-issues-with-smart-contract-service-and-blockchain-dashboard-page-2"},
    @{Number=73; Branch="codex/implement-satellite-index-retrieval-using-copernicus-process-api"},
    @{Number=72; Branch="codex/integrate-satellite-monitoring-data-from-copernicus"},
    @{Number=71; Branch="codex/implement-copernicus-raster-processing-for-satellite-imagery"},
    @{Number=70; Branch="codex/implement-user-field-context-in-ai-assistant"},
    @{Number=64; Branch="codex/create-new-rest-route-to-fetch-live-field-data-for-satellite-dashboard"},
    @{Number=56; Branch="codex/add-educational-section-to-dashboard"},
    @{Number=53; Branch="codex/refactor-dashboard-and-remove-billing-paywall"},
    @{Number=52; Branch="codex/implement-ndvi-analysis-and-crop-health-monitoring"},
    @{Number=50; Branch="codex/add-bilingual-knowledge-hub-to-dashboard"},
    @{Number=48; Branch="codex/retire-billing-stack-and-simplify-dashboard"},
    @{Number=46; Branch="codex/refocus-on-field-data-hub-architecture"},
    @{Number=44; Branch="codex/add-field-data-hub-orchestrator"}
)

$stats = @{
    Total = $prsToUpdate.Count
    Updated = 0
    Failed = 0
    Skipped = 0
}

foreach ($pr in $prsToUpdate) {
    Write-Header "معالجة PR #$($pr.Number)"
    
    try {
        # فحص إذا كان الفرع موجود محلياً
        $branchExists = git branch --list $pr.Branch
        
        if (-not $branchExists) {
            Write-InfoMsg "جلب الفرع من remote..."
            if (-not $DryRun) {
                git fetch origin $pr.Branch`:$pr.Branch
            }
        }
        
        if (-not $DryRun) {
            # الانتقال للفرع
            Write-InfoMsg "الانتقال للفرع $($pr.Branch)..."
            git checkout $pr.Branch
            
            # محاولة rebase
            Write-InfoMsg "محاولة rebase مع main..."
            $rebaseResult = git rebase main 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "تم rebase بنجاح!"
                
                # دفع التحديثات
                Write-InfoMsg "دفع التحديثات..."
                git push --force-with-lease origin $pr.Branch
                
                Write-Success "تم تحديث PR #$($pr.Number) بنجاح!"
                $stats.Updated++
            } else {
                Write-WarningMsg "تعارضات في PR #$($pr.Number)"
                Write-InfoMsg "إلغاء rebase..."
                git rebase --abort
                
                Write-WarningMsg "يحتاج حل يدوي - سيتم تخطيه"
                $stats.Skipped++
                
                # العودة لـ main
                git checkout main
            }
        } else {
            Write-InfoMsg "[DRY RUN] سيتم تحديث PR #$($pr.Number)"
            $stats.Updated++
        }
        
    } catch {
        Write-ErrorMsg "فشل تحديث PR #$($pr.Number): $_"
        $stats.Failed++
        
        # محاولة العودة لـ main
        try {
            git checkout main
        } catch {}
    }
    
    Start-Sleep -Seconds 1
}

# العودة للفرع الأصلي
Write-Header "العودة للفرع الأصلي"
try {
    git checkout $currentBranch
    Write-Success "تم العودة لـ $currentBranch"
} catch {
    Write-WarningMsg "فشل العودة للفرع الأصلي، أنت الآن على main"
}

# النتائج
Write-Header "النتائج النهائية"
Write-Host ""
Write-Host "📊 الإحصائيات:" -ForegroundColor Cyan
Write-Host "  إجمالي PRs: $($stats.Total)" -ForegroundColor White
Write-Success "  تم التحديث: $($stats.Updated)"
Write-ErrorMsg "  فشل: $($stats.Failed)"
Write-WarningMsg "  تم التخطي (تعارضات): $($stats.Skipped)"
Write-Host ""

if ($stats.Skipped -gt 0) {
    Write-Header "PRs تحتاج حل يدوي"
    Write-WarningMsg "الفروع التالية بها تعارضات وتحتاج حل يدوي:"
    Write-InfoMsg "استخدم الأوامر التالية لكل فرع:"
    Write-Host ""
    Write-Host "  git checkout <branch-name>" -ForegroundColor Yellow
    Write-Host "  git rebase main" -ForegroundColor Yellow
    Write-Host "  # حل التعارضات يدوياً" -ForegroundColor Yellow
    Write-Host "  git add ." -ForegroundColor Yellow
    Write-Host "  git rebase --continue" -ForegroundColor Yellow
    Write-Host "  git push --force-with-lease" -ForegroundColor Yellow
    Write-Host ""
}

Write-Header "الخطوات التالية"
Write-InfoMsg "1. حل التعارضات اليدوية للـ PRs المتبقية"
Write-InfoMsg "2. قم بتشغيل merge-all-prs.ps1 لدمج الـ PRs المحدثة"
Write-InfoMsg "3. اختبر التطبيق على Vercel"
Write-Host ""

if ($DryRun) {
    Write-WarningMsg "كان هذا وضع التجربة - لم يتم تحديث أي شيء فعلياً"
    Write-InfoMsg "لتنفيذ التحديث الفعلي، قم بتشغيل السكريبت بدون -DryRun"
}
