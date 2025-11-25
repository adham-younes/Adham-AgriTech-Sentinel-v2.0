// ===========================================
// Adham AgriTech - Weather Analysis Service
// ===========================================

import { 
  WeatherData, 
  Field, 
  Crop, 
  WeatherImpactAnalysis,
  ValidationError 
} from '../types';

export class WeatherAnalysisService {
  /**
   * تحليل تأثير الطقس على الحقل والمحصول
   */
  static analyzeWeatherImpact(
    field: Field,
    weatherData: WeatherData,
    crop?: Crop
  ): WeatherImpactAnalysis {
    if (!field.soil_analysis) {
      throw new ValidationError('soil_analysis', 'Soil analysis required for weather impact analysis');
    }

    const cropImpact = this.analyzeCropImpact(field, weatherData, crop);
    const irrigationImpact = this.analyzeIrrigationImpact(field, weatherData);

    return {
      field_id: field.id,
      weather_data: weatherData,
      crop_impact: cropImpact,
      irrigation_impact: irrigationImpact,
      calculated_at: new Date().toISOString()
    };
  }

  /**
   * تحليل تأثير الطقس على المحصول
   */
  private static analyzeCropImpact(
    field: Field,
    weatherData: WeatherData,
    crop?: Crop
  ): WeatherImpactAnalysis['crop_impact'] {
    const riskLevel = this.calculateRiskLevel(weatherData, crop);
    const growthStage = this.determineGrowthStage(field, crop);
    const recommendations = this.generateCropRecommendations(weatherData, riskLevel, crop);

    return {
      growth_stage: growthStage,
      risk_level: riskLevel,
      recommendations
    };
  }

  /**
   * حساب مستوى المخاطر
   */
  private static calculateRiskLevel(
    weatherData: WeatherData,
    crop?: Crop
  ): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // مخاطر الحرارة
    if (weatherData.temperature > 40) riskScore += 3;
    else if (weatherData.temperature > 35) riskScore += 2;
    else if (weatherData.temperature < 5) riskScore += 2;
    else if (weatherData.temperature < 0) riskScore += 3;

    // مخاطر الرطوبة
    if (weatherData.humidity < 20) riskScore += 2;
    else if (weatherData.humidity > 90) riskScore += 1;

    // مخاطر الرياح
    if (weatherData.wind_speed > 30) riskScore += 2;
    else if (weatherData.wind_speed > 20) riskScore += 1;

    // مخاطر الأمطار
    if (weatherData.precipitation > 50) riskScore += 2;
    else if (weatherData.precipitation > 20) riskScore += 1;

    // مخاطر الضغط الجوي
    if (weatherData.pressure < 1000) riskScore += 1;

    // تعديل بناءً على المحصول
    if (crop) {
      const cropSensitivity = this.getCropSensitivity(crop);
      riskScore *= cropSensitivity;
    }

    if (riskScore >= 6) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  /**
   * تحديد مرحلة النمو
   */
  private static determineGrowthStage(field: Field, crop?: Crop): string {
    if (!crop || !field.planting_date) {
      return 'unknown';
    }

    const plantingDate = new Date(field.planting_date);
    const currentDate = new Date();
    const daysSincePlanting = Math.floor(
      (currentDate.getTime() - plantingDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const totalGrowthDays = crop.growth_days;
    const growthPercentage = (daysSincePlanting / totalGrowthDays) * 100;

    if (growthPercentage < 20) return 'germination';
    if (growthPercentage < 40) return 'vegetative';
    if (growthPercentage < 70) return 'flowering';
    if (growthPercentage < 90) return 'fruiting';
    return 'maturity';
  }

  /**
   * توليد توصيات المحصول
   */
  private static generateCropRecommendations(
    weatherData: WeatherData,
    riskLevel: 'low' | 'medium' | 'high',
    crop?: Crop
  ): string[] {
    const recommendations: string[] = [];

    // توصيات الحرارة
    if (weatherData.temperature > 35) {
      recommendations.push('زيادة الري لتقليل الإجهاد الحراري');
      recommendations.push('استخدام الظل أو التغطية لحماية المحصول');
    } else if (weatherData.temperature < 10) {
      recommendations.push('تغطية المحصول لحمايته من الصقيع');
      recommendations.push('تقليل الري لتجنب تجمد الجذور');
    }

    // توصيات الرطوبة
    if (weatherData.humidity < 30) {
      recommendations.push('زيادة تواتر الري');
      recommendations.push('استخدام المهاد للحفاظ على الرطوبة');
    } else if (weatherData.humidity > 80) {
      recommendations.push('تحسين التهوية لتجنب الأمراض الفطرية');
      recommendations.push('تقليل الري لتجنب التشبع');
    }

    // توصيات الرياح
    if (weatherData.wind_speed > 20) {
      recommendations.push('تثبيت الدعامات لحماية المحصول');
      recommendations.push('تجنب الرش الكيميائي في الأيام العاصفة');
    }

    // توصيات الأمطار
    if (weatherData.precipitation > 20) {
      recommendations.push('تحسين الصرف لتجنب التشبع');
      recommendations.push('تأجيل التسميد حتى تجف التربة');
    }

    // توصيات عامة حسب مستوى المخاطر
    if (riskLevel === 'high') {
      recommendations.push('مراقبة المحصول يومياً');
      recommendations.push('الاستعداد لتدابير الطوارئ');
    }

    return recommendations;
  }

  /**
   * تحليل تأثير الطقس على الري
   */
  private static analyzeIrrigationImpact(
    field: Field,
    weatherData: WeatherData
  ): WeatherImpactAnalysis['irrigation_impact'] {
    let adjustmentPercentage = 0;
    let reason = '';

    // تأثير الأمطار
    if (weatherData.precipitation > 10) {
      adjustmentPercentage = -Math.min(50, weatherData.precipitation * 2);
      reason = `تساقط أمطار ${weatherData.precipitation}mm - تقليل الري`;
    }

    // تأثير الحرارة
    if (weatherData.temperature > 30) {
      adjustmentPercentage += 20;
      reason += reason ? '، ' : '';
      reason += `درجة حرارة عالية ${weatherData.temperature}°C - زيادة الري`;
    }

    // تأثير الرطوبة
    if (weatherData.humidity < 40) {
      adjustmentPercentage += 15;
      reason += reason ? '، ' : '';
      reason += `رطوبة منخفضة ${weatherData.humidity}% - زيادة الري`;
    }

    // تأثير الرياح
    if (weatherData.wind_speed > 15) {
      adjustmentPercentage += 10;
      reason += reason ? '، ' : '';
      reason += `رياح قوية ${weatherData.wind_speed}km/h - زيادة الري`;
    }

    return {
      adjustment_percentage: Math.round(adjustmentPercentage),
      reason: reason || 'لا توجد تعديلات مطلوبة'
    };
  }

  /**
   * الحصول على حساسية المحصول للطقس
   */
  private static getCropSensitivity(crop: Crop): number {
    // هذه قيم تقريبية - يمكن تحسينها بناءً على بيانات حقيقية
    const sensitiveCrops = ['tomato', 'lettuce', 'spinach'];
    const moderateCrops = ['wheat', 'corn', 'rice'];
    const hardyCrops = ['barley', 'oats', 'potato'];

    const cropName = crop.name.toLowerCase();
    
    if (sensitiveCrops.some(c => cropName.includes(c))) return 1.5;
    if (moderateCrops.some(c => cropName.includes(c))) return 1.0;
    if (hardyCrops.some(c => cropName.includes(c))) return 0.7;
    
    return 1.0; // افتراضي
  }

  /**
   * توقع الطقس للأيام القادمة
   */
  static predictWeatherTrends(
    currentWeather: WeatherData,
    historicalData: WeatherData[]
  ): {
    temperature_trend: 'rising' | 'falling' | 'stable';
    precipitation_probability: number;
    risk_alerts: string[];
  } {
    // تحليل اتجاه الحرارة
    const recentTemps = historicalData.slice(-7).map(w => w.temperature);
    const avgRecentTemp = recentTemps.reduce((a, b) => a + b, 0) / recentTemps.length;
    
    let temperature_trend: 'rising' | 'falling' | 'stable' = 'stable';
    if (currentWeather.temperature > avgRecentTemp + 2) temperature_trend = 'rising';
    else if (currentWeather.temperature < avgRecentTemp - 2) temperature_trend = 'falling';

    // حساب احتمالية الأمطار
    const rainyDays = historicalData.filter(w => w.precipitation > 5).length;
    const precipitation_probability = (rainyDays / historicalData.length) * 100;

    // تنبيهات المخاطر
    const risk_alerts: string[] = [];
    if (currentWeather.temperature > 35) risk_alerts.push('درجات حرارة عالية');
    if (currentWeather.humidity < 30) risk_alerts.push('رطوبة منخفضة');
    if (currentWeather.wind_speed > 25) risk_alerts.push('رياح قوية');
    if (precipitation_probability > 70) risk_alerts.push('احتمالية أمطار عالية');

    return {
      temperature_trend,
      precipitation_probability: Math.round(precipitation_probability),
      risk_alerts
    };
  }
}