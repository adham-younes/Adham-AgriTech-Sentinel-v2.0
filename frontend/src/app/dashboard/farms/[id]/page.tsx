"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, MapPin, Loader2, Plus } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/use-language"

export default function FarmDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { language, setLanguage } = useTranslation()
  const [farm, setFarm] = useState<any>(null)
  const [fields, setFields] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")

  const supabase = createClient()

  useEffect(() => {
    if (language === "ar" || language === "en") {
      setLang(language)
    }
  }, [language])

  useEffect(() => {
    if (params?.id) {
      fetchFarmDetails()
    }
  }, [params?.id])



  async function fetchFarmDetails() {
    if (!params?.id) return
    try {
      const { data: farmData, error: farmError } = await supabase.from("farms").select("*").eq("id", params.id).single()

      if (farmError) throw farmError
      setFarm(farmData)

      const { data: fieldsData, error: fieldsError } = await supabase
        .from("fields")
        .select("*")
        .eq("farm_id", params.id)

      if (fieldsError) throw fieldsError
      setFields(fieldsData || [])
    } catch (error) {
      console.error("[v0] Error fetching farm details:", error)
    } finally {
      setLoading(false)
    }
  }

  const t = {
    ar: {
      back: "رجوع",
      details: "تفاصيل المزرعة",
      location: "الموقع",
      area: "المساحة الكلية",
      coordinates: "الإحداثيات",
      fields: "الحقول",
      addField: "إضافة حقل",
      noFields: "لا توجد حقول",
      noFieldsDesc: "ابدأ بإضافة حقل لهذه المزرعة",
      fieldArea: "المساحة",
      cropType: "نوع المحصول",
    },
    en: {
      back: "Back",
      details: "Farm Details",
      location: "Location",
      area: "Total Area",
      coordinates: "Coordinates",
      fields: "Fields",
      addField: "Add Field",
      noFields: "No Fields",
      noFieldsDesc: "Start by adding a field to this farm",
      fieldArea: "Area",
      cropType: "Crop Type",
    },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!farm) {
    return <div>Farm not found</div>
  }

  const parseMaybeNumber = (value: unknown) => (typeof value === "string" ? Number.parseFloat(value) : (typeof value === "number" ? value : null))
  const totalAreaFeddan = (() => {
    const feddan = parseMaybeNumber(farm.total_area ?? farm.area ?? farm.size)
    return feddan != null ? feddan.toFixed(2) : "--"
  })()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/farms">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{farm.name}</h1>
            <p className="text-muted-foreground">{t[lang].details}</p>
          </div>
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

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t[lang].location}</p>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <p className="font-semibold">{farm.location}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t[lang].area}</p>
            <p className="text-2xl font-bold">
              {totalAreaFeddan} {lang === "ar" ? "فدان" : "feddans"}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t[lang].coordinates}</p>
            <p className="font-mono text-sm">
              {farm.latitude}, {farm.longitude}
            </p>
          </div>
        </Card>
      </div>

      {farm.description && (
        <Card className="p-6">
          <p className="text-muted-foreground">{farm.description}</p>
        </Card>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t[lang].fields}</h2>
          <Link href={`/dashboard/fields/new?farm_id=${farm.id}`}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {t[lang].addField}
            </Button>
          </Link>
        </div>

        {fields.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto max-w-md space-y-4">
              <h3 className="text-xl font-semibold">{t[lang].noFields}</h3>
              <p className="text-muted-foreground">{t[lang].noFieldsDesc}</p>
              <Link href={`/dashboard/fields/new?farm_id=${farm.id}`}>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t[lang].addField}
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {fields.map((field) => (
              <Link key={field.id} href={`/dashboard/fields/${field.id}`}>
                <Card className="p-4 hover:border-primary transition-colors cursor-pointer">
                  <h3 className="font-semibold mb-2">{field.name}</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t[lang].fieldArea}:</span>
                      <span>{parseMaybeNumber(field.area)?.toFixed(2) ?? "--"} {lang === "ar" ? "فدان" : "feddans"}</span>
                    </div>
                    {field.crop_type && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t[lang].cropType}:</span>
                        <span>{field.crop_type}</span>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
