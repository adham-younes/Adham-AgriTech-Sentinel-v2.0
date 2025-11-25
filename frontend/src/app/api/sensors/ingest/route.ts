import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { normaliseSensorReading, sensorReadingSchema } from "@/lib/sensors/schema"
import { isSensorsFeatureEnabled } from "@/lib/config/sensors"

function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error("[Sensors API] Missing Supabase configuration", {
      hasUrl: !!supabaseUrl,
      hasKey: !!serviceKey,
    })
    throw new Error("Missing Supabase configuration")
  }

  return createClient(supabaseUrl, serviceKey)
}

export async function POST(request: Request) {
  if (!isSensorsFeatureEnabled()) {
    return NextResponse.json(
      { message: "Sensors ingestion disabled", code: "SENSORS_DISABLED" },
      { status: 503 },
    )
  }

  const expectedKey = process.env.SENSORS_API_KEY
  if (!expectedKey) {
    return NextResponse.json(
      { message: "Sensors API key not configured", code: "CONFIG_MISSING" },
      { status: 500 },
    )
  }

  const providedKey = request.headers.get("x-api-key")
  if (!providedKey || providedKey !== expectedKey) {
    return NextResponse.json(
      { message: "Unauthorized sensor client", code: "UNAUTHORIZED" },
      { status: 401 },
    )
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch (error) {
    return NextResponse.json({ message: "Invalid JSON payload", code: "BAD_JSON" }, { status: 400 })
  }

  const parsed = sensorReadingSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Sensor payload validation failed",
        code: "INVALID_PAYLOAD",
        details: parsed.error.flatten(),
      },
      { status: 422 },
    )
  }

  const supabase = createServiceClient()
  const readingMeta = parsed.data

  const { data: sensorRecord, error: sensorLookupError } = await supabase
    .from("sensors")
    .select("id, field_id, sensor_type")
    .eq("hardware_id", readingMeta.sensorId)
    .maybeSingle()

  if (sensorLookupError) {
    console.error("[Sensors API] Failed to lookup sensor", sensorLookupError)
    return NextResponse.json(
      { message: "Failed to lookup sensor", code: "SENSOR_LOOKUP_FAILED" },
      { status: 500 },
    )
  }

  let sensorId = sensorRecord?.id ?? null
  let fieldId = sensorRecord?.field_id ?? readingMeta.fieldId ?? null

  if (!sensorId) {
    if (!fieldId) {
      return NextResponse.json(
        { message: "Sensor not registered and fieldId missing", code: "UNKNOWN_SENSOR" },
        { status: 404 },
      )
    }

    const { data: inserted, error: insertSensorError } = await supabase
      .from("sensors")
      .insert({
        field_id: fieldId,
        hardware_id: readingMeta.sensorId,
        sensor_type: readingMeta.salinity || readingMeta.pH ? "multi" : "moisture",
        status: "online",
      })
      .select("id, field_id")
      .single()

    if (insertSensorError || !inserted) {
      console.error("[Sensors API] Unable to auto-register sensor", insertSensorError)
      return NextResponse.json(
        { message: "Unable to register sensor", code: "SENSOR_REGISTRATION_FAILED" },
        { status: 500 },
      )
    }

    sensorId = inserted.id
    fieldId = inserted.field_id
  }

  const normalised = (() => {
    try {
      return normaliseSensorReading(readingMeta)
    } catch (error) {
      return null
    }
  })()

  if (!normalised) {
    return NextResponse.json(
      { message: "Invalid timestamp provided", code: "INVALID_TIMESTAMP" },
      { status: 422 },
    )
  }

  const readingRow = {
    sensor_id: sensorId,
    recorded_at: normalised.recorded_at,
    moisture: normalised.moisture,
    temperature: normalised.temperature,
    ph: normalised.ph,
    salinity: normalised.salinity,
    battery_status: normalised.battery_status,
    payload: readingMeta.payload ?? null,
  }

  const { error: insertReadingError } = await supabase.from("sensor_readings").insert(readingRow)
  if (insertReadingError) {
    console.error("[Sensors API] Failed to insert reading", insertReadingError)
    return NextResponse.json(
      { message: "Failed to store reading", code: "READING_INSERT_FAILED" },
      { status: 500 },
    )
  }

  const { error: updateSensorError } = await supabase
    .from("sensors")
    .update({ last_reading_at: normalised.recorded_at, last_payload: readingMeta.payload ?? null })
    .eq("id", sensorId)

  if (updateSensorError) {
    console.warn("[Sensors API] Reading stored but sensor metadata update failed", updateSensorError)
  }

  if (fieldId) {
    await supabase
      .from("fields")
      .update({
        last_moisture: normalised.moisture ?? null,
        last_temperature: normalised.temperature ?? null,
        last_reading_at: normalised.recorded_at,
      })
      .eq("id", fieldId)
  }

  console.info("[Sensors API] Reading stored", {
    sensorId,
    fieldId,
    recordedAt: normalised.recorded_at,
  })

  return NextResponse.json(
    {
      message: "Sensor reading recorded",
      code: "SENSOR_READING_RECORDED",
      details: {
        sensorId,
        recordedAt: normalised.recorded_at,
      },
    },
    { status: 201 },
  )
}
