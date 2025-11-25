import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Eye,
  Zap,
  MapPin,
  Calendar,
  Clock,
  Satellite,
  Leaf,
  Droplets,
  Thermometer
} from 'lucide-react';

// AI anomaly detection interface
interface AnomalyDetection {
  id: string;
  type: 'ndvi_anomaly' | 'chlorophyll_drop' | 'moisture_stress' | 'temperature_extreme' | 'growth_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-100
  location: {
    x: number; // percentage of field width
    y: number; // percentage of field height
    description: string;
  };
  detectedAt: Date;
  description: string;
  impact: string;
  recommendations: string[];
  historicalContext: {
    previousValue: number;
    currentValue: number;
    changePercentage: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  satelliteMetadata: {
    source: 'sentinel' | 'planet' | 'landsat';
    resolution: string;
    acquisitionDate: Date;
    cloudCover: number;
  };
}

// Multi-language support
const translations = {
  en: {
    title: 'AI-Powered Anomaly Detection',
    anomalies: 'Detected Anomalies',
    noAnomalies: 'No anomalies detected',
    severity: 'Severity',
    confidence: 'Confidence',
    location: 'Location',
    detected: 'Detected',
    impact: 'Impact',
    recommendations: 'Recommendations',
    historical: 'Historical Context',
    satellite: 'Satellite Data',
    viewDetails: 'View Details',
    analyze: 'Analyze Field',
    lastScan: 'Last Scan',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
    ndviAnomaly: 'NDVI Anomaly',
    chlorophyllDrop: 'Chlorophyll Drop',
    moistureStress: 'Moisture Stress',
    temperatureExtreme: 'Temperature Extreme',
    growthPattern: 'Growth Pattern Anomaly'
  },
  ar: {
    title: 'كشف الشذوذ المدعوم بالذكاء الاصطناعي',
    anomalies: 'الشذوذ المكتشف',
    noAnomalies: 'لم يتم اكتشاف أي شذوذ',
    severity: 'الشدة',
    confidence: 'الثقة',
    location: 'الموقع',
    detected: 'تم اكتشافه',
    impact: 'التأثير',
    recommendations: 'التوصيات',
    historical: 'السياق التاريخي',
    satellite: 'بيانات الأقمار الصناعية',
    viewDetails: 'عرض التفاصيل',
    analyze: 'تحليل الحقل',
    lastScan: 'آخر مسح',
    low: 'منخفض',
    medium: 'متوسط',
    high: 'مرتفع',
    critical: 'حرج',
    ndviAnomaly: 'شذوذ NDVI',
    chlorophyllDrop: 'انخفاض الكلوروفيل',
    moistureStress: 'إجهاد الرطوبة',
    temperatureExtreme: 'درجة حرارة شديدة',
    growthPattern: 'شذوذ نمط النمو'
  }
};

interface AIAnomalyDetectionProps {
  fieldId: string;
  fieldName: string;
  language: 'en' | 'ar';
  onAnomalyClick?: (anomaly: AnomalyDetection) => void;
  onAnalyzeField?: () => void;
}

export default function AIAnomalyDetection({ 
  fieldId, 
  fieldName, 
  language,
  onAnomalyClick,
  onAnalyzeField
}: AIAnomalyDetectionProps) {
  const t = translations[language];
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastScan, setLastScan] = useState<Date>(new Date());

  // Simulate AI anomaly detection
  useEffect(() => {
    const detectAnomalies = async (): Promise<AnomalyDetection[]> => {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const detectedAnomalies: AnomalyDetection[] = [];
      const anomalyCount = Math.floor(Math.random() * 4); // 0-3 anomalies
      
      const anomalyTypes: AnomalyDetection['type'][] = [
        'ndvi_anomaly',
        'chlorophyll_drop', 
        'moisture_stress',
        'temperature_extreme',
        'growth_pattern'
      ];

      const severities: AnomalyDetection['severity'][] = ['low', 'medium', 'high', 'critical'];
      
      for (let i = 0; i < anomalyCount; i++) {
        const type = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        const confidence = 60 + Math.random() * 35; // 60-95%
        
        let description = '';
        let impact = '';
        let recommendations: string[] = [];
        let previousValue = 0;
        let currentValue = 0;
        
        switch (type) {
          case 'ndvi_anomaly':
            previousValue = 0.65 + Math.random() * 0.2;
            currentValue = previousValue - (0.1 + Math.random() * 0.2);
            description = language === 'en' 
              ? `Significant NDVI drop detected in area`
              : `انخفاض كبير في NDVI تم اكتشافه في المنطقة`;
            impact = language === 'en'
              ? 'Reduced vegetation health and potential yield loss'
              : 'انخفاض صحة النباتات وفقدان محتمل في المحصول';
            recommendations = language === 'en' ? [
              'Conduct field scouting to identify cause',
              'Consider fertilizer application if nutrient deficiency',
              'Monitor for disease or pest infestation'
            ] : [
              'إجراء مسح ميداني لتحديد السبب',
              'النظر في تطبيق الأسمدة في حالة نقص المغذيات',
              'مراقبة الأمراض أو الإصابة بالآفات'
            ];
            break;
            
          case 'chlorophyll_drop':
            previousValue = 50 + Math.random() * 20;
            currentValue = previousValue - (5 + Math.random() * 15);
            description = language === 'en'
              ? 'Chlorophyll content below optimal levels'
              : 'محتوى الكلوروفيل أقل من المستويات المثلى';
            impact = language === 'en'
              ? 'Reduced photosynthetic capacity affecting growth'
              : 'انخفاض القدرة على التمثيل الضوئي يؤثر على النمو';
            recommendations = language === 'en' ? [
              'Apply nitrogen-rich fertilizer',
              'Check for iron deficiency',
              'Monitor water stress levels'
            ] : [
              'تطبيق أسمدة غنية بالنيتروجين',
              'فحص نقص الحديد',
              'مراقبة مستويات الإجهاد المائي'
            ];
            break;
            
          case 'moisture_stress':
            previousValue = 60 + Math.random() * 20;
            currentValue = previousValue - (10 + Math.random() * 20);
            description = language === 'en'
              ? 'Soil moisture below critical threshold'
              : 'رطوبة التربة أقل من العتبة الحرجة';
            impact = language === 'en'
              ? 'Plant water stress leading to reduced growth'
              : 'إجهاد مائي للنباتات يؤدي إلى انخفاض النمو';
            recommendations = language === 'en' ? [
              'Initiate irrigation immediately',
              'Check irrigation system efficiency',
              'Monitor weather forecast for rain'
            ] : [
              'بدء الري فوراً',
              'فحص كفاءة نظام الري',
              'مراقبة توقعات الطقس للمطر'
            ];
            break;
            
          case 'temperature_extreme':
            previousValue = 28;
            currentValue = 35 + Math.random() * 10;
            description = language === 'en'
              ? 'Temperature stress detected in field area'
              : 'تم اكتشاف إجهاد حراري في منطقة الحقل';
            impact = language === 'en'
              ? 'Heat stress affecting plant metabolic processes'
              : 'إجهاد حراري يؤثر على العمليات الأيضية للنبات';
            recommendations = language === 'en' ? [
              'Apply shade nets if possible',
              'Increase irrigation frequency',
              'Monitor for heat-related diseases'
            ] : [
              'تطبيق شبك الظل إذا أمكن',
              'زيادة تكرار الري',
              'مراقبة الأمراض المرتبطة بالحرارة'
            ];
            break;
            
          case 'growth_pattern':
            previousValue = 0.7;
            currentValue = 0.4 + Math.random() * 0.2;
            description = language === 'en'
              ? 'Irregular growth pattern detected'
              : 'تم اكتشاف نمط نمو غير منتظم';
            impact = language === 'en'
              ? 'Uneven development may indicate underlying issues'
              : 'التطور غير المتسق قد يشير إلى مشاكل أساسية';
            recommendations = language === 'en' ? [
              'Conduct uniform soil sampling',
              'Check for uneven fertilizer application',
              'Investigate drainage issues'
            ] : [
              'إجراء أخذ عينات تربة موحدة',
              'فحص تطبيق الأسمدة غير المتساوي',
              'التحقيق في مشاكل الصرف'
            ];
            break;
        }

        detectedAnomalies.push({
          id: `anomaly_${Date.now()}_${i}`,
          type,
          severity,
          confidence,
          location: {
            x: 20 + Math.random() * 60, // 20-80% of field width
            y: 20 + Math.random() * 60, // 20-80% of field height
            description: language === 'en'
              ? `Center of field (${Math.round(20 + Math.random() * 60)}%, ${Math.round(20 + Math.random() * 60)}%)`
              : `مركز الحقل (${Math.round(20 + Math.random() * 60)}%, ${Math.round(20 + Math.random() * 60)}%)`
          },
          detectedAt: new Date(),
          description,
          impact,
          recommendations,
          historicalContext: {
            previousValue,
            currentValue,
            changePercentage: ((currentValue - previousValue) / previousValue) * 100,
            trend: currentValue < previousValue ? 'declining' : 'improving'
          },
          satelliteMetadata: {
            source: Math.random() > 0.5 ? 'sentinel' : 'planet',
            resolution: Math.random() > 0.5 ? '10m' : '3m',
            acquisitionDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            cloudCover: Math.random() * 20
          }
        });
      }
      
      return detectedAnomalies;
    };

    const loadAnomalies = async () => {
      setLoading(true);
      try {
        const data = await detectAnomalies();
        setAnomalies(data);
        setLastScan(new Date());
      } catch (error) {
        console.error('Error detecting anomalies:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnomalies();
    
    // Set up periodic scanning
    const interval = setInterval(loadAnomalies, 60000); // Every minute
    return () => clearInterval(interval);
  }, [fieldId, language]);

  const handleAnalyzeField = async () => {
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis
      await new Promise(resolve => setTimeout(resolve, 3000));
      onAnalyzeField?.();
      
      // Reload anomalies after analysis
      const detectAnomalies = async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const anomalyCount = Math.floor(Math.random() * 4);
        const detectedAnomalies: AnomalyDetection[] = [];
        
        // Generate new anomalies based on analysis
        for (let i = 0; i < anomalyCount; i++) {
          // Similar generation logic as above...
        }
        
        return detectedAnomalies;
      };
      
      const newAnomalies = await detectAnomalies();
      setAnomalies(newAnomalies);
      setLastScan(new Date());
    } catch (error) {
      console.error('Error analyzing field:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getAnomalyTypeIcon = (type: string) => {
    switch (type) {
      case 'ndvi_anomaly': return <Activity className="h-4 w-4" />;
      case 'chlorophyll_drop': return <Leaf className="h-4 w-4" />;
      case 'moisture_stress': return <Droplets className="h-4 w-4" />;
      case 'temperature_extreme': return <Thermometer className="h-4 w-4" />;
      case 'growth_pattern': return <TrendingUp className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-blue-500 animate-pulse" />
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-600">
                {language === 'en' ? 'Analyzing field with AI...' : 'تحليل الحقل بالذكاء الاصطناعي...'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">{t.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {t.lastScan}: {lastScan.toLocaleTimeString()}
          </Badge>
          <Button 
            onClick={handleAnalyzeField}
            disabled={isAnalyzing}
            className="flex items-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {language === 'en' ? 'Analyzing...' : 'جاري التحليل...'}
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                {t.analyze}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Anomalies List */}
      {anomalies.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t.noAnomalies}</h3>
            <p className="text-gray-600">
              {language === 'en' 
                ? 'Your field appears to be healthy with no detected anomalies.'
                : 'يبدو حقلك سليمًا ولم يتم اكتشاف أي شذوذ.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {anomalies.map((anomaly) => (
            <Card 
              key={anomaly.id}
              className={`border-l-4 ${getSeverityColor(anomaly.severity)} cursor-pointer hover:shadow-lg transition-shadow`}
              onClick={() => onAnomalyClick?.(anomaly)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getAnomalyTypeIcon(anomaly.type)}
                    <div>
                      <CardTitle className="text-lg">
                        {t[anomaly.type as keyof typeof t]}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getSeverityColor(anomaly.severity)}>
                          {t[anomaly.severity]}
                        </Badge>
                        <Badge variant="outline">
                          {t.confidence}: {anomaly.confidence.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>{anomaly.location.description}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>{anomaly.detectedAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-700">{anomaly.description}</p>
                  
                  {/* Historical Context */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-semibold mb-2">{t.historical}:</h4>
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {language === 'en' ? 'Previous' : 'السابق'}: {anomaly.historicalContext.previousValue.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-1">
                        {anomaly.historicalContext.trend === 'declining' ? (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        ) : (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        )}
                        <span className={anomaly.historicalContext.trend === 'declining' ? 'text-red-500' : 'text-green-500'}>
                          {anomaly.historicalContext.changePercentage > 0 ? '+' : ''}{anomaly.historicalContext.changePercentage.toFixed(1)}%
                        </span>
                      </div>
                      <span>
                        {language === 'en' ? 'Current' : 'الحالي'}: {anomaly.historicalContext.currentValue.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Impact */}
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{t.impact}:</strong> {anomaly.impact}
                    </AlertDescription>
                  </Alert>

                  {/* Recommendations */}
                  <div>
                    <h4 className="font-semibold mb-2">{t.recommendations}:</h4>
                    <ul className="space-y-1">
                      {anomaly.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Zap className="h-3 w-3 text-blue-500 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Satellite Metadata */}
                  <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Satellite className="h-3 w-3" />
                        <span>{anomaly.satelliteMetadata.source.toUpperCase()}</span>
                      </div>
                      <span>{anomaly.satelliteMetadata.resolution}</span>
                      <span>{anomaly.satelliteMetadata.cloudCover.toFixed(1)}% clouds</span>
                    </div>
                    <span>{anomaly.satelliteMetadata.acquisitionDate.toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
