// ===========================================
// Adham AgriTech - Feature Badge Component
// ===========================================

"use client"

import React, { useMemo } from "react"
import {
  FeatureBadgeProps,
  FEATURE_STATUS_CONFIG,
  FEATURE_CATEGORY_CONFIG,
  type FeatureInfo,
} from "@/lib/domain/types/feature-status"
import { useTranslation } from "@/lib/i18n/use-language"

export const FeatureBadge: React.FC<FeatureBadgeProps> = ({
  status,
  category,
  showIcon = true,
  showText = true,
  size = 'md',
  className = ''
}) => {
  const statusConfig = FEATURE_STATUS_CONFIG[status];
  const categoryConfig = category ? FEATURE_CATEGORY_CONFIG[category] : null;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${statusConfig.bgColor} ${statusConfig.color} ${className}`}>
      {showIcon && (
        <span className={iconSizeClasses[size]}>
          {statusConfig.icon}
        </span>
      )}
      {showText && (
        <span className="font-medium">
          {statusConfig.label}
        </span>
      )}
      {category && categoryConfig && (
        <>
          <span className="text-gray-400 dark:text-gray-500">•</span>
          <span className={iconSizeClasses[size]}>
            {categoryConfig.icon}
          </span>
          <span className="text-xs opacity-75">
            {categoryConfig.label}
          </span>
        </>
      )}
    </div>
  );
};

// مكون لعرض معلومات الميزة
interface FeatureInfoProps {
  featureId: string;
  showDescription?: boolean;
  showRequirements?: boolean;
  showLimitations?: boolean;
  showMeta?: boolean;
  className?: string;
}

export const FeatureInfoCard: React.FC<FeatureInfoProps> = ({
  featureId,
  showDescription = true,
  showRequirements = false,
  showLimitations = false,
  showMeta = true,
  className = ''
}) => {
  const { PLATFORM_FEATURES } = require('@/lib/domain/types/feature-status');
  const feature = PLATFORM_FEATURES[featureId];
  const { language, t } = useTranslation();

  if (!feature) {
    return (
      <div className={`text-red-500 text-sm ${className}`}>
        Feature not found: {featureId}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-lg">{feature.name}</h3>
        <FeatureBadge 
          status={feature.status} 
          category={feature.category}
          size="sm"
        />
      </div>
      
      {showDescription && (
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {feature.description}
        </p>
      )}

      {showRequirements && feature.requirements.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">
            Requirements:
          </h4>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {feature.requirements.map((req: string, index: number) => (
              <li key={index} className="flex items-center gap-1">
                <span className="text-green-500">✓</span>
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showLimitations && feature.limitations.length > 0 && (
        <div>
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-1">
            Limitations:
          </h4>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {feature.limitations.map((limitation: string, index: number) => (
              <li key={index} className="flex items-center gap-1">
                <span className="text-yellow-500">⚠</span>
                {limitation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showMeta && (
        <FeatureMeta
          version={feature.version}
          lastUpdated={feature.lastUpdated}
          supportLevel={feature.supportLevel}
          language={language}
        />
      )}
    </div>
  );
};

interface FeatureMetaProps {
  version: string
  lastUpdated: string
  supportLevel: FeatureInfo["supportLevel"]
  language: string
}

const SUPPORT_LABELS: Record<FeatureInfo["supportLevel"], { en: string; ar: string }> = {
  full: {
    en: "Full support",
    ar: "دعم كامل",
  },
  limited: {
    en: "Limited support",
    ar: "دعم محدود",
  },
  community: {
    en: "Community support",
    ar: "دعم المجتمع",
  },
  none: {
    en: "No support",
    ar: "بدون دعم",
  },
}

function FeatureMeta({ version, lastUpdated, supportLevel, language }: FeatureMetaProps) {
  const formatter = useMemo(() => {
    try {
      return new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-US", {
        dateStyle: "long",
        timeStyle: "short",
      })
    } catch {
      return new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" })
    }
  }, [language])

  const formattedDate = useMemo(() => {
    try {
      return formatter.format(new Date(lastUpdated))
    } catch {
      return lastUpdated
    }
  }, [formatter, lastUpdated])

  const support = SUPPORT_LABELS[supportLevel] ?? SUPPORT_LABELS.full
  const supportLabel = language === "ar" ? support.ar : support.en

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
      <span>{language === "ar" ? `الإصدار ${version}` : `v${version}`}</span>
      <span>
        {language === "ar" ? "آخر تحديث:" : "Updated:"} {formattedDate}
      </span>
      <span>{supportLabel}</span>
    </div>
  )
}

// مكون لعرض قائمة الميزات
interface FeatureListProps {
  category?: 'core' | 'advanced' | 'experimental' | 'premium';
  status?: 'production' | 'beta' | 'alpha' | 'development' | 'planned';
  showAll?: boolean;
  className?: string;
}

export const FeatureList: React.FC<FeatureListProps> = ({
  category,
  status,
  showAll = false,
  className = ''
}) => {
  const { PLATFORM_FEATURES } = require('@/lib/domain/types/feature-status');
  const features = (Object.values(PLATFORM_FEATURES) as FeatureInfo[]).filter((feature: FeatureInfo) => {
    if (showAll) return true;
    if (category && feature.category !== category) return false;
    if (status && feature.status !== status) return false;
    return true;
  });

  return (
    <div className={`space-y-4 ${className}`}>
      {features.map((feature: FeatureInfo) => (
        <FeatureInfoCard
          key={feature.id}
          featureId={feature.id}
          showDescription={true}
          showRequirements={true}
          showLimitations={true}
        />
      ))}
    </div>
  );
};
