"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Search, Plus, Package } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/use-language"

export default function MarketplacePage() {
  const { language, setLanguage } = useTranslation()
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const supabase = createClient()

  useEffect(() => {
    if (language === "ar" || language === "en") {
      setLang(language)
    }
  }, [language])

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      const { data, error } = await supabase
        .from("marketplace_products")
        .select("*, seller:profiles(full_name)")
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error("[v0] Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  const t = {
    ar: {
      title: "السوق الزراعي",
      subtitle: "تسوق المنتجات والمعدات الزراعية",
      search: "ابحث عن منتج...",
      addProduct: "إضافة منتج",
      noProducts: "لا توجد منتجات متاحة",
      price: "السعر",
      seller: "البائع",
      available: "متاح",
      soldOut: "نفذت الكمية",
      viewDetails: "عرض التفاصيل",
      categories: {
        seeds: "بذور",
        fertilizers: "أسمدة",
        tools: "أدوات",
        equipment: "معدات",
        pesticides: "مبيدات",
        other: "أخرى",
      },
    },
    en: {
      title: "Agricultural Marketplace",
      subtitle: "Shop for agricultural products and equipment",
      search: "Search for a product...",
      addProduct: "Add Product",
      noProducts: "No products available",
      price: "Price",
      seller: "Seller",
      available: "Available",
      soldOut: "Sold Out",
      viewDetails: "View Details",
      categories: {
        seeds: "Seeds",
        fertilizers: "Fertilizers",
        tools: "Tools",
        equipment: "Equipment",
        pesticides: "Pesticides",
        other: "Other",
      },
    },
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-8 w-8 text-primary" />
            {t[lang].title}
          </h1>
          <p className="text-muted-foreground mt-1">{t[lang].subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/marketplace/new">
              <Plus className="h-4 w-4 mr-2" />
              {t[lang].addProduct}
            </Link>
          </Button>
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
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t[lang].search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t[lang].noProducts}</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold line-clamp-2">{product.name}</h3>
                <Badge variant={product.quantity > 0 ? "default" : "secondary"}>
                  {t[lang].categories[product.category as keyof (typeof t)["ar"]["categories"]] || product.category}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between border-t pt-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t[lang].price}</p>
                  <p className="text-lg font-bold text-primary">
                    {product.price} {lang === "ar" ? "ج.م" : "EGP"}
                  </p>
                </div>
                <Badge variant={product.quantity > 0 ? "default" : "secondary"}>
                  {product.quantity > 0 ? t[lang].available : t[lang].soldOut}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {t[lang].seller}: {product.seller?.full_name || "—"}
              </p>
              <Button asChild className="w-full">
                <Link href={`/dashboard/marketplace/${product.id}`}>{t[lang].viewDetails}</Link>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
