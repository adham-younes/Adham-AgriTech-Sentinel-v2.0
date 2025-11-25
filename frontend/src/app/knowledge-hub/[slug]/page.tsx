import Image from "next/image"
import { notFound } from "next/navigation"
import Link from "next/link"
import { cookies, headers } from "next/headers"

import { getArticleBySlug, getAllArticlesMetadata, type ArticleMetadata } from "@/lib/content/articles"

interface KnowledgeHubArticlePageProps {
  params: { slug: string }
}

export async function generateStaticParams() {
  return getAllArticlesMetadata().map((article) => ({ slug: article.slug }))
}

type Lang = "ar" | "en"

function detectLanguage(): Lang {
  try {
    const jar = cookies()
    const stored = jar.get("adham-agritech-language")?.value
    if (stored === "en" || stored === "ar") return stored
  } catch {}
  try {
    const h = headers()
    const al = h.get("accept-language")?.toLowerCase() || ""
    if (al.startsWith("en")) return "en"
  } catch {}
  return "ar"
}

function resolveTitle(frontmatter: ArticleMetadata, lang: Lang) {
  if (lang === "ar" && (frontmatter as any).title_ar) {
    return (frontmatter as any).title_ar as string
  }
  return frontmatter.title
}

function resolveSummary(frontmatter: ArticleMetadata, lang: Lang) {
  if (lang === "ar" && (frontmatter as any).summary_ar) {
    return (frontmatter as any).summary_ar as string
  }
  return frontmatter.summary
}

export default async function KnowledgeHubArticlePage({ params }: KnowledgeHubArticlePageProps) {
  const article = await getArticleBySlug(params.slug)
  if (!article) {
    notFound()
  }

  const { frontmatter, content } = article
  const lang = detectLanguage()

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-primary/80">{frontmatter.category}</p>
        <h1 className="text-4xl font-bold text-white">{resolveTitle(frontmatter as ArticleMetadata, lang)}</h1>
        <p className="text-sm text-muted-foreground">{resolveSummary(frontmatter as ArticleMetadata, lang)}</p>
      </div>
      <div className="relative h-60 w-full overflow-hidden rounded-3xl">
        <Image
          src={frontmatter.coverImage}
          alt={resolveTitle(frontmatter as ArticleMetadata, lang)}
          fill
          className="object-cover"
        />
      </div>
      <div className="prose prose-invert prose-headings:text-white">
        {content}
      </div>
      <Link href="/knowledge-hub" className="text-primary hover:underline">
        ← العودة إلى ثورة الزراعة الرقمية / Back to the Digital Agriculture Revolution
      </Link>
    </article>
  )
}
