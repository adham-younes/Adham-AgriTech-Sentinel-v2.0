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

export default function NewForumPostPage() {
  const { language, setLanguage } = useTranslation()
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const supabase = createClient()

  const t = {
    ar: {
      title: "منشور جديد",
      postTitle: "عنوان المنشور",
      content: "المحتوى",
      category: "الفئة",
      cancel: "إلغاء",
      submit: "نشر",
      categories: {
        question: "سؤال",
        discussion: "نقاش",
        tip: "نصيحة",
        problem: "مشكلة",
      },
    },
    en: {
      title: "New Post",
      postTitle: "Post Title",
      content: "Content",
      category: "Category",
      cancel: "Cancel",
      submit: "Post",
      categories: {
        question: "Question",
        discussion: "Discussion",
        tip: "Tip",
        problem: "Problem",
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

      const { error } = await supabase.from("forum_posts").insert({
        author_id: user.id,
        title: formData.get("title") as string,
        content: formData.get("content") as string,
        category: formData.get("category") as string,
        likes_count: 0,
      })

      if (error) throw error

      router.push("/dashboard/forum")
    } catch (error) {
      console.error("[v0] Error creating post:", error)
      alert("Failed to create post")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/forum">
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
            <Label htmlFor="title">{t[lang].postTitle}</Label>
            <Input id="title" name="title" required />
          </div>

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
            <Label htmlFor="content">{t[lang].content}</Label>
            <Textarea id="content" name="content" rows={10} required />
          </div>

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/forum">{t[lang].cancel}</Link>
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
