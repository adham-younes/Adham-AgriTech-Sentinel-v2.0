import { z } from "zod"

export const sensorReadingSchema = z.object({
  sensorId: z.string().min(3, "sensorId is required"),
  fieldId: z.string().uuid().optional(),
  timestamp: z.union([z.string().datetime(), z.number()]).optional(),
  moisture: z.number().min(0).max(100).optional(),
  temperature: z.number().min(-60).max(120).optional(),
  pH: z.number().min(0).max(14).optional(),
  salinity: z.number().min(0).optional(),
  batteryStatus: z.number().min(0).max(100).optional(),
  payload: z.record(z.string(), z.any()).optional(),
})

export type SensorReadingPayload = z.infer<typeof sensorReadingSchema>

export function normaliseSensorReading(payload: SensorReadingPayload) {
  const recordedAt = (() => {
    if (!payload.timestamp) return new Date().toISOString()
    if (typeof payload.timestamp === "number") {
      return new Date(payload.timestamp).toISOString()
    }
    const parsed = new Date(payload.timestamp)
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Invalid timestamp provided")
    }
    return parsed.toISOString()
  })()

  return {
    moisture: payload.moisture ?? null,
    temperature: payload.temperature ?? null,
    ph: payload.pH ?? null,
    salinity: payload.salinity ?? null,
    battery_status: payload.batteryStatus ?? null,
    recorded_at: recordedAt,
    payload: payload.payload ?? null,
  }
}
