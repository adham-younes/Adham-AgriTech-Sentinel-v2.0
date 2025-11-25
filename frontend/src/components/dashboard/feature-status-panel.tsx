"use client"

// ===========================================
// Adham AgriTech - Feature Status Panel
// ===========================================

import React, { useState } from "react"
import { FeatureInfoCard } from "@/components/ui/feature-badge"
import { PLATFORM_FEATURES } from "@/lib/domain/types/feature-status"
import { useTranslation } from "@/lib/i18n/use-language"

interface FeatureStatusPanelProps {
  className?: string;
}

export const FeatureStatusPanel: React.FC<FeatureStatusPanelProps> = ({
  className = ''
}) => {
  const { t, language } = useTranslation();
  const isArabic = language === "ar"
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const categories = [
    { id: "all", label: t("common.all", { fallback: "All" }) },
    {
      id: "core",
      label: isArabic ? "الميزات الأساسية" : "Core capabilities",
    },
    {
      id: "advanced",
      label: isArabic ? "ميزات متقدمة" : "Advanced modules",
    },
    {
      id: "experimental",
      label: isArabic ? "ميزات تجريبية" : "Experimental",
    },
    {
      id: "premium",
      label: isArabic ? "ميزات متميزة" : "Premium",
    },
  ]

  const statuses = [
    { id: "all", label: t("common.all", { fallback: "All" }) },
    {
      id: "production",
      label: isArabic ? "جاهز للإنتاج" : "Production ready",
    },
    {
      id: "beta",
      label: isArabic ? "إصدار بيتا" : "Beta testing",
    },
    {
      id: "alpha",
      label: isArabic ? "إصدار ألفا" : "Alpha preview",
    },
    {
      id: "development",
      label: isArabic ? "قيد التطوير" : "In development",
    },
    {
      id: "planned",
      label: isArabic ? "مخطط" : "Planned",
    },
  ]

  const filteredFeatures = Object.values(PLATFORM_FEATURES).filter(feature => {
    if (selectedCategory !== 'all' && feature.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && feature.status !== selectedStatus) return false;
    return true;
  });

  const stats = {
    total: Object.keys(PLATFORM_FEATURES).length,
    production: Object.values(PLATFORM_FEATURES).filter(f => f.status === 'production').length,
    beta: Object.values(PLATFORM_FEATURES).filter(f => f.status === 'beta').length,
    alpha: Object.values(PLATFORM_FEATURES).filter(f => f.status === 'alpha').length,
    development: Object.values(PLATFORM_FEATURES).filter(f => f.status === 'development').length,
    planned: Object.values(PLATFORM_FEATURES).filter(f => f.status === 'planned').length
  };

  return (
    <div className={`bg-background rounded-lg border border-border p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {isArabic ? "حالة ميزات منصة Adham AgriTech" : "Adham AgriTech feature readiness"}
        </h2>
        <p className="text-muted-foreground">
          {isArabic
            ? "تابع تطور الميزات الأساسية والمتقدمة للتأكد من جاهزيتها قبل الإطلاق."
            : "Track the maturity of every core and advanced module before rollout."}
        </p>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.production}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            {isArabic ? "إنتاج" : "Production"}
          </div>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.beta}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            {isArabic ? "بيتا" : "Beta"}
          </div>
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900/20 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.alpha}
          </div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400">
            {isArabic ? "ألفا" : "Alpha"}
          </div>
        </div>
        <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats.development}
          </div>
          <div className="text-sm text-orange-600 dark:text-orange-400">
            {isArabic ? "تطوير" : "Development"}
          </div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-900/20 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {stats.planned}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {isArabic ? "مخطط" : "Planned"}
          </div>
        </div>
        <div className="bg-purple-100 dark:bg-purple-900/20 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.total}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">
            {isArabic ? "الإجمالي" : "Total"}
          </div>
        </div>
      </div>

      {/* فلاتر */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {isArabic ? "الفئة" : "Category"}
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {isArabic ? "الحالة" : "Status"}
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-background border border-border rounded-md px-3 py-2 text-sm"
          >
            {statuses.map(status => (
              <option key={status.id} value={status.id}>
                {status.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* قائمة الميزات */}
      <div className="space-y-4">
        {filteredFeatures.map(feature => (
          <div key={feature.id} className="border border-border rounded-lg p-4 space-y-4">
            <FeatureInfoCard
              featureId={feature.id}
              showDescription={true}
              showRequirements={true}
              showLimitations={true}
            />
            <p className="text-xs text-muted-foreground">
              {isArabic
                ? "جميع المستخدمين بإمكانهم تجربة هذه الميزة أثناء تعطيل الفوترة."
                : "All users can access this capability while billing is disabled."}
            </p>
          </div>
        ))}
      </div>

      {filteredFeatures.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {isArabic
            ? "لا توجد ميزات مطابقة للمعايير المختارة."
            : "No features match the current filters."}
        </div>
      )}
    </div>
  )
}
