// ===========================================
// Adham AgriTech - Feature Status Types
// ===========================================

export type FeatureStatus = 'production' | 'beta' | 'alpha' | 'development' | 'planned';
export type FeatureCategory = 'core' | 'advanced' | 'experimental' | 'premium';

export interface FeatureInfo {
  id: string;
  name: string;
  description: string;
  status: FeatureStatus;
  category: FeatureCategory;
  version: string;
  lastUpdated: string;
  requirements: string[];
  limitations: string[];
  documentation?: string;
  supportLevel: 'full' | 'limited' | 'community' | 'none';
}

export interface FeatureBadgeProps {
  status: FeatureStatus;
  category?: FeatureCategory;
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const FEATURE_STATUS_CONFIG: Record<FeatureStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
}> = {
  production: {
    label: 'Production Ready',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/20',
    icon: '✅',
    description: 'Fully tested and ready for production use'
  },
  beta: {
    label: 'Beta',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    icon: '🧪',
    description: 'Testing phase - may have bugs or limitations'
  },
  alpha: {
    label: 'Alpha',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    icon: '⚠️',
    description: 'Early development - unstable and incomplete'
  },
  development: {
    label: 'In Development',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    icon: '🚧',
    description: 'Currently being developed'
  },
  planned: {
    label: 'Planned',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-900/20',
    icon: '📋',
    description: 'Planned for future release'
  }
};

export const FEATURE_CATEGORY_CONFIG: Record<FeatureCategory, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  core: {
    label: 'Core Feature',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    icon: '⭐'
  },
  advanced: {
    label: 'Advanced Feature',
    color: 'text-indigo-600 dark:text-indigo-400',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
    icon: '🔬'
  },
  experimental: {
    label: 'Experimental',
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/20',
    icon: '🧪'
  },
  premium: {
    label: 'Premium Feature',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/20',
    icon: '💎'
  }
};

const now = new Date();
const toIsoDateTime = (date: Date) => date.toISOString();
const daysAgo = (days: number) => {
  const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return toIsoDateTime(d);
};

// قائمة الميزات مع حالاتها
export const PLATFORM_FEATURES: Record<string, FeatureInfo> = {
  // الميزات الأساسية
  'dashboard': {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Main dashboard with overview and statistics',
    status: 'production',
    category: 'core',
    version: '1.0.0',
    lastUpdated: daysAgo(0),
    requirements: [],
    limitations: [],
    supportLevel: 'full'
  },
  'farms-management': {
    id: 'farms-management',
    name: 'Farms Management',
    description: 'Create and manage farms',
    status: 'production',
    category: 'core',
    version: '1.0.0',
    lastUpdated: daysAgo(1),
    requirements: ['Supabase'],
    limitations: [],
    supportLevel: 'full'
  },
  'fields-management': {
    id: 'fields-management',
    name: 'Fields Management',
    description: 'Create and manage fields within farms',
    status: 'production',
    category: 'core',
    version: '1.0.0',
    lastUpdated: daysAgo(2),
    requirements: ['Supabase'],
    limitations: [],
    supportLevel: 'full'
  },
  'weather-data': {
    id: 'weather-data',
    name: 'Weather Data',
    description: 'Real-time weather data and forecasts',
    status: 'production',
    category: 'core',
    version: '1.0.0',
    lastUpdated: daysAgo(0),
    requirements: ['OpenWeather API'],
    limitations: ['Limited to 1000 calls/day'],
    supportLevel: 'full'
  },
  'ai-assistant': {
    id: 'ai-assistant',
    name: 'AI Assistant',
    description: 'AI-powered agricultural assistant',
    status: 'production',
    category: 'core',
    version: '1.0.0',
    lastUpdated: daysAgo(0),
    requirements: ['OpenAI API'],
    limitations: ['Rate limited'],
    supportLevel: 'full'
  },

  // الميزات المتقدمة
  'satellite-imagery': {
    id: 'satellite-imagery',
    name: 'Satellite Imagery',
    description: 'Satellite maps and NDVI analysis',
    status: 'beta',
    category: 'advanced',
    version: '0.9.0',
    lastUpdated: daysAgo(3),
    requirements: ['EOSDA API', 'ESD API'],
    limitations: ['Limited resolution', 'Cloud coverage issues'],
    supportLevel: 'limited'
  },
  'irrigation-optimization': {
    id: 'irrigation-optimization',
    name: 'Irrigation Optimization',
    description: 'AI-powered irrigation recommendations',
    status: 'beta',
    category: 'advanced',
    version: '0.8.0',
    lastUpdated: daysAgo(5),
    requirements: ['Soil sensors', 'Weather data'],
    limitations: ['Requires sensor data'],
    supportLevel: 'limited'
  },
  'crop-monitoring': {
    id: 'crop-monitoring',
    name: 'Crop Monitoring',
    description: 'Advanced crop health monitoring',
    status: 'beta',
    category: 'advanced',
    version: '0.7.0',
    lastUpdated: daysAgo(4),
    requirements: ['Satellite data', 'Weather data', 'NDVI analytics'],
    limitations: ['Limited to certain crops'],
    supportLevel: 'limited'
  },
  'agronomy-intelligence': {
    id: 'agronomy-intelligence',
    name: 'Agronomy Intelligence',
    description: 'Predictive insights from sensors, satellite, and AI models',
    status: 'beta',
    category: 'advanced',
    version: '0.9.0',
    lastUpdated: daysAgo(2),
    requirements: ['Sensor telemetry', 'Weather service', 'EOSDA API'],
    limitations: ['Requires calibrated devices', 'Satellite refresh subject to cloud cover'],
    supportLevel: 'limited'
  },
  'marketplace': {
    id: 'marketplace',
    name: 'Marketplace',
    description: 'Buy and sell agricultural products',
    status: 'development',
    category: 'premium',
    version: '0.3.0',
    lastUpdated: daysAgo(10),
    requirements: ['Payment gateway', 'User verification'],
    limitations: ['Demo data only'],
    supportLevel: 'none'
  },
  'advanced-reports': {
    id: 'advanced-reports',
    name: 'Advanced Reports',
    description: 'Comprehensive reporting and analytics',
    status: 'beta',
    category: 'advanced',
    version: '0.9.0',
    lastUpdated: daysAgo(6),
    requirements: ['Data aggregation'],
    limitations: ['Limited export formats'],
    supportLevel: 'limited'
  },
  'mobile-app': {
    id: 'mobile-app',
  name: 'Mobile App',
  description: 'Native mobile application',
  status: 'planned',
  category: 'premium',
  version: '0.0.0',
  lastUpdated: daysAgo(12),
    requirements: ['React Native', 'App store approval'],
    limitations: ['Not available yet'],
    supportLevel: 'none'
  }
};
