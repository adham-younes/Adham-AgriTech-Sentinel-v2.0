import assert from "node:assert/strict"
import { normaliseSensorReading, sensorReadingSchema } from "../lib/sensors/schema"

const validPayload = {
  sensorId: "SENSOR-123",
  fieldId: "550e8400-e29b-41d4-a716-446655440000",
  timestamp: "2025-01-01T10:00:00.000Z",
  moisture: 42.5,
  temperature: 26.3,
  pH: 6.4,
  salinity: 1.2,
  batteryStatus: 88,
}

const parsed = sensorReadingSchema.safeParse(validPayload)
assert.equal(parsed.success, true, "Valid payload should pass validation")

const normalised = normaliseSensorReading(parsed.data)
assert.equal(normalised.recorded_at, "2025-01-01T10:00:00.000Z")
assert.equal(normalised.moisture, 42.5)
assert.equal(normalised.temperature, 26.3)
assert.equal(normalised.ph, 6.4)

const invalidPayload = {
  sensorId: "",
  moisture: 120,
}
const invalidResult = sensorReadingSchema.safeParse(invalidPayload)
assert.equal(invalidResult.success, false, "Invalid payload should fail validation")

console.log("sensors-payload.test.ts passed ✅")
