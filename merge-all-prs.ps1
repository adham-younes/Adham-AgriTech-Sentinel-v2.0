#!/usr/bin/env pwsh
# سكريبت دمج جميع PRs بشكل منظم وآمن
# Merge All PRs Script - Safe and Organized

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

$ErrorActionPreference = "Continue"

# الألوان
function Write-Success { Write-Host "✅ $args" -ForegroundColor Green }
function Write-InfoMsg { Write-Host "ℹ️  $args" -ForegroundColor Cyan }
function Write-WarningMsg { Write-Host "⚠️  $args" -ForegroundColor Yellow }
function Write-ErrorMsg { Write-Host "❌ $args" -ForegroundColor Red }
function Write-Header { Write-Host "`n=== $args ===" -ForegroundColor Magenta }

# إحصائيات
$stats = @{
    Total = 0
    Merged = 0
    Failed = 0
    Skipped = 0
}

Write-Header "بدء عملية دمج PRs - Starting PR Merge Process"

if ($DryRun) {
    Write-WarningMsg "وضع التجربة - Dry Run Mode (لن يتم الدمج فعلياً)"
}

# المرحلة 1: GitHub Actions Dependencies (الأكثر أماناً)
Write-Header "المرحلة 1: GitHub Actions Dependencies"
$actionsPRs = @(20, 19, 16)

foreach ($pr in $actionsPRs) {
    $stats.Total++
    Write-InfoMsg "معالجة PR #$pr..."
    
    try {
        # فحص حالة PR
        $prInfo = gh pr view $pr --json mergeable,mergeStateStatus,title | ConvertFrom-Json
        Write-InfoMsg "العنوان: $($prInfo.title)"
        Write-InfoMsg "الحالة: $($prInfo.mergeStateStatus) | قابل للدمج: $($prInfo.mergeable)"
        
        if ($prInfo.mergeable -eq "MERGEABLE" -or $Force) {
            if (-not $DryRun) {
                Write-InfoMsg "محاولة الدمج..."
                gh pr merge $pr --merge --auto
                Write-Success "تم دمج PR #$pr بنجاح!"
                $stats.Merged++
                Start-Sleep -Seconds 2
            } else {
                Write-InfoMsg "[DRY RUN] سيتم دمج PR #$pr"
                $stats.Merged++
            }
        } else {
            Write-WarningMsg "PR #$pr غير قابل للدمج حالياً - سيتم تخطيه"
            $stats.Skipped++
        }
    } catch {
        Write-ErrorMsg "فشل دمج PR #$pr : $_"
        $stats.Failed++
    }
}

# المرحلة 2: NPM Dependencies (آمنة)
Write-Header "المرحلة 2: NPM Dependencies"
$npmPRs = @(41, 40, 28, 27, 26, 25, 24, 23, 22, 21)

foreach ($pr in $npmPRs) {
    $stats.Total++
    Write-InfoMsg "معالجة PR #$pr..."
    
    try {
        $prInfo = gh pr view $pr --json mergeable,mergeStateStatus,title | ConvertFrom-Json
        Write-InfoMsg "العنوان: $($prInfo.title)"
        
        if ($prInfo.mergeable -eq "MERGEABLE" -or $prInfo.mergeable -eq "UNKNOWN") {
            if (-not $DryRun) {
                Write-InfoMsg "محاولة الدمج..."
                gh pr merge $pr --merge --auto
                Write-Success "تم دمج PR #$pr بنجاح!"
                $stats.Merged++
                Start-Sleep -Seconds 2
            } else {
                Write-InfoMsg "[DRY RUN] سيتم دمج PR #$pr"
                $stats.Merged++
            }
        } else {
            Write-WarningMsg "PR #$pr غير قابل للدمج - سيتم تخطيه"
            $stats.Skipped++
        }
    } catch {
        Write-ErrorMsg "فشل دمج PR #$pr : $_"
        $stats.Failed++
    }
}

# المرحلة 3: Bug Fixes والتحسينات الصغيرة
Write-Header "المرحلة 3: Bug Fixes والتحسينات"
$bugfixPRs = @(35, 32, 31, 42, 14)

foreach ($pr in $bugfixPRs) {
    $stats.Total++
    Write-InfoMsg "معالجة PR #$pr..."
    
    try {
        $prInfo = gh pr view $pr --json mergeable,mergeStateStatus,title | ConvertFrom-Json
        Write-InfoMsg "العنوان: $($prInfo.title)"
        
        if ($prInfo.mergeable -eq "MERGEABLE" -or $prInfo.mergeable -eq "UNKNOWN") {
            if (-not $DryRun) {
                Write-InfoMsg "محاولة الدمج..."
                gh pr merge $pr --merge --auto
                Write-Success "تم دمج PR #$pr بنجاح!"
                $stats.Merged++
                Start-Sleep -Seconds 3
            } else {
                Write-InfoMsg "[DRY RUN] سيتم دمج PR #$pr"
                $stats.Merged++
            }
        } else {
            Write-WarningMsg "PR #$pr غير قابل للدمج - سيتم تخطيه"
            $stats.Skipped++
        }
    } catch {
        Write-ErrorMsg "فشل دمج PR #$pr : $_"
        $stats.Failed++
    }
}

# المرحلة 4: AI Improvements
Write-Header "المرحلة 4: AI Improvements"
$aiPRs = @(77, 70, 39)

foreach ($pr in $aiPRs) {
    $stats.Total++
    Write-InfoMsg "معالجة PR #$pr..."
    
    try {
        $prInfo = gh pr view $pr --json mergeable,mergeStateStatus,title | ConvertFrom-Json
        Write-InfoMsg "العنوان: $($prInfo.title)"
        
        if ($prInfo.mergeable -eq "MERGEABLE" -or ($prInfo.mergeable -eq "UNKNOWN" -and $Force)) {
            if (-not $DryRun) {
                Write-WarningMsg "هذا PR يحتوي على تغييرات AI - تأكد من المراجعة"
                Write-InfoMsg "محاولة الدمج..."
                gh pr merge $pr --merge --auto
                Write-Success "تم دمج PR #$pr بنجاح!"
                $stats.Merged++
                Start-Sleep -Seconds 3
            } else {
                Write-InfoMsg "[DRY RUN] سيتم دمج PR #$pr"
                $stats.Merged++
            }
        } else {
            Write-WarningMsg "PR #$pr غير قابل للدمج - سيتم تخطيه"
            $stats.Skipped++
        }
    } catch {
        Write-ErrorMsg "فشل دمج PR #$pr : $_"
        $stats.Failed++
    }
}

# المرحلة 5: Satellite Features
Write-Header "المرحلة 5: Satellite Features"
$satellitePRs = @(76, 75, 73, 72, 71, 64)

foreach ($pr in $satellitePRs) {
    $stats.Total++
    Write-InfoMsg "معالجة PR #$pr..."
    
    try {
        $prInfo = gh pr view $pr --json mergeable,mergeStateStatus,title | ConvertFrom-Json
        Write-InfoMsg "العنوان: $($prInfo.title)"
        
        if ($prInfo.mergeable -eq "MERGEABLE" -or ($prInfo.mergeable -eq "UNKNOWN" -and $Force)) {
            if (-not $DryRun) {
                Write-WarningMsg "هذا PR يحتوي على ميزات Satellite - تأكد من المراجعة"
                Write-InfoMsg "محاولة الدمج..."
                gh pr merge $pr --merge --auto
                Write-Success "تم دمج PR #$pr بنجاح!"
                $stats.Merged++
                Start-Sleep -Seconds 3
            } else {
                Write-InfoMsg "[DRY RUN] سيتم دمج PR #$pr"
                $stats.Merged++
            }
        } else {
            Write-WarningMsg "PR #$pr غير قابل للدمج - سيتم تخطيه"
            $stats.Skipped++
        }
    } catch {
        Write-ErrorMsg "فشل دمج PR #$pr : $_"
        $stats.Failed++
    }
}

# المرحلة 6: Major Features (بحذر)
Write-Header "المرحلة 6: Major Features (يتطلب مراجعة دقيقة)"
$majorPRs = @(56, 50, 46, 44, 36, 30)

Write-WarningMsg "الميزات الكبيرة تحتاج مراجعة يدوية - سيتم تخطيها في الوضع الآلي"
Write-InfoMsg "يُنصح بمراجعة هذه PRs يدوياً: $($majorPRs -join ', ')"

foreach ($pr in $majorPRs) {
    $stats.Total++
    $stats.Skipped++
}

# إغلاق PRs القديمة/المكررة
Write-Header "المرحلة 7: إغلاق PRs القديمة"
$oldPRs = @(1, 2, 4, 5, 6, 7, 8, 12)

Write-InfoMsg "PRs قديمة يُنصح بإغلاقها: $($oldPRs -join ', ')"
Write-InfoMsg "استخدم: gh pr close <number> لإغلاقها يدوياً"

# النتائج النهائية
Write-Header "النتائج النهائية - Final Results"
Write-Host ""
Write-Host "📊 الإحصائيات:" -ForegroundColor Cyan
Write-Host "  إجمالي PRs: $($stats.Total)" -ForegroundColor White
Write-Success "  تم الدمج: $($stats.Merged)"
Write-ErrorMsg "  فشل: $($stats.Failed)"
Write-WarningMsg "  تم التخطي: $($stats.Skipped)"
Write-Host ""

$successRate = [math]::Round(($stats.Merged / $stats.Total) * 100, 2)
Write-Host "✨ معدل النجاح: $successRate%" -ForegroundColor $(if ($successRate -gt 70) { "Green" } elseif ($successRate -gt 40) { "Yellow" } else { "Red" })

Write-Host ""
Write-Header "الخطوات التالية"
Write-InfoMsg "1. راجع الـ PRs التي فشلت أو تم تخطيها"
Write-InfoMsg "2. قم بعمل rebase للفروع المتعارضة"
Write-InfoMsg "3. اختبر التطبيق على Vercel"
Write-InfoMsg "4. راجع الميزات الكبيرة يدوياً (#52, #56, #46)"
Write-Host ""

if ($DryRun) {
    Write-WarningMsg "كان هذا وضع التجربة - لم يتم دمج أي شيء فعلياً"
    Write-InfoMsg "لتنفيذ الدمج الفعلي، قم بتشغيل السكريبت بدون -DryRun"
}
