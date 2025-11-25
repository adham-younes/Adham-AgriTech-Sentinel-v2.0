"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/use-language"

export default function NewCropMonitoringPage() {
  const router = useRouter()
  const { language, setLanguage } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [fields, setFields] = useState<any[]>([])
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")
  const [formData, setFormData] = useState({
    field_id: "",
    monitoring_date: new Date().toISOString().split("T")[0],
    health_status: "",
    ndvi_value: "",
    evi_value: "",
    ndwi_value: "",
    temperature_celsius: "",
    notes: "",
    satellite_image_url: "",
  })

  const supabase = createClient()

  useEffect(() => {
    if (language === "ar" || language === "en") {
      setLang(language)
    }
  }, [language])

  useEffect(() => {
    fetchFields()
  }, [])

  async function fetchFields() {
    try {
      const { data, error } = await supabase.from("fields").select("id, name, farms!fields_farm_id_fkey(name)").order("name")

      if (error) throw error
      setFields(data || [])
    } catch (error) {
      console.error("[v0] Error fetching fields:", error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.from("crop_monitoring").insert({
        user_id: user.id,
        field_id: formData.field_id,
        monitoring_date: formData.monitoring_date,
        health_status: formData.health_status,
        ndvi_value: formData.ndvi_value ? Number.parseFloat(formData.ndvi_value) : null,
        evi_value: formData.evi_value ? Number.parseFloat(formData.evi_value) : null,
        ndwi_value: formData.ndwi_value ? Number.parseFloat(formData.ndwi_value) : null,
        temperature_celsius: formData.temperature_celsius ? Number.parseFloat(formData.temperature_celsius) : null,
        notes: formData.notes || null,
        satellite_image_url: formData.satellite_image_url || null,
      })

      if (error) throw error

      router.push("/dashboard/crop-monitoring")
    } catch (error) {
      console.error("[v0] Error creating crop monitoring:", error)
      alert(lang === "ar" ? "حدث خطأ أثناء حفظ البيانات" : "Error saving data")
    } finally {
      setLoading(false)
    }
  }

  const t = {
    ar: {
      title: "إضافة مراقبة محاصيل جديدة",
      back: "رجوع",
      field: "الحقل",
      selectField: "اختر الحقل",
      date: "تاريخ المراقبة",
      health: "الحالة الصحية",
      selectHealth: "اختر الحالة",
      excellent: "ممتاز",
      good: "جيد",
      fair: "متوسط",
      poor: "ضعيف",
      critical: "حرج",
      ndvi: "مؤشر NDVI (0-1)",
      evi: "مؤشر EVI (0-1)",
      ndwi: "مؤشر NDWI (0-1)",
      temperature: "درجة الحرارة (°C)",
      notes: "ملاحظات",
      notesPlaceholder: "أي ملاحظات إضافية...",
      satelliteUrl: "رابط صورة القمر الصناعي",
      satelliteUrlPlaceholder: "https://...",
      cancel: "إلغاء",
      save: "حفظ البيانات",
      saving: "جاري الحفظ...",
    },
    en: {
      title: "Add New Crop Monitoring",
      back: "Back",
      field: "Field",
      selectField: "Select field",
      date: "Monitoring Date",
      health: "Health Status",
      selectHealth: "Select status",
      excellent: "Excellent",
      good: "Good",
      fair: "Fair",
      poor: "Poor",
      critical: "Critical",
      ndvi: "NDVI Index (0-1)",
      evi: "EVI Index (0-1)",
      ndwi: "NDWI Index (0-1)",
      temperature: "Temperature (°C)",
      notes: "Notes",
      notesPlaceholder: "Any additional notes...",
      satelliteUrl: "Satellite Image URL",
      satelliteUrlPlaceholder: "https://...",
      cancel: "Cancel",
      save: "Save Data",
      saving: "Saving...",
    },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/crop-monitoring">
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

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="field">{t[lang].field}</Label>
              <Select
                value={formData.field_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    field_id: value,
                  }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t[lang].selectField} />
                </SelectTrigger>
                <SelectContent>
                  {fields.map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.name} - {field.farms?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">{t[lang].date}</Label>
              <Input
                id="date"
                type="date"
                value={formData.monitoring_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    monitoring_date: e.target.value,
                  }))
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="health">{t[lang].health}</Label>
            <Select
              value={formData.health_status}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  health_status: value,
                }))
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t[lang].selectHealth} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">{t[lang].excellent}</SelectItem>
                <SelectItem value="good">{t[lang].good}</SelectItem>
                <SelectItem value="fair">{t[lang].fair}</SelectItem>
                <SelectItem value="poor">{t[lang].poor}</SelectItem>
                <SelectItem value="critical">{t[lang].critical}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ndvi">{t[lang].ndvi}</Label>
              <Input
                id="ndvi"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.ndvi_value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    ndvi_value: e.target.value,
                  }))
                }
                placeholder="0.75"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evi">{t[lang].evi}</Label>
              <Input
                id="evi"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.evi_value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    evi_value: e.target.value,
                  }))
                }
                placeholder="0.65"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ndwi">{t[lang].ndwi}</Label>
              <Input
                id="ndwi"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.ndwi_value}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    ndwi_value: e.target.value,
                  }))
                }
                placeholder="0.45"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature">{t[lang].temperature}</Label>
            <Input
              id="temperature"
              type="number"
              step="0.1"
              value={formData.temperature_celsius}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  temperature_celsius: e.target.value,
                }))
              }
              placeholder="28.5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="satellite">{t[lang].satelliteUrl}</Label>
            <Input
              id="satellite"
              type="url"
              value={formData.satellite_image_url}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  satellite_image_url: e.target.value,
                }))
              }
              placeholder={t[lang].satelliteUrlPlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t[lang].notes}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              placeholder={t[lang].notesPlaceholder}
              rows={4}
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Link href="/dashboard/crop-monitoring" className="flex-1">
              <Button type="button" variant="outline" className="w-full bg-transparent">
                {t[lang].cancel}
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
