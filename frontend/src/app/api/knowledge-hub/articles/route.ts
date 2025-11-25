import { NextResponse } from "next/server"

import { getAllArticlesMetadata } from "@/lib/content/articles"

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const limit = Number.parseInt(searchParams.get("limit") ?? "50", 10)
  const category = searchParams.get("category") ?? undefined

  const articles = getAllArticlesMetadata()
    .filter((article) => (category ? article.category === category : true))
    .slice(0, Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 50)

  return NextResponse.json({ articles })
}
