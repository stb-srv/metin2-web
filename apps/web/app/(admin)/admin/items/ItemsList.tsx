"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Edit, Trash2, Store, Gift, Search } from "lucide-react"

type ItemTemplate = {
  id: string
  vnum: number
  name: string
  itemType: string
  grade: string
  enabled: boolean
}

export function ItemsList() {
  const [items, setItems] = useState<ItemTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  const [search, setSearch] = useState("")
  const [gradeFilter, setGradeFilter] = useState("")

  const fetchItems = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/items?page=${page}&search=${search}&grade=${gradeFilter}`)
      const data = await res.json()
      setItems(data.items || [])
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delay = setTimeout(fetchItems, 300)
    return () => clearTimeout(delay)
  }, [page, search, gradeFilter])

  const deleteItem = async (id: string) => {
    if (!confirm("Item wirklich deaktivieren?")) return
    try {
      const res = await fetch(`/api/admin/items/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      fetchItems()
    } catch {
      alert("Fehler beim Deaktivieren")
    }
  }

  const addToShop = async (id: string) => {
    const categoryId = prompt("Bitte die Kategorie-ID aus dem Shop eingeben (Zukünftig über Modal gelöst):")
    if (!categoryId) return
    const priceStr = prompt("Bitte den Preis in DR eingeben:", "100")
    if (!priceStr) return
    const price = parseInt(priceStr)

    try {
      const res = await fetch(`/api/admin/items/${id}/add-to-shop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, price, currency: "DR" })
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Fehler beim Hinzufügen")
      }
      alert("Erfolgreich zum Shop hinzugefügt!")
    } catch (err: any) {
      alert(err.message)
    }
  }

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case "NORMAL": return <Badge variant="default" className="bg-surface-2 text-text-muted">Normal</Badge>
      case "RARE": return <Badge className="bg-accent/20 text-accent border-accent/30">Rare</Badge>
      case "EPIC": return <Badge className="bg-primary/20 text-primary border-primary/30 shadow-[0_0_10px_var(--color-primary)]">Epic</Badge>
      case "LEGENDARY": return <Badge className="bg-danger/20 text-danger border-danger/30 shadow-[0_0_15px_var(--color-danger)] font-bold">Legendary</Badge>
      default: return null
    }
  }

  return (
    <Card className="bg-surface/80 border-border/50">
      <CardContent className="p-0">
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 justify-between bg-surface-2/30">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              placeholder="Suchen (Name oder VNUM)..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full bg-surface border border-border/50 rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <select
            value={gradeFilter}
            onChange={e => { setGradeFilter(e.target.value); setPage(1); }}
            className="bg-surface border border-border/50 rounded-md px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
          >
            <option value="">Alle Grades</option>
            <option value="NORMAL">Normal</option>
            <option value="RARE">Rare</option>
            <option value="EPIC">Epic</option>
            <option value="LEGENDARY">Legendary</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border/50 text-xs text-text-muted uppercase tracking-wider font-semibold">
                <th className="p-4 font-display">VNUM</th>
                <th className="p-4 font-display">Name</th>
                <th className="p-4 font-display">Typ</th>
                <th className="p-4 font-display">Grade</th>
                <th className="p-4 font-display text-center">Status</th>
                <th className="p-4 font-display text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                <tr><td colSpan={6} className="p-8 text-center text-text-muted animate-pulse">Lade Items...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-text-muted">Keine Items gefunden.</td></tr>
              ) : items.map(item => (
                <tr key={item.id} className="hover:bg-surface-2/50 transition-colors">
                  <td className="p-4 font-mono text-primary text-sm font-bold">{item.vnum}</td>
                  <td className="p-4 font-medium text-text">{item.name}</td>
                  <td className="p-4 text-sm text-text-muted">{item.itemType}</td>
                  <td className="p-4">{getGradeBadge(item.grade)}</td>
                  <td className="p-4 text-center">
                    <Badge variant={item.enabled ? "success" : "default"} className="px-2 py-0.5 text-xs">
                      {item.enabled ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </td>
                  <td className="p-4 text-right space-x-2 whitespace-nowrap">
                    <Button variant="ghost" size="sm" className="h-8 hover:text-success" onClick={() => addToShop(item.id)} title="In Shop hinzufügen">
                      <Store className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 hover:text-accent" onClick={() => alert("Spieler schenken Modal öffnen (WIP)")} title="Spieler schenken">
                      <Gift className="w-4 h-4" />
                    </Button>
                    <Link href={`/items/${item.id}/edit`}>
                      <Button variant="secondary" size="sm" className="h-8"><Edit className="w-4 h-4" /></Button>
                    </Link>
                    <Button variant="danger" size="sm" className="h-8" onClick={() => deleteItem(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-border/50 flex justify-between items-center bg-surface-2/30">
            <Button 
              variant="secondary" 
              size="sm" 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Zurück
            </Button>
            <span className="text-sm text-text-muted font-mono">Seite {page} von {totalPages}</span>
            <Button 
              variant="secondary" 
              size="sm" 
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Weiter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
