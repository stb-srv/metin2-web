"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type NewsData = {
  id?: string
  title: string
  content: string
  excerpt: string
  published: boolean
  pinned: boolean
  category: string
}

export function NewsForm({ initialData }: { initialData?: NewsData }) {
  const router = useRouter()
  const [formData, setFormData] = useState<NewsData>({
    title: initialData?.title || "",
    content: initialData?.content || "",
    excerpt: initialData?.excerpt || "",
    published: initialData?.published || false,
    pinned: initialData?.pinned || false,
    category: initialData?.category || "NEWS",
  })
  const [loading, setLoading] = useState(false)

  const isEdit = !!initialData?.id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = isEdit ? `/api/admin/news/${initialData.id}` : "/api/admin/news"
      const method = isEdit ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (!res.ok) throw new Error("Speichern fehlgeschlagen")
      router.push("/news")
      router.refresh()
    } catch (err) {
      alert("Fehler beim Speichern. Bitte überprüfe die Eingaben.")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-surface/80 border-border/50">
        <CardContent className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-text-muted mb-2 font-display uppercase tracking-wider">Titel</label>
            <input 
              required
              className="w-full bg-surface-2 border border-border/50 rounded-md px-4 py-3 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="z.B. Wartungsarbeiten am Freitag..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-text-muted mb-2 font-display uppercase tracking-wider">Kategorie</label>
              <select
                className="w-full bg-surface-2 border border-border/50 rounded-md px-4 py-3 text-text focus:outline-none focus:border-primary transition-all"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="NEWS">News</option>
                <option value="UPDATE">Update</option>
                <option value="EVENT">Event</option>
                <option value="MAINTENANCE">Wartung</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-text-muted mb-2 font-display uppercase tracking-wider">Kurzbeschreibung (Excerpt)</label>
            <input 
              className="w-full bg-surface-2 border border-border/50 rounded-md px-4 py-3 text-text focus:outline-none focus:border-primary transition-all"
              value={formData.excerpt}
              onChange={e => setFormData({...formData, excerpt: e.target.value})}
              placeholder="Ein kurzer Teaser für die Startseite..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-text-muted mb-2 font-display uppercase tracking-wider">Inhalt</label>
            <textarea 
              required
              rows={12}
              className="w-full bg-surface-2 border border-border/50 rounded-md px-4 py-3 text-text focus:outline-none focus:border-primary resize-y transition-all font-mono text-sm"
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              placeholder="Vollständiger Artikelinhalt (Markdown-kompatibel vorbereitet)..."
            />
          </div>

          <div className="flex gap-8 pt-4 border-t border-border/30">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={formData.published}
                onChange={e => setFormData({...formData, published: e.target.checked})}
                className="w-5 h-5 rounded border-border bg-surface-2 text-primary focus:ring-primary focus:ring-offset-surface transition-all"
              />
              <span className="text-sm font-medium text-text group-hover:text-primary transition-colors">Öffentlich sichtbar (Veröffentlicht)</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={formData.pinned}
                onChange={e => setFormData({...formData, pinned: e.target.checked})}
                className="w-5 h-5 rounded border-border bg-surface-2 text-primary focus:ring-primary focus:ring-offset-surface transition-all"
              />
              <span className="text-sm font-medium text-text group-hover:text-primary transition-colors">Ganz oben anheften (Pinned)</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="secondary" type="button" onClick={() => router.push("/news")}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Speichert..." : "Eintrag speichern"}
        </Button>
      </div>
    </form>
  )
}
