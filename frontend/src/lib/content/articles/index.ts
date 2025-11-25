import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { compileMDX } from "next-mdx-remote/rsc"

export type ArticleMetadata = {
  slug: string
  category: string
  level: string
  coverImage: string
  tags: string[]
  publishDate: string
  title: string
  summary: string
  title_ar?: string
  summary_ar?: string
}

const ARTICLES_DIR = path.join(process.cwd(), "lib", "content", "articles", "mdx")

function loadAllFiles() {
  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => path.join(ARTICLES_DIR, file))
}

export function getAllArticlesMetadata(): ArticleMetadata[] {
  return loadAllFiles()
    .map((filePath) => {
      const raw = fs.readFileSync(filePath, "utf8")
      const { data } = matter(raw)
      return data as ArticleMetadata
    })
    .sort((a, b) => (a.publishDate > b.publishDate ? -1 : 1))
}

export async function getArticleBySlug(slug: string) {
  const filePath = path.join(ARTICLES_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) {
    return null
  }
  const source = fs.readFileSync(filePath, "utf8")
  const { content, frontmatter } = await compileMDX<ArticleMetadata>({
    source,
    options: { parseFrontmatter: true },
  })
  return { content, frontmatter }
}

export function searchArticles(query: string, category?: string): ArticleMetadata[] {
  const normalized = query.trim().toLowerCase()
  return getAllArticlesMetadata().filter((article) => {
    const matchesCategory = category ? article.category === category : true
    if (!normalized) return matchesCategory
    const haystack = `${article.title} ${article.summary} ${article.tags?.join(" ")}`.toLowerCase()
    return matchesCategory && haystack.includes(normalized)
  })
}
