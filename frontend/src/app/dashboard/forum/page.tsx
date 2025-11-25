"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Search, Plus, ThumbsUp, MessageCircle } from "lucide-react"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n/use-language"

export default function ForumPage() {
  const { language, setLanguage } = useTranslation()
  const [lang, setLang] = useState<"ar" | "en">(language === "en" ? "en" : "ar")
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

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
    loadPosts()
  }, [])

  async function loadPosts() {
    try {
      const { data, error } = await supabase
        .from("forum_posts")
        .select("*, author:profiles(full_name), comments:forum_comments(count)")
        .order("created_at", { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error("[v0] Error loading posts:", error)
    } finally {
      setLoading(false)
    }
  }

  const t = {
    ar: {
      title: "المنتدى المجتمعي",
      subtitle: "شارك خبراتك واستفد من تجارب الآخرين",
      search: "ابحث في المنتدى...",
      newPost: "منشور جديد",
      noPosts: "لا توجد منشورات",
      replies: "رد",
      likes: "إعجاب",
      categories: {
        question: "سؤال",
        discussion: "نقاش",
        tip: "نصيحة",
        problem: "مشكلة",
      },
    },
    en: {
      title: "Community Forum",
      subtitle: "Share your experience and learn from others",
      search: "Search forum...",
      newPost: "New Post",
      noPosts: "No posts available",
      replies: "replies",
      likes: "likes",
      categories: {
        question: "Question",
        discussion: "Discussion",
        tip: "Tip",
        problem: "Problem",
      },
    },
  }

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            {t[lang].title}
          </h1>
          <p className="text-muted-foreground mt-1">{t[lang].subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/dashboard/forum/new">
              <Plus className="h-4 w-4 mr-2" />
              {t[lang].newPost}
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t[lang].noPosts}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="p-6 hover:shadow-lg transition-shadow">
              <Link href={`/dashboard/forum/${post.id}`}>
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>
                          {t[lang].categories[post.category as keyof typeof t.ar.categories] || post.category}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {post.author?.full_name || "Unknown"} •{" "}
                          {formatForumDate(post.created_at, lang)}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                      <p className="text-muted-foreground line-clamp-2">{post.content}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground pt-3 border-t">
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>
                        {post.comments?.[0]?.count || 0} {t[lang].replies}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      <span>
                        {post.likes_count || 0} {t[lang].likes}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function formatForumDate(value: string, language: "ar" | "en") {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const primaryLocale = language === "ar" ? "ar-EG" : "en-US"
  try {
    return date.toLocaleDateString(primaryLocale)
  } catch {
    try {
      return date.toLocaleDateString("en-US")
    } catch {
      return value
    }
  }
}
