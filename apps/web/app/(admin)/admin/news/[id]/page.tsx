import { cmsDb } from "@/lib/cms-db"
import { NewsForm } from "../NewsForm"
import { notFound } from "next/navigation"

export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const news = await cmsDb.news.findUnique({
    where: { id }
  })

  if (!news) notFound()

  const serialized = {
    id: news.id,
    title: news.title,
    content: news.content,
    excerpt: news.excerpt || "",
    published: news.published,
    pinned: news.pinned,
    category: news.category,
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-primary tracking-widest uppercase">Beitrag Bearbeiten</h1>
      <NewsForm initialData={serialized} />
    </div>
  )
}
