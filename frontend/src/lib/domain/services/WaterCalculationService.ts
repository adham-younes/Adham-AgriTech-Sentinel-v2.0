// ===========================================
// Adham AgriTech - Water Calculation Service
// ===========================================

import { 
  Field, 
  SoilAnalysis, 
  WeatherData, 
  WaterIndexCalculation,
  Crop,
  WaterRequirements,
  ValidationError 
} from '../types';

export class WaterCalculationService {
  /**
   * حساب مؤشر المياه للحقل
   */
  static calculateWaterIndex(
    field: Field,
    weatherData: WeatherData,
    crop?: Crop
  ): WaterIndexCalculation {
    if (!field.soil_analysis) {
      throw new ValidationError('soil_analysis', 'Soil analysis required for water calculation');
    }

    const soilAnalysis = field.soil_analysis;
    const currentMoisture = soilAnalysis.moisture_content;
    
    // حساب الرطوبة المثلى بناءً على نوع التربة والمحصول
    const optimalMoisture = this.calculateOptimalMoisture(
      soilAnalysis,
      crop?.water_requirements
    );

    // حساب العجز المائي
    const waterDeficit = Math.max(0, optimalMoisture - currentMoisture);

    // حساب توصيات الري
    const irrigationRecommendation = this.calculateIrrigationRecommendation(
      field,
      waterDeficit,
      weatherData,
      crop
    );

    return {
      field_id: field.id,
      current_moisture: currentMoisture,
      optimal_moisture: optimalMoisture,
      water_deficit: waterDeficit,
      irrigation_recommendation: irrigationRecommendation,
      calculated_at: new Date().toISOString()
    };
  }

  /**
   * حساب الرطوبة المثلى
   */
  private static calculateOptimalMoisture(
    soilAnalysis: SoilAnalysis,
    waterRequirements?: WaterRequirements
  ): number {
    // الرطوبة المثلى تعتمد على نوع التربة
    const baseMoisture = this.getBaseMoistureBySoilType(soilAnalysis);
    
    // تعديل بناءً على متطلبات المحصول
    if (waterRequirements) {
      const cropAdjustment = waterRequirements.daily_liters_per_hectare / 1000; // تحويل لتر/هكتار إلى نسبة
      return Math.min(1, baseMoisture + (cropAdjustment * 0.1));
    }

    return baseMoisture;
  }

  /**
   * الحصول على الرطوبة الأساسية حسب نوع التربة
   */
  private static getBaseMoistureBySoilType(soilAnalysis: SoilAnalysis): number {
    // هذه قيم تقريبية - يمكن تحسينها بناءً على بيانات حقيقية
    const ph = soilAnalysis.ph_level;
    
    if (ph < 6.0) return 0.6; // تربة حمضية تحتاج رطوبة أقل
    if (ph > 8.0) return 0.8; // تربة قلوية تحتاج رطوبة أكثر
    
    return 0.7; // تربة متعادلة
  }

  /**
   * حساب توصيات الري
   */
  private static calculateIrrigationRecommendation(
    field: Field,
    waterDeficit: number,
    weatherData: WeatherData,
    crop?: Crop
  ): WaterIndexCalculation['irrigation_recommendation'] {
    if (waterDeficit === 0) {
      return {
        amount_liters: 0,
        duration_hours: 0,
        urgency: 'low' as const
      };
    }

    // حساب كمية المياه المطلوبة
    const areaHectares = (field as any).area_hectares ?? ((field as any).area ? Number((field as any).area) / 2.381 : undefined);
    const waterPerHectare = waterDeficit * 10000; // تحويل إلى لتر/هكتار
    const totalWaterNeeded = waterPerHectare * areaHectares;

    // حساب مدة الري بناءً على نظام الري
    const irrigationSystem = field.irrigation_system;
    const durationHours = irrigationSystem 
      ? totalWaterNeeded / irrigationSystem.capacity_liters_per_hour
      : totalWaterNeeded / 1000; // افتراضي 1000 لتر/ساعة

    // تحديد الأولوية بناءً على العجز والطقس
    const urgency = this.calculateUrgency(waterDeficit, weatherData, crop);

    return {
      amount_liters: Math.round(totalWaterNeeded),
      duration_hours: Math.round(durationHours * 10) / 10, // تقريب لرقم عشري واحد
      urgency
    };
  }

  /**
   * حساب أولوية الري
   */
  private static calculateUrgency(
    waterDeficit: number,
    weatherData: WeatherData,
    crop?: Crop
  ): 'low' | 'medium' | 'high' | 'critical' {
    // عوامل التأثير
    const deficitFactor = waterDeficit;
    const temperatureFactor = weatherData.temperature > 30 ? 1.5 : 1;
    const humidityFactor = weatherData.humidity < 30 ? 1.3 : 1;
    const cropFactor = crop ? 1.2 : 1;

    const urgencyScore = deficitFactor * temperatureFactor * humidityFactor * cropFactor;

    if (urgencyScore > 0.8) return 'critical';
    if (urgencyScore > 0.6) return 'high';
    if (urgencyScore > 0.3) return 'medium';
    return 'low';
  }

  /**
   * حساب كفاءة الري
   */
  static calculateIrrigationEfficiency(
    field: Field,
    actualWaterUsed: number,
    expectedWaterNeeded: number
  ): number {
    if (expectedWaterNeeded === 0) return 1;
    
    const efficiency = Math.min(1, expectedWaterNeeded / actualWaterUsed);
    return Math.round(efficiency * 100) / 100;
  }

  /**
   * توقع استهلاك المياه للأسبوع القادم
   */
  static predictWeeklyWaterConsumption(
    field: Field,
    weatherForecast: WeatherData[],
    crop?: Crop
  ): number {
    if (!crop?.water_requirements) {
      return 0;
    }

    const dailyRequirement = crop.water_requirements.daily_liters_per_hectare;
    const fieldArea = (field as any).area_hectares ?? ((field as any).area ? Number((field as any).area) / 2.381 : undefined);
    
    // حساب متوسط الاستهلاك اليومي
    let totalConsumption = 0;
    
    for (const weather of weatherForecast) {
      // تعديل الاستهلاك بناءً على الطقس
      const weatherMultiplier = this.getWeatherMultiplier(weather);
      const dailyConsumption = dailyRequirement * fieldArea * weatherMultiplier;
      totalConsumption += dailyConsumption;
    }

    return Math.round(totalConsumption);
  }

  /**
   * مضاعف الطقس لاستهلاك المياه
   */
  private static getWeatherMultiplier(weather: WeatherData): number {
    let multiplier = 1;
    
    // تأثير الحرارة
    if (weather.temperature > 35) multiplier *= 1.5;
    else if (weather.temperature > 30) multiplier *= 1.3;
    else if (weather.temperature < 15) multiplier *= 0.8;
    
    // تأثير الرطوبة
    if (weather.humidity < 30) multiplier *= 1.2;
    else if (weather.humidity > 80) multiplier *= 0.9;
    
    // تأثير الرياح
    if (weather.wind_speed > 20) multiplier *= 1.1;
    
    return Math.round(multiplier * 100) / 100;
  }
}
