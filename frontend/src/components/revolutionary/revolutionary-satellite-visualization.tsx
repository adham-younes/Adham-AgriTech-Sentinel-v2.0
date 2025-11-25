import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Globe, 
  MapPin, 
  Calendar, 
  Clock, 
  Activity,
  TrendingUp,
  TrendingDown,
  Eye,
  Layers,
  ZoomIn,
  ZoomOut,
  Download,
  Share2,
  Settings,
  Satellite,
  Cloud,
  Sun,
  Thermometer,
  Droplets,
  Wind
} from 'lucide-react';

// Satellite visualization interface
interface SatelliteVisualizationData {
  fieldId: string;
  fieldName: string;
  layers: {
    ndvi: {
      available: boolean;
      latestImage: string;
      acquisitionDate: Date;
      resolution: string;
      cloudCover: number;
      value: number;
      trend: 'up' | 'down' | 'stable';
    };
    chlorophyll: {
      available: boolean;
      latestImage: string;
      acquisitionDate: Date;
      resolution: string;
      cloudCover: number;
      value: number;
      trend: 'up' | 'down' | 'stable';
    };
    soilMoisture: {
      available: boolean;
      latestImage: string;
      acquisitionDate: Date;
      resolution: string;
      cloudCover: number;
      value: number;
      trend: 'up' | 'down' | 'stable';
    };
    thermal: {
      available: boolean;
      latestImage: string;
      acquisitionDate: Date;
      resolution: string;
      cloudCover: number;
      value: number;
      trend: 'up' | 'down' | 'stable';
    };
    trueColor: {
      available: boolean;
      latestImage: string;
      acquisitionDate: Date;
      resolution: string;
      cloudCover: number;
    };
  };
  weatherConditions: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    lastUpdated: Date;
  };
  fieldBoundaries: {
    coordinates: Array<{lat: number, lng: number}>;
    area: number; // in hectares
    center: {lat: number, lng: number};
  };
}

// Multi-language support
const translations = {
  en: {
    title: 'Advanced Satellite Visualization',
    layers: 'Layers',
    ndvi: 'NDVI',
    chlorophyll: 'Chlorophyll',
    soilMoisture: 'Soil Moisture',
    thermal: 'Thermal',
    trueColor: 'True Color',
    weather: 'Weather Conditions',
    temperature: 'Temperature',
    humidity: 'Humidity',
    windSpeed: 'Wind Speed',
    lastUpdated: 'Last Updated',
    resolution: 'Resolution',
    cloudCover: 'Cloud Cover',
    acquisitionDate: 'Acquisition Date',
    fieldArea: 'Field Area',
    hectares: 'hectares',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    download: 'Download',
    share: 'Share',
    settings: 'Settings',
    viewFullscreen: 'View Fullscreen',
    compareDates: 'Compare Dates',
    timeSeries: 'Time Series',
    noData: 'No satellite data available',
    loading: 'Loading satellite data...',
    up: 'Improving',
    down: 'Declining',
    stable: 'Stable'
  },
  ar: {
    title: 'تصور الأقمار الصناعية المتقدم',
    layers: 'الطبقات',
    ndvi: 'NDVI',
    chlorophyll: 'الكلوروفيل',
    soilMoisture: 'رطوبة التربة',
    thermal: 'حراري',
    trueColor: 'لون حقيقي',
    weather: 'حالات الطقس',
    temperature: 'درجة الحرارة',
    humidity: 'الرطوبة',
    windSpeed: 'سرعة الرياح',
    lastUpdated: 'آخر تحديث',
    resolution: 'الدقة',
    cloudCover: 'غطاء السحب',
    acquisitionDate: 'تاريخ الاكتساب',
    fieldArea: 'مساحة الحقل',
    hectares: 'هكتار',
    zoomIn: 'تكبير',
    zoomOut: 'تصغير',
    download: 'تحميل',
    share: 'مشاركة',
    settings: 'الإعدادات',
    viewFullscreen: 'عرض ملء الشاشة',
    compareDates: 'مقارنة التواريخ',
    timeSeries: 'السلاسل الزمنية',
    noData: 'لا توجد بيانات الأقمار الصناعية المتاحة',
    loading: 'تحميل بيانات الأقمار الصناعية...',
    up: 'تحسن',
    down: 'انخفاض',
    stable: 'مستقر'
  }
};

interface RevolutionarySatelliteVisualizationProps {
  fieldId: string;
  fieldName: string;
  language: 'en' | 'ar';
  onLayerSelect?: (layer: string, data: any) => void;
  onAreaClick?: (coordinates: {lat: number, lng: number}) => void;
}

export default function RevolutionarySatelliteVisualization({ 
  fieldId, 
  fieldName, 
  language,
  onLayerSelect,
  onAreaClick
}: RevolutionarySatelliteVisualizationProps) {
  const t = translations[language];
  const [satelliteData, setSatelliteData] = useState<SatelliteVisualizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState<string>('ndvi');
  const [zoom, setZoom] = useState<number>(1);
  const [showComparison, setShowComparison] = useState<boolean>(false);

  // Simulate satellite data loading
  useEffect(() => {
    const loadSatelliteData = async () => {
      setLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const data: SatelliteVisualizationData = {
        fieldId,
        fieldName,
        layers: {
          ndvi: {
            available: true,
            latestImage: `/api/satellite/${fieldId}/ndvi/latest`,
            acquisitionDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            resolution: '10m',
            cloudCover: Math.random() * 15,
            value: 0.45 + Math.random() * 0.4,
            trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable'
          },
          chlorophyll: {
            available: true,
            latestImage: `/api/satellite/${fieldId}/chlorophyll/latest`,
            acquisitionDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            resolution: '10m',
            cloudCover: Math.random() * 15,
            value: 35 + Math.random() * 45,
            trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable'
          },
          soilMoisture: {
            available: true,
            latestImage: `/api/satellite/${fieldId}/moisture/latest`,
            acquisitionDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            resolution: '10m',
            cloudCover: Math.random() * 15,
            value: 15 + Math.random() * 70,
            trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable'
          },
          thermal: {
            available: Math.random() > 0.3,
            latestImage: `/api/satellite/${fieldId}/thermal/latest`,
            acquisitionDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            resolution: '30m',
            cloudCover: Math.random() * 15,
            value: 18 + Math.random() * 25,
            trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable'
          },
          trueColor: {
            available: true,
            latestImage: `/api/satellite/${fieldId}/truecolor/latest`,
            acquisitionDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
            resolution: '10m',
            cloudCover: Math.random() * 15
          }
        },
        weatherConditions: {
          temperature: 18 + Math.random() * 25,
          humidity: 30 + Math.random() * 50,
          windSpeed: Math.random() * 20,
          lastUpdated: new Date()
        },
        fieldBoundaries: {
          coordinates: [
            {lat: 30.0444 + Math.random() * 0.1, lng: 31.2357 + Math.random() * 0.1},
            {lat: 30.0444 + Math.random() * 0.1, lng: 31.2357 + Math.random() * 0.1},
            {lat: 30.0444 + Math.random() * 0.1, lng: 31.2357 + Math.random() * 0.1},
            {lat: 30.0444 + Math.random() * 0.1, lng: 31.2357 + Math.random() * 0.1}
          ],
          area: 10 + Math.random() * 90, // 10-100 hectares
          center: {
            lat: 30.0444,
            lng: 31.2357
          }
        }
      };
      
      setSatelliteData(data);
      setLoading(false);
    };

    loadSatelliteData();
    
    // Update data every 5 minutes
    const interval = setInterval(loadSatelliteData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fieldId, fieldName]);

  const handleLayerSelect = (layer: string) => {
    setSelectedLayer(layer);
    onLayerSelect?.(layer, satelliteData?.layers[layer as keyof typeof satelliteData.layers]);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      case 'stable':
        return <Activity className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  const getLayerValue = (layer: string) => {
    if (!satelliteData) return null;
    
    const layerData = satelliteData.layers[layer as keyof typeof satelliteData.layers];
    if (!layerData || !('value' in layerData)) return null;
    
    return layerData.value;
  };

  const getLayerValueDisplay = (layer: string) => {
    const value = getLayerValue(layer);
    if (value === null) return null;
    
    switch (layer) {
      case 'ndvi':
        return `${(value * 100).toFixed(1)}%`;
      case 'chlorophyll':
        return `${value.toFixed(1)} μg/cm²`;
      case 'soilMoisture':
        return `${value.toFixed(1)}%`;
      case 'thermal':
        return `${value.toFixed(1)}°C`;
      default:
        return value.toFixed(2);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <Satellite className="h-6 w-6 text-blue-500 animate-pulse" />
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-600">{t.loading}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!satelliteData) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Globe className="h-12 w-12 mx-auto mb-4" />
            <p>{t.noData}</p>
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
          <Satellite className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">{t.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            {t.compareDates}
          </Button>
          <Button variant="outline" size="sm">
            <Activity className="h-4 w-4 mr-2" />
            {t.timeSeries}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t.download}
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            {t.share}
          </Button>
        </div>
      </div>

      {/* Main Visualization Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-3">
          <Card className="h-96">
            <CardContent className="p-0 h-full">
              {/* Placeholder for interactive map */}
              <div className="relative w-full h-full bg-gradient-to-br from-green-50 to-blue-50 rounded-lg overflow-hidden">
                {/* Map Controls */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.min(zoom + 0.5, 3))}
                  >
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.max(zoom - 0.5, 0.5))}
                  >
                    <ZoomOut className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="h-3 w-3" />
                  </Button>
                </div>

                {/* Field Visualization Placeholder */}
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ transform: `scale(${zoom})` }}
                >
                  <div className="text-center">
                    <Globe className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">{fieldName}</h3>
                    <div className="flex items-center gap-2 justify-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{satelliteData.fieldBoundaries.area.toFixed(1)} {t.hectares}</span>
                    </div>
                    <div className="mt-4 px-4 py-2 bg-white rounded-lg shadow-md">
                      <Badge className="capitalize">
                        {selectedLayer === 'trueColor' ? t.trueColor : t[selectedLayer as keyof typeof t]}
                      </Badge>
                      {getLayerValueDisplay(selectedLayer) && (
                        <div className="mt-2 text-sm font-semibold">
                          {getLayerValueDisplay(selectedLayer)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Layer Legend */}
                <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3">
                  <div className="text-xs font-semibold mb-2">{t[selectedLayer as keyof typeof t] || selectedLayer}</div>
                  {selectedLayer === 'ndvi' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500"></div>
                        <span className="text-xs">0-0.2</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500"></div>
                        <span className="text-xs">0.2-0.4</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500"></div>
                        <span className="text-xs">0.4-0.6</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-700"></div>
                        <span className="text-xs">0.6-1.0</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Layer Selection Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5" />
                {t.layers}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(satelliteData.layers).map(([key, layer]) => (
                <div
                  key={key}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedLayer === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleLayerSelect(key)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">
                      {key === 'trueColor' ? t.trueColor : t[key as keyof typeof t]}
                    </span>
                    {layer.available ? (
                      <div className="flex items-center gap-1">
                        {getTrendIcon('trend' in layer ? layer.trend : 'stable')}
                        <Badge variant={selectedLayer === key ? 'default' : 'secondary'} className="text-xs">
                          {selectedLayer === key ? 'Active' : 'Available'}
                        </Badge>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-xs">Unavailable</Badge>
                    )}
                  </div>
                  
                  {layer.available && (
                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>{t.resolution}:</span>
                        <span>{layer.resolution}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t.cloudCover}:</span>
                        <span>{layer.cloudCover.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t.acquisitionDate}:</span>
                        <span>{layer.acquisitionDate.toLocaleDateString()}</span>
                      </div>
                      {'value' in layer && (
                        <div className="flex justify-between">
                          <span>Value:</span>
                          <span className="font-semibold">{getLayerValueDisplay(key)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Weather Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                {t.weather}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">{t.temperature}</span>
                </div>
                <span className="font-semibold">{satelliteData.weatherConditions.temperature.toFixed(1)}°C</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{t.humidity}</span>
                </div>
                <span className="font-semibold">{satelliteData.weatherConditions.humidity.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{t.windSpeed}</span>
                </div>
                <span className="font-semibold">{satelliteData.weatherConditions.windSpeed.toFixed(1)} km/h</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                <span>{t.lastUpdated}:</span>
                <span>{satelliteData.weatherConditions.lastUpdated.toLocaleTimeString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
