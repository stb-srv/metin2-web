import { cmsDb } from "@/lib/cms-db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { NewsList } from "./NewsList"

export const dynamic = "force-dynamic"

export default async function AdminNewsPage() {
  const newsList = await cmsDb.news.findMany({
    orderBy: { createdAt: "desc" }
  })

  const serialized = newsList.map(n => ({
    id: n.id,
    title: n.title,
    category: n.category,
    published: n.published,
    pinned: n.pinned,
    createdAt: n.createdAt.toISOString()
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary tracking-widest uppercase">News Management</h1>
          <p className="text-text-muted mt-1">Erstelle Ankündigungen, Events und Patch-Notes für die Spieler.</p>
        </div>
        <Link href="/news/new">
          <Button><Plus className="w-4 h-4 mr-2"/> Neuer Beitrag</Button>
        </Link>
      </div>

      <NewsList initialNews={serialized} />
    </div>
  )
}
