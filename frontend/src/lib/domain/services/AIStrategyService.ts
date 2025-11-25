// ===========================================
// Adham AgriTech - AI Strategy Service
// ===========================================

import { 
  AIRecommendation, 
  RecommendationType, 
  Priority, 
  ActionItem,
  Field,
  WeatherData,
  Crop,
  ValidationError 
} from '../types';

export class AIStrategyService {
  private static readonly API_KEY = process.env.OPENAI_API_KEY;
  private static readonly BASE_URL = 'https://api.openai.com/v1/chat/completions';
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  private static cache = new Map<string, { data: any; timestamp: number }>();

  /**
   * توليد توصيات ذكية للمزرعة
   */
  static async generateRecommendations(
    field: Field,
    weatherData: WeatherData,
    crop?: Crop,
    context?: string
  ): Promise<AIRecommendation[]> {
    const cacheKey = `ai_recommendations_${field.id}_${weatherData.recorded_at}`;
    
    // التحقق من التخزين المؤقت
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    if (!this.API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const prompt = this.buildRecommendationPrompt(field, weatherData, crop, context);
      const response = await this.callOpenAI(prompt);
      const recommendations = this.parseRecommendations(response, field.id);

      // حفظ في التخزين المؤقت
      this.cache.set(cacheKey, {
        data: recommendations,
        timestamp: Date.now()
      });

      return recommendations;
    } catch (error) {
      console.error('AI recommendation error:', error);
      throw new Error('Failed to generate AI recommendations');
    }
  }

  /**
   * بناء prompt للتوصيات
   */
  private static buildRecommendationPrompt(
    field: Field,
    weatherData: WeatherData,
    crop?: Crop,
    context?: string
  ): string {
    const basePrompt = `
أنت مساعد ذكي متخصص في الزراعة. قم بتحليل البيانات التالية وقدم توصيات عملية:

بيانات الحقل:
      - المساحة: ${((field as any).area_hectares ?? ((field as any).area ? Number((field as any).area)/2.381 : 'غير متوفر'))} هكتار
- نوع التربة: ${field.soil_analysis?.ph_level ? `pH: ${field.soil_analysis.ph_level}` : 'غير محدد'}
- المحصول الحالي: ${crop?.name || 'غير محدد'}

بيانات الطقس:
- درجة الحرارة: ${weatherData.temperature}°C
- الرطوبة: ${weatherData.humidity}%
- الأمطار: ${weatherData.precipitation}mm
- سرعة الرياح: ${weatherData.wind_speed}km/h

${context ? `السياق الإضافي: ${context}` : ''}

قدم 3-5 توصيات عملية مع:
1. نوع التوصية (ري، تسميد، مكافحة آفات، حصاد، زراعة)
2. الأولوية (منخفضة، متوسطة، عالية، حرجة)
3. وصف مفصل
4. إجراءات محددة
5. مواعيد التنفيذ

أجب باللغة العربية بتنسيق JSON.
`;

    return basePrompt.trim();
  }

  /**
   * استدعاء OpenAI API
   */
  private static async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch(this.BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'أنت مساعد ذكي متخصص في الزراعة. قدم توصيات عملية ومفصلة باللغة العربية.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * تحليل استجابة AI وتحويلها إلى توصيات
   */
  private static parseRecommendations(
    aiResponse: string,
    fieldId: string
  ): AIRecommendation[] {
    try {
      // محاولة تحليل JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return this.convertToRecommendations(parsed, fieldId);
      }

      // إذا فشل التحليل، إنشاء توصية افتراضية
      return [this.createDefaultRecommendation(fieldId, aiResponse)];
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return [this.createDefaultRecommendation(fieldId, aiResponse)];
    }
  }

  /**
   * تحويل البيانات المحللة إلى توصيات
   */
  private static convertToRecommendations(
    data: any,
    fieldId: string
  ): AIRecommendation[] {
    const recommendations: AIRecommendation[] = [];
    
    if (Array.isArray(data.recommendations)) {
      data.recommendations.forEach((rec: any, index: number) => {
        recommendations.push({
          id: `ai_rec_${Date.now()}_${index}`,
          user_id: 'system', // سيتم تحديثه لاحقاً
          field_id: fieldId,
          recommendation_type: this.mapRecommendationType(rec.type),
          title: rec.title || `توصية ${index + 1}`,
          description: rec.description || rec.details || '',
          priority: this.mapPriority(rec.priority),
          confidence_score: rec.confidence || 0.8,
          action_items: this.createActionItems(rec.actions || []),
          valid_until: this.calculateValidUntil(rec.priority),
          is_applied: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });
    }

    return recommendations;
  }

  /**
   * إنشاء توصية افتراضية
   */
  private static createDefaultRecommendation(
    fieldId: string,
    description: string
  ): AIRecommendation {
    return {
      id: `ai_rec_${Date.now()}_default`,
      user_id: 'system',
      field_id: fieldId,
      recommendation_type: 'irrigation',
      title: 'توصية ذكية',
      description: description.substring(0, 500),
      priority: 'medium',
      confidence_score: 0.7,
      action_items: [{
        id: `action_${Date.now()}`,
        description: 'مراجعة التوصية وتطبيقها حسب الحاجة',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_completed: false
      }],
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_applied: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * تحويل نوع التوصية
   */
  private static mapRecommendationType(type: string): RecommendationType {
    const typeMap: Record<string, RecommendationType> = {
      'ري': 'irrigation',
      'تسميد': 'fertilization',
      'مكافحة آفات': 'pest_control',
      'حصاد': 'harvest',
      'زراعة': 'planting'
    };
    return typeMap[type] || 'irrigation';
  }

  /**
   * تحويل الأولوية
   */
  private static mapPriority(priority: string): Priority {
    const priorityMap: Record<string, Priority> = {
      'منخفضة': 'low',
      'متوسطة': 'medium',
      'عالية': 'high',
      'حرجة': 'critical'
    };
    return priorityMap[priority] || 'medium';
  }

  /**
   * إنشاء عناصر الإجراءات
   */
  private static createActionItems(actions: any[]): ActionItem[] {
    return actions.map((action, index) => ({
      id: `action_${Date.now()}_${index}`,
      description: action.description || action,
      due_date: action.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_completed: false
    }));
  }

  /**
   * حساب تاريخ انتهاء الصلاحية
   */
  private static calculateValidUntil(priority: string): string {
    const days = {
      'low': 30,
      'medium': 14,
      'high': 7,
      'critical': 3
    };
    
    const daysToAdd = days[priority as keyof typeof days] || 14;
    return new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
  }

  /**
   * تحليل صحة المحصول
   */
  static async analyzeCropHealth(
    field: Field,
    crop: Crop,
    weatherData: WeatherData
  ): Promise<{
    health_score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const prompt = `
تحليل صحة المحصول:

المحصول: ${crop.name}
المساحة: ${((field as any).area_hectares ?? ((field as any).area ? Number((field as any).area)/2.381 : 'غير متوفر'))} هكتار
الطقس: ${weatherData.temperature}°C, رطوبة ${weatherData.humidity}%

قم بتقييم:
1. درجة الصحة (0-100)
2. المشاكل المحتملة
3. التوصيات للتحسين

أجب باللغة العربية.
`;

    try {
      const response = await this.callOpenAI(prompt);
      return this.parseCropHealthResponse(response);
    } catch (error) {
      console.error('Crop health analysis error:', error);
      return {
        health_score: 75,
        issues: ['تحليل غير متاح حالياً'],
        recommendations: ['مراجعة البيانات يدوياً']
      };
    }
  }

  /**
   * تحليل استجابة صحة المحصول
   */
  private static parseCropHealthResponse(response: string): {
    health_score: number;
    issues: string[];
    recommendations: string[];
  } {
    // تحليل بسيط للنص
    const healthMatch = response.match(/(\d+)/);
    const health_score = healthMatch ? parseInt(healthMatch[1]) : 75;

    return {
      health_score: Math.min(100, Math.max(0, health_score)),
      issues: ['تحليل أولي - يحتاج مراجعة'],
      recommendations: [response.substring(0, 200)]
    };
  }

  /**
   * تنظيف التخزين المؤقت
   */
  static clearCache(): void {
    this.cache.clear();
  }

  /**
   * التحقق من صحة API key
   */
  static async validateApiKey(): Promise<boolean> {
    if (!this.API_KEY) {
      return false;
    }

    try {
      const response = await fetch(this.BASE_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
