import { NextResponse } from "next/server"
import { searchArticles } from "@/lib/content/articles"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") || ""
  const category = searchParams.get("category") || undefined
  const limit = Number(searchParams.get("limit") ?? 5)
  const articles = searchArticles(query, category).slice(0, limit)
  return NextResponse.json({ articles })
}
