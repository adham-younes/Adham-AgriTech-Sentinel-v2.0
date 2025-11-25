import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { NextResponse } from "next/server"

const ARTICLES_DIR = path.join(process.cwd(), "lib", "content", "articles", "mdx")

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const filePath = path.join(ARTICLES_DIR, `${params.slug}.mdx`)
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "ARTICLE_NOT_FOUND" }, { status: 404 })
  }

  const source = fs.readFileSync(filePath, "utf8")
  const { data, content } = matter(source)
  return NextResponse.json({ metadata: data, body: content })
}
