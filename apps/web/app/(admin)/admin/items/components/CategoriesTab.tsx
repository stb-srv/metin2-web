"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, Folder } from "lucide-react"

interface Category {
  id: string
  name: string
  icon: string | null
  order: number
  active: boolean
}

export default function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [icon, setIcon] = useState("")
  const [order, setOrder] = useState<number>(0)
  const [active, setActive] = useState(true)
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/shop/categories")
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch (err) {
      console.error("Failed to fetch categories", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setName("")
    setIcon("")
    setOrder(0)
    setActive(true)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!name.trim()) {
      setError("Name ist erforderlich.")
      return
    }

    const payload = { name, icon: icon.trim() || null, order: Number(order), active }

    try {
      const url = editingId 
        ? `/api/admin/shop/categories/${editingId}`
        : "/api/admin/shop/categories"
      
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok) {
        setSuccess(editingId ? "Kategorie erfolgreich aktualisiert." : "Kategorie erfolgreich erstellt.")
        resetForm()
        fetchCategories()
      } else {
        setError(data.error || "Fehler beim Speichern der Kategorie.")
      }
    } catch (err) {
      setError("Verbindung zum Server fehlgeschlagen.")
    }
  }

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id)
    setName(cat.name)
    setIcon(cat.icon || "")
    setOrder(cat.order)
    setActive(cat.active)
    setError(null)
    setSuccess(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bist du sicher, dass du diese Kategorie löschen möchtest? Dies kann nicht rückgängig gemacht werden.")) return
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/admin/shop/categories/${id}`, {
        method: "DELETE"
      })
      const data = await res.json()

      if (res.ok) {
        setSuccess("Kategorie erfolgreich gelöscht.")
        fetchCategories()
        if (editingId === id) resetForm()
      } else {
        setError(data.error || "Fehler beim Löschen der Kategorie.")
      }
    } catch (err) {
      setError("Verbindung zum Server fehlgeschlagen.")
    }
  }

  const handleOrderChange = async (cat: Category, direction: "up" | "down") => {
    const currentIndex = categories.findIndex(c => c.id === cat.id)
    if (direction === "up" && currentIndex === 0) return
    if (direction === "down" && currentIndex === categories.length - 1) return

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    const targetCat = categories[targetIndex]

    // Order tauschen
    const orderTemp = cat.order
    cat.order = targetCat.order
    targetCat.order = orderTemp

    try {
      // Beide Kategorien speichern
      await Promise.all([
        fetch(`/api/admin/shop/categories/${cat.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: cat.name, icon: cat.icon, order: cat.order, active: cat.active })
        }),
        fetch(`/api/admin/shop/categories/${targetCat.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: targetCat.name, icon: targetCat.icon, order: targetCat.order, active: targetCat.active })
        })
      ])
      fetchCategories()
    } catch (err) {
      console.error("Order update failed", err)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Category List */}
      <div className="lg:col-span-2 space-y-4">
        {loading ? (
          <div className="text-center py-10 font-display text-text-muted animate-pulse">Kategorien laden...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border/20 rounded text-text-muted">Keine Kategorien vorhanden.</div>
        ) : (
          categories.map((cat, idx) => (
            <Card key={cat.id} className="bg-surface/60 border-border/20 hover:border-primary/20 transition-all">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-surface-2 flex items-center justify-center text-lg border border-border/10">
                    {cat.icon || <Folder className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <div className="font-bold text-text text-sm flex items-center gap-2">
                      {cat.name}
                      <Badge variant={cat.active ? "success" : "default"} className="text-[10px] px-1 py-0 h-4">
                        {cat.active ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">Order: {cat.order}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-8 h-8 border-border/20"
                    disabled={idx === 0}
                    onClick={() => handleOrderChange(cat, "up")}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-8 h-8 border-border/20"
                    disabled={idx === categories.length - 1}
                    onClick={() => handleOrderChange(cat, "down")}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-8 h-8 border-border/20 text-primary hover:text-primary/80"
                    onClick={() => handleEdit(cat)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-8 h-8 border-border/20 text-danger hover:text-danger/80"
                    onClick={() => handleDelete(cat.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add/Edit Form */}
      <div>
        <Card className="bg-surface border-border/30 shadow-[0_0_15px_var(--color-glow)]">
          <CardContent className="pt-6">
            <h3 className="font-display text-sm text-primary uppercase tracking-wider border-b border-border/10 pb-2 mb-4">
              {editingId ? "Kategorie bearbeiten" : "Neue Kategorie erstellen"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-danger/10 border border-danger/30 text-danger text-xs p-3 rounded">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-success/10 border border-success/30 text-success text-xs p-3 rounded">
                  {success}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-text-muted font-display uppercase">Name</label>
                <input
                  type="text"
                  placeholder="z.B. Waffen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-2 border border-border/25 rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-text-muted font-display uppercase">Icon / Emoji</label>
                <input
                  type="text"
                  placeholder="z.B. ⚔️ oder icon-name"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full bg-surface-2 border border-border/25 rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-text-muted font-display uppercase">Reihenfolge (Order)</label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(Number(e.target.value))}
                  className="w-full bg-surface-2 border border-border/25 rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded bg-surface-2 border-border/30 text-primary focus:ring-0"
                />
                <label htmlFor="active" className="text-xs text-text font-display uppercase select-none cursor-pointer">Aktiv</label>
              </div>

              <div className="flex gap-2 pt-2">
                {editingId && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetForm}
                    className="w-full border-border/40 text-xs font-display uppercase"
                  >
                    Abbrechen
                  </Button>
                )}
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/95 text-bg font-display uppercase tracking-widest text-xs py-2 hover:shadow-[0_0_12px_var(--color-glow)]"
                >
                  Speichern
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
