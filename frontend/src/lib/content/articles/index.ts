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

// Support both local dev (src/lib) and Vercel build (lib) paths
const getArticlesDir = () => {
  const possiblePaths = [
    path.join(process.cwd(), "src", "lib", "content", "articles", "mdx"),
    path.join(process.cwd(), "lib", "content", "articles", "mdx"),
    path.join(__dirname, "mdx"),
  ]
  
  for (const dirPath of possiblePaths) {
    if (fs.existsSync(dirPath)) {
      return dirPath
    }
  }
  
  // Fallback - return first path and let it fail gracefully
  return possiblePaths[0]
}

const ARTICLES_DIR = getArticlesDir()

function loadAllFiles() {
  try {
    if (!fs.existsSync(ARTICLES_DIR)) {
      console.warn(`Articles directory not found: ${ARTICLES_DIR}`)
      return []
    }
    return fs
      .readdirSync(ARTICLES_DIR)
      .filter((file) => file.endsWith(".mdx"))
      .map((file) => path.join(ARTICLES_DIR, file))
  } catch (error) {
    console.error("Error loading articles:", error)
    return []
  }
}

export function getAllArticlesMetadata(): ArticleMetadata[] {
  try {
    const files = loadAllFiles()
    if (files.length === 0) {
      console.warn("No article files found")
      return []
    }
    return files
      .map((filePath) => {
        try {
          const raw = fs.readFileSync(filePath, "utf8")
          const { data } = matter(raw)
          return data as ArticleMetadata
        } catch (error) {
          console.error(`Error reading article ${filePath}:`, error)
          return null
        }
      })
      .filter((article): article is ArticleMetadata => article !== null)
      .sort((a, b) => (a.publishDate > b.publishDate ? -1 : 1))
  } catch (error) {
    console.error("Error getting articles metadata:", error)
    return []
  }
}

export async function getArticleBySlug(slug: string) {
  try {
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
  } catch (error) {
    console.error(`Error getting article ${slug}:`, error)
    return null
  }
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
