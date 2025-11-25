export interface IrrigationRecommendation {
  fieldId: string
  amountMm: number
  durationMinutes: number
  schedule: string
  reason: string
}

export class IrrigationService {
  private static instance: IrrigationService

  private constructor() {}

  public static getInstance(): IrrigationService {
    if (!IrrigationService.instance) {
      IrrigationService.instance = new IrrigationService()
    }
    return IrrigationService.instance
  }

  async getRecommendation(fieldId: string, moistureLevel: number): Promise<IrrigationRecommendation> {
    // Logic to determine irrigation needs
    const needsWater = moistureLevel < 40
    
    return {
      fieldId,
      amountMm: needsWater ? 25 : 0,
      durationMinutes: needsWater ? 45 : 0,
      schedule: needsWater ? "Tonight 20:00" : "None",
      reason: needsWater ? "Low soil moisture detected" : "Moisture levels optimal"
    }
  }
}

export const irrigationService = IrrigationService.getInstance()
