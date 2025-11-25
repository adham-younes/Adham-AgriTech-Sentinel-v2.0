"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/use-language"

export default function NewProductPage() {
  const { language, setLanguage } = useTranslation()
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const supabase = createClient()

  const t = {
    ar: {
      title: "إضافة منتج جديد",
      name: "اسم المنتج",
      description: "الوصف",
      category: "الفئة",
      price: "السعر (ج.م)",
      quantity: "الكمية المتاحة",
      unit: "الوحدة",
      imageUrl: "رابط الصورة (اختياري)",
      cancel: "إلغاء",
      submit: "إضافة المنتج",
      categories: {
        seeds: "بذور",
        fertilizers: "أسمدة",
        tools: "أدوات",
        equipment: "معدات",
        pesticides: "مبيدات",
        other: "أخرى",
      },
      units: {
        kg: "كيلوجرام",
        ton: "طن",
        liter: "لتر",
        piece: "قطعة",
        bag: "كيس",
      },
    },
    en: {
      title: "Add New Product",
      name: "Product Name",
      description: "Description",
      category: "Category",
      price: "Price (EGP)",
      quantity: "Available Quantity",
      unit: "Unit",
      imageUrl: "Image URL (optional)",
      cancel: "Cancel",
      submit: "Add Product",
      categories: {
        seeds: "Seeds",
        fertilizers: "Fertilizers",
        tools: "Tools",
        equipment: "Equipment",
        pesticides: "Pesticides",
        other: "Other",
      },
      units: {
        kg: "Kilogram",
        ton: "Ton",
        liter: "Liter",
        piece: "Piece",
        bag: "Bag",
      },
    },
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.from("marketplace_products").insert({
        seller_id: user.id,
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        price: Number.parseFloat(formData.get("price") as string),
        quantity: Number.parseInt(formData.get("quantity") as string),
        unit: formData.get("unit") as string,
        image_url: formData.get("image_url") as string,
        status: "active",
      })

      if (error) throw error

      router.push("/dashboard/marketplace")
    } catch (error) {
      console.error("[v0] Error creating product:", error)
      alert("Failed to create product")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/marketplace">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
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
            <Label htmlFor="name">{t[lang].name}</Label>
            <Input id="name" name="name" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t[lang].description}</Label>
            <Textarea id="description" name="description" rows={4} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">{t[lang].category}</Label>
              <Select name="category" required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(t[lang].categories).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">{t[lang].unit}</Label>
              <Select name="unit" required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(t[lang].units).map(([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">{t[lang].price}</Label>
              <Input id="price" name="price" type="number" step="0.01" min="0" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">{t[lang].quantity}</Label>
              <Input id="quantity" name="quantity" type="number" min="0" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">{t[lang].imageUrl}</Label>
            <Input id="image_url" name="image_url" type="url" />
          </div>

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/marketplace">{t[lang].cancel}</Link>
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t[lang].submit}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
