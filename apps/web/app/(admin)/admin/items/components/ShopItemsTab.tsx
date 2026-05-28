"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit2, Trash2, ArrowUp, ArrowDown, ShoppingBag, Eye, EyeOff } from "lucide-react"

interface Category {
  id: string
  name: string
}

interface ShopItem {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  itemVnum: number | null
  itemTemplateId: string | null
  enabled: boolean
  categoryId: string
  count: number
  order: number
  category: Category
}

export default function ShopItemsTab() {
  const [items, setItems] = useState<ShopItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState<number>(0)
  const [categoryId, setCategoryId] = useState("")
  const [itemVnum, setItemVnum] = useState<string>("")
  const [count, setCount] = useState<number>(1)
  const [order, setOrder] = useState<number>(0)
  const [enabled, setEnabled] = useState(true)

  const [lookupLoading, setLookupLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        fetch("/api/admin/shop/items"),
        fetch("/api/admin/shop/categories")
      ])

      if (itemsRes.ok) setItems(await itemsRes.json())
      if (catsRes.ok) setCategories(await catsRes.json())
    } catch (err) {
      console.error("Failed to load shop items data", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleVnumLookup = async (vnumVal: string) => {
    setItemVnum(vnumVal)
    if (!vnumVal.trim()) return

    setLookupLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/shop/items/lookup?vnum=${vnumVal}`)
      if (res.ok) {
        const template = await res.json()
        setName(template.name)
        if (template.description) setDescription(template.description)
      } else {
        // Nicht gefunden oder Fehler, kein Autofill
      }
    } catch (err) {
      // Ignorieren
    } finally {
      setLookupLoading(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setName("")
    setDescription("")
    setPrice(0)
    setCategoryId(categories[0]?.id || "")
    setItemVnum("")
    setCount(1)
    setOrder(0)
    setEnabled(true)
    setError(null)
  }

  useEffect(() => {
    if (categories.length > 0 && !categoryId) {
      setCategoryId(categories[0].id)
    }
  }, [categories, categoryId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!name.trim()) {
      setError("Name ist erforderlich.")
      return
    }
    if (!categoryId) {
      setError("Kategorie ist erforderlich.")
      return
    }

    const payload = {
      name,
      description: description.trim() || null,
      price: Number(price),
      currency: "DR",
      itemVnum: itemVnum.trim() ? Number(itemVnum) : null,
      categoryId,
      count: Number(count),
      order: Number(order),
      enabled,
      defaultEnchants: {}
    }

    try {
      const url = editingId 
        ? `/api/admin/shop/items/${editingId}`
        : "/api/admin/shop/items"
      
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok) {
        setSuccess(editingId ? "Shop-Item erfolgreich aktualisiert." : "Shop-Item erfolgreich erstellt.")
        resetForm()
        fetchData()
      } else {
        setError(data.error || "Fehler beim Speichern des Items.")
      }
    } catch (err) {
      setError("Verbindung zum Server fehlgeschlagen.")
    }
  }

  const handleEdit = (item: ShopItem) => {
    setEditingId(item.id)
    setName(item.name)
    setDescription(item.description || "")
    setPrice(item.price)
    setCategoryId(item.categoryId)
    setItemVnum(item.itemVnum ? String(item.itemVnum) : "")
    setCount(item.count)
    setOrder(item.order)
    setEnabled(item.enabled)
    setError(null)
    setSuccess(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bist du sicher, dass du dieses Item aus dem Shop löschen möchtest?")) return
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/admin/shop/items/${id}`, {
        method: "DELETE"
      })
      const data = await res.json()

      if (res.ok) {
        setSuccess("Shop-Item erfolgreich gelöscht.")
        fetchData()
        if (editingId === id) resetForm()
      } else {
        setError(data.error || "Fehler beim Löschen des Items.")
      }
    } catch (err) {
      setError("Verbindung zum Server fehlgeschlagen.")
    }
  }

  const handleOrderChange = async (item: ShopItem, direction: "up" | "down") => {
    const currentIndex = items.findIndex(i => i.id === item.id)
    if (direction === "up" && currentIndex === 0) return
    if (direction === "down" && currentIndex === items.length - 1) return

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    const targetItem = items[targetIndex]

    const orderTemp = item.order
    item.order = targetItem.order
    targetItem.order = orderTemp

    try {
      await Promise.all([
        fetch(`/api/admin/shop/items/${item.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...item, categoryId: item.categoryId })
        }),
        fetch(`/api/admin/shop/items/${targetItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...targetItem, categoryId: targetItem.categoryId })
        })
      ])
      fetchData()
    } catch (err) {
      console.error("Order update failed", err)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Items List */}
      <div className="lg:col-span-2 space-y-4">
        {loading ? (
          <div className="text-center py-10 font-display text-text-muted animate-pulse">Shop-Items laden...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-border/20 rounded text-text-muted">Keine Shop-Items vorhanden.</div>
        ) : (
          items.map((item, idx) => (
            <Card key={item.id} className="bg-surface/60 border-border/20 hover:border-primary/20 transition-all">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-surface-2 flex items-center justify-center text-lg border border-border/10">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-bold text-text text-sm flex items-center gap-2">
                      {item.name}
                      <span className="text-xs text-text-muted font-normal">x{item.count}</span>
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-surface-2 border border-border/10 text-text-muted">
                        {item.category?.name || "Kategorie"}
                      </Badge>
                      <Badge variant={item.enabled ? "success" : "default"} className="text-[10px] px-1 py-0 h-4">
                        {item.enabled ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      Preis: <span className="text-primary font-bold">{item.price} DR 💰</span>
                      {item.itemVnum && <span className="ml-2 font-mono">VNUM: {item.itemVnum}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-8 h-8 border-border/20"
                    disabled={idx === 0}
                    onClick={() => handleOrderChange(item, "up")}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-8 h-8 border-border/20"
                    disabled={idx === items.length - 1}
                    onClick={() => handleOrderChange(item, "down")}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-8 h-8 border-border/20 text-primary hover:text-primary/80"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="w-8 h-8 border-border/20 text-danger hover:text-danger/80"
                    onClick={() => handleDelete(item.id)}
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
              {editingId ? "Shop-Item bearbeiten" : "Neues Shop-Item anlegen"}
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
                <label className="text-xs text-text-muted font-display uppercase">VNUM (Metin2 Item-Vorlage)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="z.B. 10"
                    value={itemVnum}
                    onChange={(e) => handleVnumLookup(e.target.value)}
                    className="w-full bg-surface-2 border border-border/25 rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
                  />
                  {lookupLoading && <span className="text-[10px] text-primary animate-pulse flex items-center">Autofill...</span>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-text-muted font-display uppercase">Name</label>
                <input
                  type="text"
                  placeholder="Schwert+9"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-2 border border-border/25 rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-text-muted font-display uppercase">Kategorie</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-surface-2 border border-border/25 rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
                  required
                >
                  <option value="" disabled>Kategorie wählen</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-text-muted font-display uppercase">Preis (DR)</label>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-surface-2 border border-border/25 rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-text-muted font-display uppercase">Anzahl (Count)</label>
                  <input
                    type="number"
                    min={1}
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full bg-surface-2 border border-border/25 rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-text-muted font-display uppercase">Beschreibung (optional)</label>
                <textarea
                  placeholder="Beschreibung des Items..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-surface-2 border border-border/25 rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50 h-16 resize-none"
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
                  id="item-active"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded bg-surface-2 border-border/30 text-primary focus:ring-0"
                />
                <label htmlFor="item-active" className="text-xs text-text font-display uppercase select-none cursor-pointer">Aktiv</label>
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
