import { getAllArticlesMetadata } from "@/lib/content/articles"
import { KnowledgeHubClient } from "@/components/knowledge-hub/knowledge-hub-client"

export default async function KnowledgeHubPage() {
  const articles = getAllArticlesMetadata()
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <KnowledgeHubClient articles={articles} />
    </div>
  )
}
