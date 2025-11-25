import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Droplets, 
  Leaf, 
  Thermometer, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Eye,
  Brain,
  Zap
} from 'lucide-react';

// Field health indicators interface
interface FieldHealthIndicators {
  ndvi: {
    value: number;
    status: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
    trend: 'up' | 'down' | 'stable';
    change: number;
    description: string;
  };
  chlorophyll: {
    value: number;
    status: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
    trend: 'up' | 'down' | 'stable';
    change: number;
    description: string;
  };
  soilMoisture: {
    value: number;
    status: 'optimal' | 'adequate' | 'low' | 'critical';
    trend: 'up' | 'down' | 'stable';
    change: number;
    description: string;
  };
  temperature: {
    value: number;
    status: 'optimal' | 'high' | 'low' | 'extreme';
    trend: 'up' | 'down' | 'stable';
    change: number;
    description: string;
  };
  overallHealth: {
    score: number;
    status: 'excellent' | 'good' | 'moderate' | 'poor' | 'critical';
    issues: string[];
    recommendations: string[];
  };
}

// Multi-language support
const translations = {
  en: {
    title: 'Revolutionary Field Health Indicators',
    ndvi: 'NDVI Index',
    chlorophyll: 'Chlorophyll Content',
    soilMoisture: 'Soil Moisture',
    temperature: 'Temperature',
    overallHealth: 'Overall Health',
    excellent: 'Excellent',
    good: 'Good',
    moderate: 'Moderate',
    poor: 'Poor',
    critical: 'Critical',
    optimal: 'Optimal',
    adequate: 'Adequate',
    low: 'Low',
    high: 'High',
    extreme: 'Extreme',
    up: 'Improving',
    down: 'Declining',
    stable: 'Stable',
    viewDetails: 'View Details',
    aiAnalysis: 'AI Analysis',
    recommendations: 'Recommendations',
    issues: 'Issues Detected',
    lastUpdated: 'Last Updated'
  },
  ar: {
    title: 'مؤشرات صحة الحقل الثورية',
    ndvi: 'مؤشر NDVI',
    chlorophyll: 'محتوى الكلوروفيل',
    soilMoisture: 'رطوبة التربة',
    temperature: 'درجة الحرارة',
    overallHealth: 'الصحة العامة',
    excellent: 'ممتاز',
    good: 'جيد',
    moderate: 'متوسط',
    poor: 'ضعيف',
    critical: 'حرج',
    optimal: 'مثالي',
    adequate: 'كافٍ',
    low: 'منخفض',
    high: 'مرتفع',
    extreme: 'شديد',
    up: 'تحسن',
    down: 'انخفاض',
    stable: 'مستقر',
    viewDetails: 'عرض التفاصيل',
    aiAnalysis: 'تحليل الذكاء الاصطناعي',
    recommendations: 'التوصيات',
    issues: 'المشكلات المكتشفة',
    lastUpdated: 'آخر تحديث'
  }
};

interface RevolutionaryFieldIndicatorsProps {
  fieldId: string;
  fieldName: string;
  language: 'en' | 'ar';
  onIndicatorClick?: (indicator: string, data: any) => void;
}

export default function RevolutionaryFieldIndicators({ 
  fieldId, 
  fieldName, 
  language,
  onIndicatorClick 
}: RevolutionaryFieldIndicatorsProps) {
  const t = translations[language];
  const [indicators, setIndicators] = useState<FieldHealthIndicators | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Simulate real-time data updates
  useEffect(() => {
    const generateIndicators = (): FieldHealthIndicators => {
      const ndviValue = 0.45 + Math.random() * 0.4; // 0.45-0.85
      const chlorophyllValue = 35 + Math.random() * 45; // 35-80 μg/cm²
      const soilMoistureValue = 15 + Math.random() * 70; // 15-85%
      const temperatureValue = 18 + Math.random() * 25; // 18-43°C

      // Determine NDVI status
      let ndviStatus: FieldHealthIndicators['ndvi']['status'];
      if (ndviValue > 0.7) ndviStatus = 'excellent';
      else if (ndviValue > 0.6) ndviStatus = 'good';
      else if (ndviValue > 0.4) ndviStatus = 'moderate';
      else if (ndviValue > 0.2) ndviStatus = 'poor';
      else ndviStatus = 'critical';

      // Determine chlorophyll status
      let chlorophyllStatus: FieldHealthIndicators['chlorophyll']['status'];
      if (chlorophyllValue > 60) chlorophyllStatus = 'excellent';
      else if (chlorophyllValue > 45) chlorophyllStatus = 'good';
      else if (chlorophyllValue > 30) chlorophyllStatus = 'moderate';
      else if (chlorophyllValue > 20) chlorophyllStatus = 'poor';
      else chlorophyllStatus = 'critical';

      // Determine soil moisture status
      let soilMoistureStatus: FieldHealthIndicators['soilMoisture']['status'];
      if (soilMoistureValue > 60) soilMoistureStatus = 'optimal';
      else if (soilMoistureValue > 40) soilMoistureStatus = 'adequate';
      else if (soilMoistureValue > 20) soilMoistureStatus = 'low';
      else soilMoistureStatus = 'critical';

      // Determine temperature status
      let temperatureStatus: FieldHealthIndicators['temperature']['status'];
      if (temperatureValue >= 22 && temperatureValue <= 32) temperatureStatus = 'optimal';
      else if (temperatureValue >= 18 && temperatureValue <= 38) temperatureStatus = temperatureValue > 35 ? 'high' : 'low';
      else temperatureStatus = 'extreme';

      // Calculate overall health score
      const ndviScore = ndviValue * 100;
      const chlorophyllScore = (chlorophyllValue / 80) * 100;
      const moistureScore = soilMoistureValue;
      const tempScore = temperatureStatus === 'optimal' ? 100 : 
                       temperatureStatus === 'high' || temperatureStatus === 'low' ? 60 : 30;
      
      const overallScore = (ndviScore * 0.3 + chlorophyllScore * 0.3 + moistureScore * 0.25 + tempScore * 0.15);

      let overallStatus: FieldHealthIndicators['overallHealth']['status'];
      if (overallScore > 85) overallStatus = 'excellent';
      else if (overallScore > 70) overallStatus = 'good';
      else if (overallScore > 50) overallStatus = 'moderate';
      else if (overallScore > 30) overallStatus = 'poor';
      else overallStatus = 'critical';

      const issues = [];
      const recommendations = [];

      if (ndviStatus === 'poor' || ndviStatus === 'critical') {
        issues.push(language === 'en' ? 'Low vegetation density' : 'كثافة نباتية منخفضة');
        recommendations.push(language === 'en' ? 'Consider fertilizer application' : 'فكر في تطبيق الأسمدة');
      }
      if (chlorophyllStatus === 'poor' || chlorophyllStatus === 'critical') {
        issues.push(language === 'en' ? 'Chlorophyll deficiency detected' : 'تم اكتشاف نقص الكلوروفيل');
        recommendations.push(language === 'en' ? 'Apply nitrogen-rich fertilizer' : 'تطبيق أسمدة غنية بالنيتروجين');
      }
      if (soilMoistureStatus === 'low' || soilMoistureStatus === 'critical') {
        issues.push(language === 'en' ? 'Soil moisture stress' : 'إجهاد رطوبة التربة');
        recommendations.push(language === 'en' ? 'Initiate irrigation' : 'بدء الري');
      }
      if (temperatureStatus === 'extreme') {
        issues.push(language === 'en' ? 'Temperature stress detected' : 'تم اكتشاف إجهاد حراري');
        recommendations.push(language === 'en' ? 'Apply stress mitigation measures' : 'تطبيق تدابير تخفيف الإجهاد');
      }

      return {
        ndvi: {
          value: ndviValue,
          status: ndviStatus,
          trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
          change: (Math.random() - 0.5) * 0.1,
          description: language === 'en' 
            ? `Vegetation health index: ${(ndviValue * 100).toFixed(1)}%`
            : `مؤشر صحة النباتات: ${(ndviValue * 100).toFixed(1)}%`
        },
        chlorophyll: {
          value: chlorophyllValue,
          status: chlorophyllStatus,
          trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
          change: (Math.random() - 0.5) * 10,
          description: language === 'en'
            ? `Leaf chlorophyll content: ${chlorophyllValue.toFixed(1)} μg/cm²`
            : `محتوى الكلوروفيل في الأوراق: ${chlorophyllValue.toFixed(1)} ميكروجرام/سم²`
        },
        soilMoisture: {
          value: soilMoistureValue,
          status: soilMoistureStatus,
          trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
          change: (Math.random() - 0.5) * 15,
          description: language === 'en'
            ? `Soil moisture level: ${soilMoistureValue.toFixed(1)}%`
            : `مستوى رطوبة التربة: ${soilMoistureValue.toFixed(1)}%`
        },
        temperature: {
          value: temperatureValue,
          status: temperatureStatus,
          trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
          change: (Math.random() - 0.5) * 5,
          description: language === 'en'
            ? `Field temperature: ${temperatureValue.toFixed(1)}°C`
            : `درجة حرارة الحقل: ${temperatureValue.toFixed(1)}°م`
        },
        overallHealth: {
          score: overallScore,
          status: overallStatus,
          issues,
          recommendations
        }
      };
    };

    const loadData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      const data = generateIndicators();
      setIndicators(data);
      setLastUpdated(new Date());
      setLoading(false);
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [fieldId, language]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
      case 'optimal':
        return 'bg-green-500';
      case 'good':
      case 'adequate':
        return 'bg-blue-500';
      case 'moderate':
        return 'bg-yellow-500';
      case 'poor':
      case 'low':
        return 'bg-orange-500';
      case 'critical':
      case 'extreme':
      case 'high':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable':
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!indicators) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t.title}</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {t.lastUpdated}: {lastUpdated.toLocaleTimeString()}
          </Badge>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            {t.viewDetails}
          </Button>
        </div>
      </div>

      {/* Overall Health Score */}
      <Card className={`border-l-4 ${getStatusColor(indicators.overallHealth.status)}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {indicators.overallHealth.status === 'excellent' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : indicators.overallHealth.status === 'critical' ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : (
                <Activity className="h-5 w-5 text-blue-500" />
              )}
              <span>{t.overallHealth}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{indicators.overallHealth.score.toFixed(1)}</span>
              <span className="text-sm text-gray-500">/100</span>
              <Badge className={getStatusColor(indicators.overallHealth.status)}>
                {t[indicators.overallHealth.status]}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={indicators.overallHealth.score} className="h-3" />
          {indicators.overallHealth.issues.length > 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">{t.issues}:</div>
                <ul className="list-disc list-inside space-y-1">
                  {indicators.overallHealth.issues.map((issue, index) => (
                    <li key={index} className="text-sm">{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Individual Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* NDVI Indicator */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onIndicatorClick?.('ndvi', indicators.ndvi)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4" />
                <span>{t.ndvi}</span>
              </div>
              {getTrendIcon(indicators.ndvi.trend)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{(indicators.ndvi.value * 100).toFixed(1)}%</span>
                <Badge className={getStatusColor(indicators.ndvi.status)}>
                  {t[indicators.ndvi.status]}
                </Badge>
              </div>
              <Progress value={indicators.ndvi.value * 100} className="h-2" />
              <p className="text-xs text-gray-600">{indicators.ndvi.description}</p>
              {indicators.ndvi.trend !== 'stable' && (
                <p className="text-xs text-gray-500">
                  {indicators.ndvi.change > 0 ? '+' : ''}{(indicators.ndvi.change * 100).toFixed(1)}% from last scan
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chlorophyll Indicator */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onIndicatorClick?.('chlorophyll', indicators.chlorophyll)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-600" />
                <span>{t.chlorophyll}</span>
              </div>
              {getTrendIcon(indicators.chlorophyll.trend)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{indicators.chlorophyll.value.toFixed(1)}</span>
                <Badge className={getStatusColor(indicators.chlorophyll.status)}>
                  {t[indicators.chlorophyll.status]}
                </Badge>
              </div>
              <Progress value={(indicators.chlorophyll.value / 80) * 100} className="h-2" />
              <p className="text-xs text-gray-600">{indicators.chlorophyll.description}</p>
              {indicators.chlorophyll.trend !== 'stable' && (
                <p className="text-xs text-gray-500">
                  {indicators.chlorophyll.change > 0 ? '+' : ''}{indicators.chlorophyll.change.toFixed(1)} μg/cm² from last scan
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Soil Moisture Indicator */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onIndicatorClick?.('soilMoisture', indicators.soilMoisture)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-600" />
                <span>{t.soilMoisture}</span>
              </div>
              {getTrendIcon(indicators.soilMoisture.trend)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{indicators.soilMoisture.value.toFixed(1)}%</span>
                <Badge className={getStatusColor(indicators.soilMoisture.status)}>
                  {t[indicators.soilMoisture.status]}
                </Badge>
              </div>
              <Progress value={indicators.soilMoisture.value} className="h-2" />
              <p className="text-xs text-gray-600">{indicators.soilMoisture.description}</p>
              {indicators.soilMoisture.trend !== 'stable' && (
                <p className="text-xs text-gray-500">
                  {indicators.soilMoisture.change > 0 ? '+' : ''}{indicators.soilMoisture.change.toFixed(1)}% from last scan
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Temperature Indicator */}
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onIndicatorClick?.('temperature', indicators.temperature)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-orange-600" />
                <span>{t.temperature}</span>
              </div>
              {getTrendIcon(indicators.temperature.trend)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{indicators.temperature.value.toFixed(1)}°</span>
                <Badge className={getStatusColor(indicators.temperature.status)}>
                  {t[indicators.temperature.status]}
                </Badge>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getStatusColor(indicators.temperature.status)}`}
                  style={{ width: `${Math.min(100, (indicators.temperature.value / 50) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600">{indicators.temperature.description}</p>
              {indicators.temperature.trend !== 'stable' && (
                <p className="text-xs text-gray-500">
                  {indicators.temperature.change > 0 ? '+' : ''}{indicators.temperature.change.toFixed(1)}° from last scan
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Analysis and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <span>{t.aiAnalysis}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {indicators.overallHealth.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">{t.recommendations}:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {indicators.overallHealth.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                      <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
