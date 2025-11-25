"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BookOpen, Filter, Search } from "lucide-react"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ArticleMetadata } from "@/lib/content/articles"
import { useTranslation } from "@/lib/i18n/use-language"

interface KnowledgeHubClientProps {
  articles: ArticleMetadata[]
}

const categoryLabels = {
  soil: { ar: "التربة", en: "Soil" },
  irrigation: { ar: "الري", en: "Irrigation" },
  ndvi: { ar: "مؤشر NDVI", en: "NDVI" },
  pests: { ar: "الآفات", en: "Pests" },
  ai: { ar: "المساعد الذكي", en: "AI Assistant" },
} as const

const levelLabels = {
  beginner: { ar: "مبتدئ", en: "Beginner" },
  intermediate: { ar: "متوسط", en: "Intermediate" },
  advanced: { ar: "متقدم", en: "Advanced" },
} as const

const tagLabels = {
  soil: { ar: "التربة", en: "Soil" },
  weather: { ar: "الطقس", en: "Weather" },
  irrigation: { ar: "الري", en: "Irrigation" },
  ai: { ar: "ذكاء اصطناعي", en: "AI" },
  assistant: { ar: "المساعد", en: "Assistant" },
  operations: { ar: "العمليات", en: "Operations" },
  sensors: { ar: "الحساسات", en: "Sensors" },
  automation: { ar: "الأتمتة", en: "Automation" },
  satellite: { ar: "الأقمار الصناعية", en: "Satellite" },
  sentinel: { ar: "سينتينل", en: "Sentinel" },
  vegetation: { ar: "الغطاء النباتي", en: "Vegetation" },
  "ai-assistant": { ar: "المساعد الذكي", en: "AI Assistant" },
  vision: { ar: "الرؤية الحاسوبية", en: "Vision" },
} as const

const categoryFilters = [
  { key: "all", label: { ar: "الكل", en: "All" } },
  ...Object.entries(categoryLabels).map(([key, value]) => ({
    key,
    label: value,
  })),
]

interface InsightBlock {
  key: string
  title: { ar: string; en: string }
  body: { ar: string; en: string }
}

const fieldTensions: InsightBlock[] = [
  {
    key: "thirst",
    title: { ar: "عطش الحقول يتخفّى", en: "Thirst hides in plain sight" },
    body: {
      ar: "يصل إنذار الجفاف متأخرًا لأن الصور، محطات الطقس، وملاحظات الري تعيش في أماكن متعددة.",
      en: "Drought warnings arrive late because imagery, weather feeds, and irrigation notes live in separate corners.",
    },
  },
  {
    key: "heat",
    title: { ar: "بقع حرارة مفاجئة", en: "Heat scars erupt overnight" },
    body: {
      ar: "تظهر حلقات الإجهاد الحراري على أطراف الحقل بينما الفريق يدوّن الملاحظات في محادثات متناثرة.",
      en: "Heat-stress rings form along the field edges while the crew captures clues inside scattered threads.",
    },
  },
  {
    key: "stories",
    title: { ar: "قصص متناقضة", en: "Stories break apart" },
    body: {
      ar: "القادة يعتمدون على رسائل صوتية ودفاتر مختلفة، فلا أحد يمتلك قصة واحدة للحقل.",
      en: "Leads rely on voice notes and mismatched notebooks, so no one owns a single story for the field.",
    },
  },
]

const responsePatterns: InsightBlock[] = [
  {
    key: "memo",
    title: { ar: "مذكرة طيفية واحدة", en: "One spectral memo" },
    body: {
      ar: "نحوّل الصور والطقس وسجل التربة إلى بطاقة ثنائية اللغة توضّح الخطر والخطوة الفورية.",
      en: "We fuse imagery, weather, and soil history into a bilingual tile that states the risk and the immediate move.",
    },
  },
  {
    key: "steps",
    title: { ar: "خطوات دقيقة", en: "Precise follow-ups" },
    body: {
      ar: "كل مقال ينتهي بتعليمات عملية: عدد الساعات قبل الري، أو حدّ قص القنوات، أو جرعة السماد.",
      en: "Each article ends with a concrete instruction: hours before irrigation, canal trimming thresholds, or fertilizer dosage.",
    },
  },
  {
    key: "cadence",
    title: { ar: "إيقاع أسبوعي واحد", en: "A single weekly cadence" },
    body: {
      ar: "نُحدّث المكتبة مع كل جولة حقلية، فيشارك القائد رابطًا موحّدًا بدل إرسال صور متفرقة.",
      en: "The library updates with every field walk, so leads share one link instead of endless photo dumps.",
    },
  },
]

export function KnowledgeHubClient({ articles }: KnowledgeHubClientProps) {
  const { language } = useTranslation()
  const isArabic = language === "ar"
  const localeKey = isArabic ? "ar" : "en"
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")

  const resolveCategoryLabel = (value: string) =>
    categoryLabels[value as keyof typeof categoryLabels]?.[localeKey] ?? value
  const resolveLevelLabel = (value: string) =>
    levelLabels[value as keyof typeof levelLabels]?.[localeKey] ?? value
  const resolveTagLabel = (value: string) => tagLabels[value as keyof typeof tagLabels]?.[localeKey] ?? value
  const resolveTitle = (article: ArticleMetadata) =>
    isArabic && (article as any).title_ar ? (article as any).title_ar as string : article.title
  const resolveSummary = (article: ArticleMetadata) =>
    isArabic && (article as any).summary_ar ? (article as any).summary_ar as string : article.summary

  const filtered = useMemo(() => {
    return articles.filter((article) => {
      const matchesCategory = category === "all" ? true : article.category === category
      const haystack = `${resolveTitle(article)} ${resolveSummary(article)} ${article.tags?.join(" ")}`.toLowerCase()
      return matchesCategory && haystack.includes(query.trim().toLowerCase())
    })
  }, [articles, category, query, isArabic])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{isArabic ? "ثورة الزراعة الرقمية" : "Digital Agriculture Revolution"}</h1>
          <p className="text-sm text-muted-foreground">
            {isArabic
              ? "نحوّل عطش الحقول، بقع الحرارة، وملاحظات الطقس المتناثرة إلى بروتوكولات ثنائية اللغة يمكن تنفيذها في اليوم نفسه."
              : "We turn thirsty plots, heat scars, and scattered weather notes into bilingual protocols that can be executed the same day."}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-background/40 p-4 text-xs text-muted-foreground space-y-1 max-w-sm">
          <p className="text-sm font-semibold text-white">
            {isArabic ? "دفتر حي من الأقصر إلى الدلتا" : "A living brief from Luxor to the Delta"}
          </p>
          <p>
            {isArabic
              ? "يُحدَّث كلما مرّت طبقة استشعار أو تمت زيارة ميدانية—لا أزرار فيديو مؤجلة، بل قصص جاهزة للتنفيذ."
              : "Updated whenever a spectral pass or field walk lands—no placeholder videos, just ready-to-use stories."}
          </p>
        </div>
      </div>

      <Card className="glass-card border-white/10">
        <CardHeader>
          <CardTitle className="text-xl">
            {isArabic ? "دفتر ثورة الزراعة الرقمية" : "Digital Agriculture Revolution Briefing"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isArabic
              ? "اطّلع على أحدث ثلاث مذكرات؛ كل واحدة تربط المشكلة بالخطوة التالية وتبقى صالحة للمشاركة فورًا."
              : "Study the latest three memos; each one pairs the tension with the next move and is ready to share immediately."}
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3 text-sm text-muted-foreground">
          {articles
            .slice(0, 3)
            .map((article) => (
              <Link
                key={article.slug}
                href={`/knowledge-hub/${article.slug}`}
                className="rounded-2xl border border-white/10 bg-background/40 p-4 hover:border-primary transition-colors"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-primary/70">{resolveCategoryLabel(article.category)}</p>
                <p className="mt-1 text-white font-semibold">{resolveTitle(article)}</p>
                <p className="mt-2 text-xs text-muted-foreground line-clamp-3">{resolveSummary(article)}</p>
              </Link>
            ))}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categoryFilters.map((cat) => (
            <Button
              key={cat.key}
              variant={category === cat.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setCategory(cat.key)}
            >
              {isArabic ? cat.label.ar : cat.label.en}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isArabic ? "ابحث عن مقال" : "Search articles"}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            {isArabic ? "تصفية" : "Filter"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filtered.map((article) => (
          <Link key={article.slug} href={`/knowledge-hub/${article.slug}`}>
            <Card className="p-5 hover:border-primary transition-colors cursor-pointer h-full flex flex-col">
              <div className="mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">{resolveTitle(article)}</h3>
                  <p className="text-xs text-muted-foreground">
                    {isArabic ? `المستوى: ${resolveLevelLabel(article.level)}` : `Level: ${resolveLevelLabel(article.level)}`}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground flex-1">{resolveSummary(article)}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-primary">
                {article.tags?.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-primary/10 px-3 py-1">
                    {resolveTagLabel(tag)}
                  </span>
                ))}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <section className="rounded-3xl border border-white/10 bg-background/40 p-6 space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">
            {isArabic ? "المشكلات التي نرصدها أولًا" : "Tensions we name first"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isArabic
              ? "نبدأ كل تحديث بتحديد الألم الحقيقي قبل الحديث عن أي أداة."
              : "Every update starts by naming the real pain before talking about any tool."}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {fieldTensions.map((block) => (
            <div key={block.key} className="rounded-2xl border border-white/10 bg-background/60 p-4 space-y-2">
              <p className="text-sm font-semibold text-white">{isArabic ? block.title.ar : block.title.en}</p>
              <p className="text-xs text-muted-foreground">{isArabic ? block.body.ar : block.body.en}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-background/40 p-6 space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">
            {isArabic ? "الاستجابات المتناظرة" : "Symmetric responses"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isArabic
              ? "كل توصية تنتهي بخطوة عملية واضحة حتى تُنفّذ خلال دقائق."
              : "Each recommendation ends with a clear action so it can be executed within minutes."}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {responsePatterns.map((block) => (
            <div key={block.key} className="rounded-2xl border border-white/10 bg-background/60 p-4 space-y-2">
              <p className="text-sm font-semibold text-white">{isArabic ? block.title.ar : block.title.en}</p>
              <p className="text-xs text-muted-foreground">{isArabic ? block.body.ar : block.body.en}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
