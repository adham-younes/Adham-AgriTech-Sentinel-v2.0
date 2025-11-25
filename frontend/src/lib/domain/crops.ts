import type { SupabaseClient } from "@supabase/supabase-js"

type DbClient = SupabaseClient<any, any, any>

export type CropCategoryRecord = {
  id: number
  name_en: string
  name_ar: string
}

export type CropRecord = {
  id: number
  name_en: string
  name_ar: string
  category_id: number
  water_requirement_en: string | null
  water_requirement_ar: string | null
  soil_type_en: string | null
  soil_type_ar: string | null
  ph_min: number | null
  ph_max: number | null
  ec_min: number | null
  ec_max: number | null
  salt_sensitivity_en: string | null
  salt_sensitivity_ar: string | null
  optimal_temp_min_c: number | null
  optimal_temp_max_c: number | null
  suitable_regions_en: string | null
  suitable_regions_ar: string | null
  days_to_emergence: number | null
  days_to_flowering: number | null
  days_to_maturity: number | null
}

export type GrowthStageRecord = {
  id: number
  crop_id: number
  stage_name_en: string
  stage_name_ar: string
  ndvi_min: number | null
  ndvi_optimal: number | null
  ndvi_max: number | null
  chlorophyll_min: number | null
  chlorophyll_max: number | null
  soil_moisture_min: number | null
  soil_moisture_optimal: number | null
  soil_moisture_max: number | null
  temp_min_c: number | null
  temp_optimal_c: number | null
  temp_max_c: number | null
  ph_min: number | null
  ph_max: number | null
  ec_max: number | null
}

export type DiseasePestRecord = {
  id: number
  name_en: string
  name_ar: string
  type_en: string
  type_ar: string
  conditions_en: string | null
  conditions_ar: string | null
  severity_en: string | null
  severity_ar: string | null
}

export type SoilTypeRecord = {
  id: number
  name_en: string
  name_ar: string
}

export type TreatmentRecord = {
  id: number
  name_en: string
  name_ar: string
  type_en: string | null
  type_ar: string | null
  description_en: string | null
  description_ar: string | null
  notes_en: string | null
  notes_ar: string | null
}

export type FertilizerRecord = {
  id: number
  name_en: string
  name_ar: string
  type_en: string | null
  type_ar: string | null
  usage_en: string | null
  usage_ar: string | null
  composition: string | null
}

export type PesticideRecord = {
  id: number
  name_en: string
  name_ar: string
  target_en: string
  target_ar: string
  usage_en: string | null
  usage_ar: string | null
  active_ingredients: string | null
}

export async function getCropCategoryById(
  client: DbClient,
  categoryId: number,
): Promise<CropCategoryRecord | null> {
  const { data, error } = await client.from("crop_categories").select("*").eq("id", categoryId).maybeSingle()

  if (error) {
    console.warn("[CropKnowledge] getCropCategoryById failed:", error)
    return null
  }

  return (data as CropCategoryRecord) ?? null
}

export async function getCropByNameOrId(
  client: DbClient,
  params: { id?: number | null; name?: string | null },
): Promise<CropRecord | null> {
  const { id, name } = params

  if (id != null) {
    const { data, error } = await client.from("crops").select("*").eq("id", id).maybeSingle()
    if (error) {
      console.warn("[CropKnowledge] getCropByNameOrId (id) failed:", error)
      return null
    }
    return (data as CropRecord) ?? null
  }

  const trimmed = (name ?? "").trim()
  if (!trimmed) return null

  // Try exact match on English then Arabic names
  const exactEn = await client.from("crops").select("*").eq("name_en", trimmed).limit(1)
  if (exactEn.error) {
    console.warn("[CropKnowledge] getCropByNameOrId (name_en) failed:", exactEn.error)
  } else if (exactEn.data && exactEn.data.length > 0) {
    return exactEn.data[0] as CropRecord
  }

  const exactAr = await client.from("crops").select("*").eq("name_ar", trimmed).limit(1)
  if (exactAr.error) {
    console.warn("[CropKnowledge] getCropByNameOrId (name_ar) failed:", exactAr.error)
  } else if (exactAr.data && exactAr.data.length > 0) {
    return exactAr.data[0] as CropRecord
  }

  return null
}

export async function getSoilTypeByNameOrId(
  client: DbClient,
  params: { id?: number | null; name?: string | null },
): Promise<SoilTypeRecord | null> {
  const { id, name } = params

  if (id != null) {
    const { data, error } = await client.from("soil_types").select("id, name_en, name_ar").eq("id", id).maybeSingle()
    if (error) {
      console.warn("[CropKnowledge] getSoilTypeByNameOrId (id) failed:", error)
      return null
    }
    return (data as SoilTypeRecord) ?? null
  }

  const trimmed = (name ?? "").trim()
  if (!trimmed) return null

  const exactEn = await client.from("soil_types").select("id, name_en, name_ar").eq("name_en", trimmed).limit(1)
  if (exactEn.error) {
    console.warn("[CropKnowledge] getSoilTypeByNameOrId (name_en) failed:", exactEn.error)
  } else if (exactEn.data && exactEn.data.length > 0) {
    return exactEn.data[0] as SoilTypeRecord
  }

  const exactAr = await client.from("soil_types").select("id, name_en, name_ar").eq("name_ar", trimmed).limit(1)
  if (exactAr.error) {
    console.warn("[CropKnowledge] getSoilTypeByNameOrId (name_ar) failed:", exactAr.error)
  } else if (exactAr.data && exactAr.data.length > 0) {
    return exactAr.data[0] as SoilTypeRecord
  }

  return null
}

export async function getGrowthStagesForCrop(client: DbClient, cropId: number): Promise<GrowthStageRecord[]> {
  const { data, error } = await client
    .from("growth_stages")
    .select("*")
    .eq("crop_id", cropId)
    .order("id", { ascending: true })

  if (error) {
    console.warn("[CropKnowledge] getGrowthStagesForCrop failed:", error)
    return []
  }

  return (data as GrowthStageRecord[]) ?? []
}

export async function getPestsForCrop(client: DbClient, cropId: number): Promise<DiseasePestRecord[]> {
  const { data, error } = await client
    .from("crop_diseases")
    .select("disease_pests(*)")
    .eq("crop_id", cropId)

  if (error) {
    console.warn("[CropKnowledge] getPestsForCrop failed:", error)
    return []
  }

  const rows = (data as unknown as { disease_pests: DiseasePestRecord | null }[]) ?? []
  return rows.map((row) => row.disease_pests).filter((issue): issue is DiseasePestRecord => issue != null)
}

export async function getRecommendedFertilizersForCrop(
  client: DbClient,
  cropId?: number | null,
  limit = 8,
): Promise<FertilizerRecord[]> {
  // Currently returns a generic set of fertilizers.
  // In future this can be refined per crop once mapping data is available.
  const query = client.from("fertilizers").select("*").limit(limit)
  const { data, error } = await query

  if (error) {
    console.warn("[CropKnowledge] getRecommendedFertilizersForCrop failed:", error, { cropId })
    return []
  }

  return (data as FertilizerRecord[]) ?? []
}

export async function getPesticidesReference(
  client: DbClient,
  limit = 8,
): Promise<PesticideRecord[]> {
  const { data, error } = await client.from("pesticides").select("*").limit(limit)

  if (error) {
    console.warn("[CropKnowledge] getPesticidesReference failed:", error)
    return []
  }

  return (data as PesticideRecord[]) ?? []
}

export async function getTreatmentsForDiseasePests(
  client: DbClient,
  issueIds: number[],
): Promise<Record<number, TreatmentRecord[]>> {
  if (!issueIds.length) return {}

  const { data, error } = await client
    .from("issue_treatments")
    .select("issue_id, treatments(*)")
    .in("issue_id", issueIds)

  if (error) {
    console.warn("[CropKnowledge] getTreatmentsForDiseasePests failed:", error, { issueIds })
    return {}
  }

  const rows = (data as unknown as { issue_id: number; treatments: TreatmentRecord | null }[]) ?? []
  const map: Record<number, TreatmentRecord[]> = {}

  for (const row of rows) {
    if (!row.treatments) continue
    const bucket = map[row.issue_id] ?? []
    bucket.push(row.treatments)
    map[row.issue_id] = bucket
  }

  return map
}
