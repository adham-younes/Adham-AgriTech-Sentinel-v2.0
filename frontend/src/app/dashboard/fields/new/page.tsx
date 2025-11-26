"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import Image from "next/image"
import { useTranslation } from "@/lib/i18n/use-language"

const FieldBoundaryEditor = dynamic(
  () => import("@/components/maps/field-boundary-editor").then((mod) => mod.FieldBoundaryEditor),
  { ssr: false },
)

type Polygon = GeoJSON.Polygon | null

type FarmRecord = {
  id: string
  name: string
  total_area?: number | null
  latitude?: number | null
  longitude?: number | null
}

type FarmOwnerRow = {
  farm_id?: string | null
}

type FormData = {
  name: string
  farm_id: string
  crop_type: string
  soil_type: string
}

const SQUARE_METERS_PER_FEDDAN = 4200
const SQUARE_METERS_PER_HECTARE = 10_000

export default function NewFieldPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language, setLanguage } = useTranslation()
  const farmIdParam = searchParams?.get("farm_id") ?? ""

  const [loading, setLoading] = useState(false)
  const [farms, setFarms] = useState<FarmRecord[]>([])
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")
  const [boundary, setBoundary] = useState<Polygon>(null)
  const [boundaryError, setBoundaryError] = useState<string | null>(null)
  const [autoAreaMeters, setAutoAreaMeters] = useState<number | null>(null)
  const [useManualArea, setUseManualArea] = useState(false)
  const [manualArea, setManualArea] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: "",
    farm_id: farmIdParam,
    crop_type: "",
    soil_type: "",
  })

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (language === "ar" || language === "en") {
      setLang(language)
    }
  }, [language])

  const selectedFarm = useMemo(
    () => farms.find((farm) => farm.id === formData.farm_id) ?? null,
    [farms, formData.farm_id],
  )

  const selectedFarmAreaFeddan = useMemo(() => {
    if (!selectedFarm || selectedFarm.total_area == null) return null
    const value = Number(selectedFarm.total_area)
    return Number.isFinite(value) ? value : null
  }, [selectedFarm])

  const selectedFarmCoordsText = useMemo(() => {
    if (!selectedFarm || selectedFarm.latitude == null || selectedFarm.longitude == null) return null
    const lat = Number(selectedFarm.latitude).toFixed(5)
    const lng = Number(selectedFarm.longitude).toFixed(5)
    return `${lat}, ${lng}`
  }, [selectedFarm])

  const updateFormField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleInputChange = (field: keyof FormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    updateFormField(field, event.target.value)
  }

  const handleManualAreaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setManualArea(event.target.value)
  }

  useEffect(() => {
    fetchFarms()
  }, [])

  useEffect(() => {
    if (!formData.farm_id && farms.length > 0) {
      setFormData((prev) => ({ ...prev, farm_id: prev.farm_id || farms[0].id }))
    }
  }, [farms, formData.farm_id])

  async function fetchFarms() {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) {
        setFarms([])
        return
      }

      const { data: ownershipRows, error: ownershipError } = await supabase
        .from("farm_owners")
        .select("farm_id")
        .eq("user_id", user.id)
        .eq("role", "owner")

      const farmIds =
        ownershipRows?.map((row) => row.farm_id).filter((id): id is string => Boolean(id)) ?? []

      const shouldFallbackToFarmsTable = ownershipError || farmIds.length === 0

      if (shouldFallbackToFarmsTable) {
        // Legacy path: rely on farms.owner_id when farm_owners bridge is empty or unavailable
        const { data, error } = await supabase
          .from("farms")
          .select("id, name, total_area, latitude, longitude")
          .eq("owner_id", user.id)
          .order("name")

        if (error) throw error
        setFarms(data || [])
        return
      }

      const { data, error } = await supabase
        .from("farms")
        .select("id, name, total_area, latitude, longitude")
        .in("id", farmIds)
        .order("name")
      if (error) throw error
      setFarms(data || [])
    } catch (error) {
      console.error("[v0] Error fetching farms:", error)
      setFarms([])
    }
  }

  const t = {
    ar: {
      title: "إضافة حقل جديد",
      back: "رجوع",
      name: "اسم الحقل",
      namePlaceholder: "اكتب اسم الحقل",
      nameRequired: "يرجى إدخال اسم الحقل قبل الحفظ.",
      farm: "اختر المزرعة",
      farmLocationLabel: "إحداثيات المزرعة (مركز تقريبي)",
      farmAreaInfo: "مساحة المزرعة المسجلة: {value} فدان",
      areaVsFarmWarning:
        "تنبيه: مساحة الحقل ({field}) فدان أكبر بكثير من مساحة المزرعة المسجلة ({farm}) فدان. راجع الحدود قبل الحفظ.",
      selectFarm: "حدد المزرعة",
      areaCardTitle: "المساحة المحسوبة تلقائياً",
      areaCardSubtitle: "ارسم حدود الحقل وسيتم احتساب المساحة تلقائياً.",
      areaReady: "جاهز",
      areaWaiting: "ارسم الحدود لحساب المساحة",
      areaFeddan: "المساحة بالفدان",
      areaHectare: "المساحة بالهكتار",
      areaAutoHint: "سنستخدم القيمة المحسوبة تلقائياً بعد إنهاء الرسم.",
      manualEnable: "تعديل المساحة يدوياً",
      manualDisable: "استخدم القيمة المحسوبة",
      manualLabel: "القيمة بالفدان",
      manualPlaceholder: "مثال: 12.5",
      manualUnit: "سيتم حفظ هذه القيمة بدلاً من المساحة المحسوبة.",
      manualHelp: "استخدم الإدخال اليدوي فقط إذا كانت لديك قيمة مؤكدة.",
      areaSaveLabel: "{value} فدان سيتم حفظها لهذا الحقل.",
      cropType: "المحصول الرئيسي",
      cropPlaceholder: "قمح، ذرة، قطن، إلخ",
      soilType: "نوع التربة",
      soilPlaceholder: "طينية، رملية، إلخ",
      boundary: "ارسم حدود الحقل على الخريطة",
      areaAuto: "يتم احتساب المساحة تلقائياً من الخريطة ويمكن تعديلها من البطاقة أعلاه.",
      cancel: "إلغاء",
      save: "حفظ الحقل",
      saving: "جاري الحفظ...",
      boundaryRequired: "يرجى رسم حدود الحقل قبل الحفظ.",
      successRedirect: "/dashboard/fields",
      areaMissing: "يرجى رسم الحدود أو إدخال المساحة يدوياً.",
      manualMissing: "أدخل قيمة المساحة اليدوية قبل المتابعة.",
      farmRequired: "يرجى اختيار المزرعة قبل حفظ الحقل.",
    },
    en: {
      title: "Add New Field",
      back: "Back",
      name: "Field Name",
      namePlaceholder: "Enter field name",
      nameRequired: "Please enter a field name before saving.",
      farm: "Farm",
      farmLocationLabel: "Farm location (approximate center)",
      farmAreaInfo: "Farm recorded area: {value} feddan",
      areaVsFarmWarning:
        "Warning: field area ({field} feddan) is much larger than the farm's recorded area ({farm} feddan). Please review the boundary before saving.",
      selectFarm: "Select farm",
      areaCardTitle: "Auto-calculated area",
      areaCardSubtitle: "Draw the boundary and we will measure the field automatically.",
      areaReady: "Ready",
      areaWaiting: "Draw boundary to calculate",
      areaFeddan: "Area (feddan)",
      areaHectare: "Area (hectare)",
      areaAutoHint: "We will rely on the calculated value once you finish drawing.",
      manualEnable: "Override manually",
      manualDisable: "Use calculated area",
      manualLabel: "Enter area (feddan)",
      manualPlaceholder: "e.g. 12.5",
      manualUnit: "This value overrides the calculated area.",
      manualHelp: "Only override if you have an official measurement.",
      areaSaveLabel: "{value} feddan will be stored for this field.",
      cropType: "Crop Type",
      cropPlaceholder: "Wheat, Corn, Cotton, etc.",
      soilType: "Soil Type",
      soilPlaceholder: "Clay, Sandy, etc.",
      boundary: "Draw the field boundary on the map",
      areaAuto: "Area is calculated automatically from the map. Use the card above to override it.",
      cancel: "Cancel",
      save: "Save Field",
      saving: "Saving...",
      boundaryRequired: "Please draw the field boundary before saving.",
      successRedirect: "/dashboard/fields",
      areaMissing: "Please draw the boundary or enter the area manually.",
      manualMissing: "Provide the manual area value before saving.",
      farmRequired: "Please select a farm before saving the field.",
    },
  } as const
  const heroCopy = {
    ar: {
      eyebrow: "Adham AgriTech",
      heading: "خريطة ذكية لحساب المساحة",
      description: "ارسم حدود الحقل وسنحسب المساحة تلقائياً بالفدان والهكتار، مع إمكانية التعديل اليدوي في أي لحظة.",
      bullets: [
        "اختر المزرعة وحدد اسم الحقل قبل البدء.",
        "استخدم زر \"استخدم موقعي كنقطة\" لتسريع تحديد الإحداثيات.",
        "ثبّت الحدود بعد وضع أربع نقاط واضحة ثم راجع المساحة المحسوبة.",
      ],
      imageAlt: "صور أقمار صناعية لحقول زراعية",
      imageCaption: "صور Mapbox مدمجة مع مكتبة الصور المحلية للحصول على أوضح تفاصيل للحدود.",
    },
    en: {
      eyebrow: "Adham AgriTech",
      heading: "Guided satellite mapping",
      description: "Draw your field boundary and we will keep the feddan/hectare values in sync, while still allowing manual overrides.",
      bullets: [
        "Select the farm and give the field a clear name.",
        "Use the \"Use my location\" shortcut to drop accurate points.",
        "Lock the boundary after all four points, then review the calculated area.",
      ],
      imageAlt: "Satellite imagery of farmlands",
      imageCaption: "Mapbox tiles blended with local imagery to highlight field borders without artifacts.",
    },
  } as const


  const autoAreaFeddan = useMemo(() => {
    if (!autoAreaMeters) return null
    return autoAreaMeters / SQUARE_METERS_PER_FEDDAN
  }, [autoAreaMeters])

  const autoAreaHectare = useMemo(() => {
    if (!autoAreaMeters) return null
    return autoAreaMeters / SQUARE_METERS_PER_HECTARE
  }, [autoAreaMeters])

  const currentAreaFeddan = useMemo(() => {
    if (useManualArea) {
      if (!manualArea.trim()) return null
      const parsed = Number.parseFloat(manualArea)
      return Number.isNaN(parsed) ? null : parsed
    }
    if (!autoAreaFeddan) return null
    return autoAreaFeddan
  }, [autoAreaFeddan, manualArea, useManualArea])

  const finalAreaPreview = useMemo(() => {
    if (currentAreaFeddan == null) return null
    return currentAreaFeddan.toFixed(2)
  }, [currentAreaFeddan])

  const showAreaWarning = useMemo(() => {
    if (selectedFarmAreaFeddan == null || currentAreaFeddan == null) return false
    return currentAreaFeddan > selectedFarmAreaFeddan * 1.2
  }, [selectedFarmAreaFeddan, currentAreaFeddan])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setFormError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      if (!formData.name.trim()) {
        setFormError(t[lang].nameRequired)
        setLoading(false)
        return
      }

      if (!formData.farm_id) {
        setFormError(t[lang].farmRequired)
        setLoading(false)
        return
      }

      if (!boundary) {
        const message = t[lang].boundaryRequired
        setBoundaryError(message)
        setFormError(message)
        setLoading(false)
        return
      }
      setBoundaryError(null)

      let resolvedAreaFeddan = autoAreaFeddan

      if (useManualArea) {
        const manualValue = manualArea.trim()
        const parsedManual = Number.parseFloat(manualValue)
        if (!manualValue || Number.isNaN(parsedManual)) {
          alert(t[lang].manualMissing)
          setLoading(false)
          return
        }
        resolvedAreaFeddan = parsedManual
      }

      if (resolvedAreaFeddan === null || Number.isNaN(resolvedAreaFeddan)) {
        alert(t[lang].areaMissing)
        setLoading(false)
        return
      }

      // Build payload for API route
      const payload: Record<string, unknown> = {
        farm_id: formData.farm_id,
        name: formData.name.trim(),
        area: Number(resolvedAreaFeddan.toFixed(2)),
        crop_type: formData.crop_type?.trim() || null,
        soil_type: formData.soil_type?.trim() || null,
      }

      // store GeoJSON (boundary_coordinates)
      payload.boundary_coordinates = boundary

      // compute centroid + lat/lng if available in schema
      try {
        const ring = (boundary.coordinates?.[0] ?? []) as [number, number][]
        if (ring.length > 0) {
          const sum = ring.reduce((acc, [lng, lat]) => ({ lng: acc.lng + lng, lat: acc.lat + lat }), { lng: 0, lat: 0 })
          const cx = sum.lng / ring.length
          const cy = sum.lat / ring.length
          payload.centroid = { type: "Point", coordinates: [cx, cy] }
          payload.latitude = cy
          payload.longitude = cx
        }
      } catch {
        // ignore centroid failure silently
      }

      const response = await fetch("/api/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const result = (await response.json().catch(() => ({}))) as {
        error?: string
        message?: string
        details?: string | null
      }

      if (!response.ok) {
        const base =
          lang === "ar" ? "حدث خطأ أثناء إنشاء الحقل" : "Error creating field"
        const serverMessage = result?.message || result?.error || result?.details || ""
        const fullMessage =
          serverMessage && serverMessage !== "Failed to create field"
            ? `${base}: ${serverMessage}`
            : base

        console.error("[v0] Error creating field (API error):", {
          status: response.status,
          body: result,
        })

        setFormError(fullMessage)
        alert(fullMessage)
        return
      }

      router.push(t[lang].successRedirect)
    } catch (error) {
      console.error("[v0] Error creating field (unexpected):", error)
      const fallback =
        lang === "ar" ? "حدث خطأ أثناء إنشاء الحقل" : "Error creating field"
      setFormError(fallback)
      alert(fallback)
    } finally {
      setLoading(false)
    }
  }

  const boundaryInstructions = useMemo(
    () =>
      lang === "ar"
        ? "ضع أربع نقاط يدوياً (زوايا الحقل) على الخريطة بالترتيب. سيتم إغلاق المضلع تلقائياً عند النقطة الرابعة."
        : "Place four corner points manually on the map in order. The polygon closes automatically on the 4th point.",
    [lang],
  )
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/fields">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{t[lang].title}</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const next = lang === "ar" ? "en" : "ar"
            setLang(next)
            setLanguage(next)
          }}
        >
          {lang === "ar" ? "EN" : "ع"}
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]">

        <Card className="overflow-hidden border border-emerald-900/40 bg-gradient-to-br from-emerald-900/40 via-slate-900/40 to-slate-950">

          <div className="p-6 space-y-4 text-sm text-emerald-50/90">

            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">{heroCopy[lang].eyebrow}</p>

            <h2 className="text-2xl font-semibold text-white">{heroCopy[lang].heading}</h2>

            <p>{heroCopy[lang].description}</p>

            <ul className="space-y-2 text-emerald-100">

              {heroCopy[lang].bullets.map((item) => (

                <li key={item} className="flex items-start gap-2">

                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-300" />

                  <span>{item}</span>

                </li>

              ))}

            </ul>

          </div>

        </Card>

        <Card className="relative h-48 overflow-hidden border border-emerald-900/50 bg-black lg:h-full">

          <Image

            src="/images/agriculture-patterns-satellite-imager-nasa.jpg"

            alt={heroCopy[lang].imageAlt || "Satellite imagery showing agricultural field patterns"}

            fill

            className="object-cover opacity-80"

            sizes="(min-width: 1024px) 320px, 100vw"

            priority

          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <div className="relative mt-auto p-4 text-xs font-medium text-white/90">

            {heroCopy[lang].imageCaption}

          </div>

        </Card>

      </div>



      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">{t[lang].name}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleInputChange("name")}
              placeholder={t[lang].namePlaceholder}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="farm">{t[lang].farm}</Label>
            <Select
              value={formData.farm_id}
              onValueChange={(value) => setFormData({ ...formData, farm_id: value })}
              disabled={farms.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={t[lang].selectFarm} />
              </SelectTrigger>
              <SelectContent>
                {farms.map((farm) => (
                  <SelectItem key={farm.id} value={farm.id}>
                    {farm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
            {selectedFarmAreaFeddan != null && (
              <p className="text-xs text-muted-foreground">
                {t[lang].farmAreaInfo.replace("{value}", selectedFarmAreaFeddan.toFixed(2))}
              </p>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-4 rounded-2xl border border-primary/20 bg-muted/30 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <p className="text-base font-semibold">{t[lang].areaCardTitle}</p>
                  <p className="text-sm text-muted-foreground">{t[lang].areaCardSubtitle}</p>
                </div>
                <span
                  className={`text-xs font-semibold ${autoAreaMeters ? "text-emerald-600" : "text-amber-600"
                    }`}
                >
                  {autoAreaMeters ? t[lang].areaReady : t[lang].areaWaiting}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-background/70 p-3 shadow-inner">
                  <p className="text-xs text-muted-foreground">{t[lang].areaFeddan}</p>
                  <p className="text-2xl font-bold">{autoAreaFeddan ? autoAreaFeddan.toFixed(2) : "\u2014"}</p>
                </div>
                <div className="rounded-xl bg-background/70 p-3 shadow-inner">
                  <p className="text-xs text-muted-foreground">{t[lang].areaHectare}</p>
                  <p className="text-2xl font-bold">{autoAreaHectare ? autoAreaHectare.toFixed(2) : "\u2014"}</p>
                </div>
              </div>
              {finalAreaPreview && (
                <p className="text-sm text-muted-foreground">
                  {t[lang].areaSaveLabel.replace("{value}", finalAreaPreview)}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setUseManualArea((prev) => !prev)}
                >
                  {useManualArea ? t[lang].manualDisable : t[lang].manualEnable}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {useManualArea ? t[lang].manualHelp : t[lang].areaAutoHint}
                </span>
              </div>
              {useManualArea && (
                <div className="grid gap-2 md:grid-cols-[max-content,1fr] md:items-center">
                  <Label htmlFor="manual-area" className="text-sm font-medium">
                    {t[lang].manualLabel}
                  </Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      id="manual-area"
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={manualArea}
                      onChange={handleManualAreaChange}
                      placeholder={t[lang].manualPlaceholder}
                      className="sm:max-w-[200px]"
                    />
                    <span className="text-xs text-muted-foreground">{t[lang].manualUnit}</span>
                  </div>
                </div>
              )}
              {showAreaWarning && selectedFarmAreaFeddan != null && currentAreaFeddan != null && (
                <p className="text-xs text-amber-600">
                  {t[lang].areaVsFarmWarning
                    .replace("{field}", currentAreaFeddan.toFixed(2))
                    .replace("{farm}", selectedFarmAreaFeddan.toFixed(2))}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="crop_type">{t[lang].cropType}</Label>
              <Input
                id="crop_type"
                value={formData.crop_type}
                onChange={handleInputChange("crop_type")}
                placeholder={t[lang].cropPlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="soil_type">{t[lang].soilType}</Label>
              <Textarea
                id="soil_type"
                value={formData.soil_type}
                onChange={handleInputChange("soil_type")}
                placeholder={t[lang].soilPlaceholder}
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t[lang].boundary}</Label>
            {selectedFarmCoordsText && (
              <p className="text-xs text-muted-foreground">
                {t[lang].farmLocationLabel}:{" "}
                <span dir="ltr">{selectedFarmCoordsText}</span>
              </p>
            )}
            <FieldBoundaryEditor
              lang={lang}
              value={boundary}
              onChange={(geom: Polygon) => {
                setBoundary(geom)
                if (geom) {
                  setBoundaryError(null)
                  setFormError((prev) => (prev === t[lang].boundaryRequired ? null : prev))
                }
              }}
              onAreaChange={setAutoAreaMeters}
              initialCenter={
                selectedFarm && selectedFarm.latitude != null && selectedFarm.longitude != null
                  ? [Number(selectedFarm.longitude), Number(selectedFarm.latitude)]
                  : undefined
              }
              height={420}
              enforceFourPoints
            />
            <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-100">
              <p className="font-semibold">
                {lang === "ar" ? "تعليمات رسم الحدود" : "Boundary drawing tips"}
              </p>
              <ul className="list-disc space-y-1 pl-4 text-amber-50/90">
                {(lang === "ar"
                  ? [
                    "حدد أربع نقاط مرتبة (اتجاه عقارب الساعة) حول الحقل. سيتم إغلاق المضلع تلقائياً عند النقطة الرابعة.",
                    "اضغط مرتين أو اختر زر \"إنهاء الرسم\" لقفل الحدود قبل الحفظ.",
                    "استخدم زر \"مسح الحدود\" إذا لم يتم تسجيل النقاط كما تريد.",
                  ]
                  : [
                    "Drop four corner points sequentially (clockwise) around the field; the polygon closes automatically.",
                    "Double-click or use “Finish drawing” to lock the boundary before saving.",
                    "Hit “Clear boundary” if a tap misses—then re-place the points.",
                  ]
                ).map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">{boundaryInstructions}</p>
            {boundaryError && <p className="text-xs text-destructive">{boundaryError}</p>}
            <p className="text-xs text-muted-foreground">{t[lang].areaAuto}</p>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Link href="/dashboard/fields" className="flex-1">
              <Button type="button" variant="outline" className="w-full bg-transparent">
                {t[lang].cancel}
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t[lang].saving}
                </>
              ) : (
                t[lang].save
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}





