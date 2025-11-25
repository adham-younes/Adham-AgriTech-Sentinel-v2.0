// ===========================================
// Adham AgriTech - Domain Types
// ===========================================

// ===== Base Types =====
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends BaseEntity {
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: 'farmer' | 'admin' | 'advisor';
  language: 'ar' | 'en';
  timezone: string;
  is_active: boolean;
}

// ===== Farm Domain =====
export interface Farm extends BaseEntity {
  name: string;
  description?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    country: string;
  };
  size_hectares: number;
  soil_type: SoilType;
  climate_zone: ClimateZone;
  owner_id: string;
  is_active: boolean;
  established_date: string;
}

export type SoilType = 
  | 'clay' | 'sandy' | 'loamy' | 'silty' | 'peaty' | 'chalky';

export type ClimateZone = 
  | 'tropical' | 'subtropical' | 'temperate' | 'continental' | 'polar';

// ===== Field Domain =====
export interface Field extends BaseEntity {
  farm_id: string;
  name: string;
  description?: string;
  area_hectares: number;
  coordinates: GeoCoordinate[];
  soil_analysis?: SoilAnalysis;
  irrigation_system?: IrrigationSystem;
  current_crop?: Crop;
  planting_date?: string;
  expected_harvest?: string;
  is_active: boolean;
}

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export interface SoilAnalysis extends BaseEntity {
  field_id: string;
  ph_level: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  organic_matter: number;
  moisture_content: number;
  analysis_date: string;
  recommendations?: string[];
}

// ===== Crop Domain =====
export interface Crop extends BaseEntity {
  name: string;
  scientific_name: string;
  variety?: string;
  planting_season: Season;
  growth_days: number;
  water_requirements: WaterRequirements;
  soil_preferences: SoilPreference[];
  climate_preferences: ClimatePreference[];
  harvest_yield_per_hectare: number;
  market_price_per_kg: number;
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface WaterRequirements {
  daily_liters_per_hectare: number;
  irrigation_frequency_days: number;
  critical_growth_stages: string[];
}

export interface SoilPreference {
  soil_type: SoilType;
  ph_min: number;
  ph_max: number;
  drainage_requirement: 'high' | 'medium' | 'low';
}

export interface ClimatePreference {
  climate_zone: ClimateZone;
  min_temperature: number;
  max_temperature: number;
  humidity_range: [number, number];
}

// ===== Weather Domain =====
export interface WeatherData extends BaseEntity {
  location: GeoCoordinate;
  temperature: number;
  humidity: number;
  precipitation: number;
  wind_speed: number;
  wind_direction: number;
  pressure: number;
  uv_index: number;
  visibility: number;
  weather_condition: WeatherCondition;
  recorded_at: string;
  forecast_days?: number;
}

export type WeatherCondition = 
  | 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'foggy' | 'snowy';

// ===== Irrigation Domain =====
export interface IrrigationSystem extends BaseEntity {
  field_id: string;
  system_type: IrrigationType;
  capacity_liters_per_hour: number;
  coverage_percentage: number;
  efficiency_rating: number;
  last_maintenance?: string;
  next_maintenance?: string;
  is_automated: boolean;
  sensors: IrrigationSensor[];
}

export type IrrigationType = 
  | 'drip' | 'sprinkler' | 'flood' | 'center_pivot' | 'manual';

export interface IrrigationSensor {
  id: string;
  sensor_type: 'moisture' | 'flow' | 'pressure' | 'temperature';
  location: GeoCoordinate;
  last_reading: number;
  last_reading_time: string;
  is_active: boolean;
}

// ===== Market Domain =====
export interface MarketPrice extends BaseEntity {
  crop_id: string;
  market_name: string;
  price_per_kg: number;
  currency: string;
  quality_grade: QualityGrade;
  region: string;
  recorded_date: string;
  source: string;
}

export type QualityGrade = 'premium' | 'standard' | 'commercial';

// ===== AI Assistant Domain =====
export interface AIRecommendation extends BaseEntity {
  user_id: string;
  field_id?: string;
  recommendation_type: RecommendationType;
  title: string;
  description: string;
  priority: Priority;
  confidence_score: number;
  action_items: ActionItem[];
  valid_until?: string;
  is_applied: boolean;
  applied_at?: string;
}

export type RecommendationType = 
  | 'irrigation' | 'fertilization' | 'pest_control' | 'harvest' | 'planting';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface ActionItem {
  id: string;
  description: string;
  due_date: string;
  is_completed: boolean;
  completed_at?: string;
}

export * from "./billing"

// ===== Report Domain =====
export interface Report extends BaseEntity {
  user_id: string;
  farm_id?: string;
  field_id?: string;
  report_type: ReportType;
  title: string;
  content: ReportContent;
  generated_at: string;
  period_start: string;
  period_end: string;
  is_public: boolean;
  tags: string[];
}

export type ReportType = 
  | 'farm_summary' | 'field_analysis' | 'weather_report' | 
    'irrigation_optimization' | 'market_analysis' | 'ai_recommendations';

export interface ReportContent {
  summary: string;
  data: Record<string, any>;
  charts: ChartData[];
  recommendations: string[];
  attachments: Attachment[];
}

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'scatter';
  title: string;
  data: any[];
  x_axis: string;
  y_axis: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'excel' | 'csv';
  url: string;
  size_bytes: number;
}

// ===== API Response Types =====
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

// ===== Form Types =====
export interface CreateFarmForm {
  name: string;
  description?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    country: string;
  };
  size_hectares: number;
  soil_type: SoilType;
  climate_zone: ClimateZone;
}

export interface CreateFieldForm {
  farm_id: string;
  name: string;
  description?: string;
  area_hectares: number;
  coordinates: GeoCoordinate[];
  soil_analysis?: Partial<SoilAnalysis>;
}

// ===== Calculation Results =====
export interface WaterIndexCalculation {
  field_id: string;
  current_moisture: number;
  optimal_moisture: number;
  water_deficit: number;
  irrigation_recommendation: {
    amount_liters: number;
    duration_hours: number;
    urgency: Priority;
  };
  calculated_at: string;
}

export interface WeatherImpactAnalysis {
  field_id: string;
  weather_data: WeatherData;
  crop_impact: {
    growth_stage: string;
    risk_level: 'low' | 'medium' | 'high';
    recommendations: string[];
  };
  irrigation_impact: {
    adjustment_percentage: number;
    reason: string;
  };
  calculated_at: string;
}

// ===== Error Types =====
export interface DomainError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

export class ValidationError extends Error {
  constructor(
    public field: string,
    public message: string,
    public value?: any
  ) {
    super(`Validation error in ${field}: ${message}`);
    this.name = 'ValidationError';
  }
}

export class BusinessLogicError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'BusinessLogicError';
  }
}