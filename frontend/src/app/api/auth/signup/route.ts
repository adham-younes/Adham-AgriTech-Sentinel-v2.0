import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type SignUpPayload = {
  email?: string
  password?: string
  fullName?: string
  phone?: string
  role?: string
}

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error("[Auth API] Supabase config missing", {
      supabaseUrl: !!supabaseUrl,
      serviceKey: !!serviceKey,
    })
    throw new Error("Missing Supabase service role configuration")
  }

  console.info("[Auth API] Admin client initialized", {
    supabaseUrl,
    timestamp: new Date().toISOString(),
  })

  return createClient(supabaseUrl, serviceKey)
}

function validatePayload(payload: SignUpPayload) {
  if (!payload.email || !payload.password) {
    return "Email and password are required"
  }
  if (payload.password.length < 6) {
    return "Password must be at least 6 characters"
  }
  return null
}

export async function POST(request: Request) {
  let payload: SignUpPayload
  try {
    payload = (await request.json()) as SignUpPayload
  } catch (error) {
    return NextResponse.json({ error: "Invalid signup payload" }, { status: 400 })
  }

  const validationError = validatePayload(payload)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 422 })
  }

  try {
    console.info("[Auth API] Sign-up payload received", {
      email: payload.email,
      role: payload.role ?? "farmer",
      timestamp: new Date().toISOString(),
    })

    const supabase = createAdminClient()
    const { error } = await supabase.auth.admin.createUser({
      email: payload.email!,
      password: payload.password!,
      email_confirm: true,
      user_metadata: {
        full_name: payload.fullName ?? null,
        phone: payload.phone ?? null,
        role: payload.role ?? null,
      },
    })

    if (error) {
      console.warn("[Auth API] createUser failed", {
        message: error.message,
        code: (error as any)?.code,
      })
      return NextResponse.json(
        { error: error.message, code: (error as any)?.code ?? "SUPABASE_ERROR" },
        { status: 500 },
      )
    }

    console.info("[Auth API] User created", {
      email: payload.email,
      role: payload.role ?? "farmer",
    })

    // Auto-create default farm for new user
    try {
      // Get the newly created user's ID
      const { data: userData } = await supabase.auth.admin.getUserByEmail(payload.email!)
      const userId = userData.user?.id
      
      if (!userId) {
        console.warn("[Auth API] Could not retrieve user ID for farm creation")
        return NextResponse.json({ success: true, message: "User created" })
      }

      const defaultFarmPayload = {
        name: `${payload.fullName || "Farm"} - Default Farm`,
        location: "Egypt",
        description: "Default farm created during registration",
        total_area: 10.0,
        latitude: 30.0444, // Egypt coordinates
        longitude: 31.2357,
      }

      // Try modern schema first, fallback to legacy if needed
      let farmError = null
      try {
        const { error } = await supabase.from("farms").insert({
          ...defaultFarmPayload,
          user_id: userId,
        })
        farmError = error
      } catch (schemaError) {
        // Fallback to legacy schema
        const { error } = await supabase.from("farms").insert({
          name: defaultFarmPayload.name,
          location: defaultFarmPayload.location,
          description: defaultFarmPayload.description,
          area: defaultFarmPayload.total_area,
          latitude: defaultFarmPayload.latitude,
          longitude: defaultFarmPayload.longitude,
          owner_id: userId,
        })
        farmError = error
      }

      if (farmError) {
        console.warn("[Auth API] Failed to create default farm", {
          error: farmError.message,
          email: payload.email,
        })
      } else {
        console.info("[Auth API] Default farm created successfully", {
          email: payload.email,
          userId,
        })
      }
    } catch (farmCreateError) {
      console.warn("[Auth API] Error during default farm creation", farmCreateError)
    }

    return NextResponse.json({ success: true, message: "User created" })
  } catch (error) {
    console.error("[Auth API] Unexpected error:", error)
    return NextResponse.json(
      { error: "Unable to create account", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 },
    )
  }
}
