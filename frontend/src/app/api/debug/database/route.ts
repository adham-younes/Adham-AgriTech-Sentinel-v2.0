import { NextResponse } from "next/server"
import { createServiceSupabaseClient } from "@/lib/supabase/service-client"

export async function GET() {
  try {
    const supabase = createServiceSupabaseClient()
    
    // Check if fields table exists and has data
    const { data: fields, error: fieldsError, count: fieldsCount } = await supabase
      .from("fields")
      .select("*", { count: "exact", head: true })
    
    if (fieldsError) {
      return NextResponse.json({ 
        error: "Fields table error", 
        details: fieldsError.message 
      }, { status: 500 })
    }
    
    // Check if farms table exists and has data
    const { data: farms, error: farmsError, count: farmsCount } = await supabase
      .from("farms")
      .select("*", { count: "exact", head: true })
    
    if (farmsError) {
      return NextResponse.json({ 
        error: "Farms table error", 
        details: farmsError.message 
      }, { status: 500 })
    }
    
    // Check if farm_owners table exists
    const { data: farmOwners, error: farmOwnersError, count: farmOwnersCount } = await supabase
      .from("farm_owners")
      .select("*", { count: "exact", head: true })
    
    if (farmOwnersError) {
      return NextResponse.json({ 
        error: "Farm owners table error", 
        details: farmOwnersError.message 
      }, { status: 500 })
    }
    
    // Check if profiles table exists and has data (users are in auth schema)
    const { data: profiles, error: profilesError, count: profilesCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
    
    if (profilesError) {
      return NextResponse.json({ 
        error: "Profiles table error", 
        details: profilesError.message 
      }, { status: 500 })
    }
    
    // Get sample field data with satellite metrics
    const { data: sampleFields, error: sampleError } = await supabase
      .from("fields")
      .select("id, name, area, last_ndvi, last_moisture, last_temperature, last_reading_at, farm_id")
      .limit(5)
    
    // Get sample farm data
    const { data: sampleFarms, error: sampleFarmsError } = await supabase
      .from("farms")
      .select("id, name, latitude, longitude")
      .limit(3)
    
    // Get sample user data with their farms and fields
    const { data: sampleUsers, error: sampleUsersError } = await supabase
      .from("profiles")
      .select(`
        id, email,
        farm_owners!inner (
          farm_id,
          farms!inner (
            id, name,
            fields (
              id, name, area, last_ndvi, last_moisture, last_temperature
            )
          )
        )
      `)
      .limit(2)
    
    // Check field-farm relationships
    const { data: fieldFarmRelations, error: relationError } = await supabase
      .from("fields")
      .select("id, name, farm_id, farms!inner(id, name)")
      .limit(5)
    
    return NextResponse.json({
      fieldsCount: fieldsCount ?? 0,
      farmsCount: farmsCount ?? 0,
      farmOwnersCount: farmOwnersCount ?? 0,
      profilesCount: profilesCount ?? 0,
      sampleFields: sampleFields || [],
      sampleFarms: sampleFarms || [],
      sampleUsersWithFarmsAndFields: sampleUsers || [],
      fieldFarmRelations: fieldFarmRelations || [],
      message: "Database tables exist",
      hasSampleData: (fieldsCount ?? 0) > 0 && (farmsCount ?? 0) > 0,
      hasUserRelations: (Array.isArray(sampleUsers) && sampleUsers.length > 0)
    })
  } catch (error) {
    console.error("[Debug] Database check failed:", error)
    return NextResponse.json({ 
      error: "Database check failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
