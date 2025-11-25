"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/use-language"

export default function NewIrrigationSystemPage() {
  const router = useRouter()
  const { language, setLanguage } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [fields, setFields] = useState<any[]>([])
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")
  const [formData, setFormData] = useState({
    field_id: "",
    irrigation_type: "",
    status: "inactive",
    flow_rate_lpm: "",
    schedule: "",
    notes: "",
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

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

      const { error } = await supabase.from("irrigation_systems").insert({
        user_id: user.id,
        field_id: formData.field_id,
        irrigation_type: formData.irrigation_type,
        status: formData.status,
        flow_rate_lpm: formData.flow_rate_lpm ? Number.parseFloat(formData.flow_rate_lpm) : null,
        schedule: formData.schedule || null,
        notes: formData.notes || null,
      })

      if (error) throw error

      router.push("/dashboard/irrigation")
    } catch (error) {
      console.error("[v0] Error creating irrigation system:", error)
      alert(lang === "ar" ? "حدث خطأ أثناء حفظ النظام" : "Error saving system")
    } finally {
      setLoading(false)
    }
  }

  const t = {
    ar: {
      title: "إضافة نظام ري جديد",
      back: "رجوع",
      field: "الحقل",
      selectField: "اختر الحقل",
      type: "نوع الري",
      selectType: "اختر النوع",
      drip: "تنقيط",
      sprinkler: "رش",
      surface: "سطحي",
      subsurface: "تحت السطح",
      status: "الحالة",
      selectStatus: "اختر الحالة",
      active: "نشط",
      scheduled: "مجدول",
      inactive: "غير نشط",
      maintenance: "صيانة",
      flowRate: "معدل التدفق (لتر/دقيقة)",
      flowRatePlaceholder: "100",
      schedule: "الجدول الزمني",
      schedulePlaceholder: "يومياً 6:00 صباحاً لمدة 30 دقيقة",
      notes: "ملاحظات",
      notesPlaceholder: "أي ملاحظات إضافية...",
      cancel: "إلغاء",
      save: "حفظ النظام",
      saving: "جاري الحفظ...",
    },
    en: {
      title: "Add New Irrigation System",
      back: "Back",
      field: "Field",
      selectField: "Select field",
      type: "Irrigation Type",
      selectType: "Select type",
      drip: "Drip",
      sprinkler: "Sprinkler",
      surface: "Surface",
      subsurface: "Subsurface",
      status: "Status",
      selectStatus: "Select status",
      active: "Active",
      scheduled: "Scheduled",
      inactive: "Inactive",
      maintenance: "Maintenance",
      flowRate: "Flow Rate (L/min)",
      flowRatePlaceholder: "100",
      schedule: "Schedule",
      schedulePlaceholder: "Daily 6:00 AM for 30 minutes",
      notes: "Notes",
      notesPlaceholder: "Any additional notes...",
      cancel: "Cancel",
      save: "Save System",
      saving: "Saving...",
    },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/irrigation">
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

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">{t[lang].type}</Label>
              <Select
                value={formData.irrigation_type}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    irrigation_type: value,
                  }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t[lang].selectType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="drip">{t[lang].drip}</SelectItem>
                  <SelectItem value="sprinkler">{t[lang].sprinkler}</SelectItem>
                  <SelectItem value="surface">{t[lang].surface}</SelectItem>
                  <SelectItem value="subsurface">{t[lang].subsurface}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">{t[lang].status}</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value,
                  }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t[lang].selectStatus} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t[lang].active}</SelectItem>
                  <SelectItem value="scheduled">{t[lang].scheduled}</SelectItem>
                  <SelectItem value="inactive">{t[lang].inactive}</SelectItem>
                  <SelectItem value="maintenance">{t[lang].maintenance}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flowRate">{t[lang].flowRate}</Label>
            <Input
              id="flowRate"
              type="number"
              step="0.1"
              value={formData.flow_rate_lpm}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  flow_rate_lpm: e.target.value,
                }))
              }
              placeholder={t[lang].flowRatePlaceholder}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule">{t[lang].schedule}</Label>
            <Input
              id="schedule"
              value={formData.schedule}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  schedule: e.target.value,
                }))
              }
              placeholder={t[lang].schedulePlaceholder}
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
            <Link href="/dashboard/irrigation" className="flex-1">
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
