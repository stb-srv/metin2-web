"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Edit, Trash2 } from "lucide-react"

export function NewsList({ initialNews }: { initialNews: any[] }) {
  const [news, setNews] = useState(initialNews)

  const deleteNews = async (id: string) => {
    if (!confirm("Eintrag wirklich löschen?")) return
    try {
      const res = await fetch(`/api/admin/news/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setNews(prev => prev.filter(n => n.id !== id))
    } catch {
      alert("Fehler beim Löschen")
    }
  }

  return (
    <Card className="bg-surface/80 border-border/50">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 text-xs text-text-muted uppercase tracking-wider font-semibold">
                <th className="p-4 font-display">Titel</th>
                <th className="p-4 font-display">Kategorie</th>
                <th className="p-4 font-display">Status</th>
                <th className="p-4 font-display">Datum</th>
                <th className="p-4 font-display text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {news.map(item => (
                <tr key={item.id} className="hover:bg-surface-2/50 transition-colors">
                  <td className="p-4 font-medium text-text">
                    {item.title}
                    {item.pinned && <Badge className="ml-3 bg-accent/20 text-accent border-accent/30 shadow-none">Angepinnt</Badge>}
                  </td>
                  <td className="p-4"><Badge variant="default">{item.category}</Badge></td>
                  <td className="p-4">
                    <Badge variant={item.published ? "success" : "warning"}>
                      {item.published ? "Veröffentlicht" : "Entwurf"}
                    </Badge>
                  </td>
                  <td className="p-4 text-sm text-text-muted">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right space-x-2">
                    <Link href={`/news/${item.id}`}>
                      <Button variant="secondary" size="sm" className="h-8"><Edit className="w-4 h-4" /></Button>
                    </Link>
                    <Button variant="danger" size="sm" className="h-8" onClick={() => deleteNews(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {news.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted">Keine News-Einträge gefunden.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
