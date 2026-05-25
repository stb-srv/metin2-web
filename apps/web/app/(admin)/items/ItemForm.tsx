"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type ItemData = {
  id?: string
  vnum: number
  name: string
  description: string
  iconUrl: string
  itemType: string
  grade: "NORMAL" | "RARE" | "EPIC" | "LEGENDARY"
  attributes: string
  enabled: boolean
}

export function ItemForm({ initialData }: { initialData?: Partial<ItemData> }) {
  const router = useRouter()
  const [formData, setFormData] = useState<ItemData>({
    vnum: initialData?.vnum || 0,
    name: initialData?.name || "",
    description: initialData?.description || "",
    iconUrl: initialData?.iconUrl || "/items/default.png",
    itemType: initialData?.itemType || "WEAPON",
    grade: initialData?.grade || "NORMAL",
    attributes: initialData?.attributes || "{}",
    enabled: initialData?.enabled ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [jsonError, setJsonError] = useState("")

  const isEdit = !!initialData?.id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setJsonError("")
    
    let parsedAttributes = {}
    try {
      parsedAttributes = JSON.parse(formData.attributes)
    } catch (e) {
      setJsonError("Ungültiges JSON-Format in den Attributen.")
      return
    }

    setLoading(true)
    try {
      const url = isEdit ? `/api/admin/items/${initialData.id}` : "/api/admin/items"
      const method = isEdit ? "PATCH" : "POST"

      const payload = {
        ...formData,
        attributes: parsedAttributes
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Speichern fehlgeschlagen")
      }
      router.push("/items")
      router.refresh()
    } catch (err: any) {
      alert(`Fehler: ${err.message}`)
      setLoading(false)
    }
  }

  const getGradeColor = () => {
    switch(formData.grade) {
      case "RARE": return "text-accent border-accent shadow-[0_0_15px_var(--color-accent)]"
      case "EPIC": return "text-primary border-primary shadow-[0_0_20px_var(--color-primary)]"
      case "LEGENDARY": return "text-danger border-danger shadow-[0_0_25px_var(--color-danger)]"
      default: return "text-text border-border"
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="bg-surface/80 border-border/50">
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-text-muted mb-2 font-display uppercase tracking-wider">VNUM</label>
                <input 
                  type="number"
                  required
                  min="1"
                  className="w-full bg-surface-2 border border-border/50 rounded-md px-4 py-3 text-text focus:outline-none focus:border-primary font-mono transition-colors"
                  value={formData.vnum || ""}
                  onChange={e => setFormData({...formData, vnum: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-muted mb-2 font-display uppercase tracking-wider">Item Name</label>
                <input 
                  required
                  className="w-full bg-surface-2 border border-border/50 rounded-md px-4 py-3 text-text focus:outline-none focus:border-primary transition-colors"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-text-muted mb-2 font-display uppercase tracking-wider">Kategorie / Typ</label>
                <input 
                  required
                  className="w-full bg-surface-2 border border-border/50 rounded-md px-4 py-3 text-text focus:outline-none focus:border-primary transition-colors"
                  value={formData.itemType}
                  onChange={e => setFormData({...formData, itemType: e.target.value})}
                  placeholder="z.B. WEAPON, ARMOR, RING"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-text-muted mb-2 font-display uppercase tracking-wider">Grade</label>
                <select
                  className="w-full bg-surface-2 border border-border/50 rounded-md px-4 py-3 text-text focus:outline-none focus:border-primary transition-colors"
                  value={formData.grade}
                  onChange={e => setFormData({...formData, grade: e.target.value as any})}
                >
                  <option value="NORMAL">Normal</option>
                  <option value="RARE">Rare</option>
                  <option value="EPIC">Epic</option>
                  <option value="LEGENDARY">Legendary</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-text-muted mb-2 font-display uppercase tracking-wider">Icon URL</label>
              <input 
                className="w-full bg-surface-2 border border-border/50 rounded-md px-4 py-3 text-text focus:outline-none focus:border-primary font-mono text-sm transition-colors"
                value={formData.iconUrl}
                onChange={e => setFormData({...formData, iconUrl: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-text-muted mb-2 font-display uppercase tracking-wider">Beschreibung</label>
              <textarea 
                rows={3}
                className="w-full bg-surface-2 border border-border/50 rounded-md px-4 py-3 text-text focus:outline-none focus:border-primary resize-y text-sm transition-colors"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-text-muted font-display uppercase tracking-wider">Attribute (JSON)</label>
                {jsonError && <span className="text-xs text-danger font-bold">{jsonError}</span>}
              </div>
              <textarea 
                rows={6}
                className={`w-full bg-[#090a10] border ${jsonError ? 'border-danger' : 'border-border/50'} rounded-md px-4 py-3 text-success focus:outline-none focus:border-primary resize-y font-mono text-sm transition-colors`}
                value={formData.attributes}
                onChange={e => {
                  setFormData({...formData, attributes: e.target.value})
                  setJsonError("")
                }}
              />
            </div>

            <div className="pt-4 border-t border-border/30">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={formData.enabled}
                  onChange={e => setFormData({...formData, enabled: e.target.checked})}
                  className="w-5 h-5 rounded border-border bg-surface-2 text-primary focus:ring-primary focus:ring-offset-surface transition-all"
                />
                <span className="text-sm font-medium text-text group-hover:text-primary transition-colors">Item aktiviert</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="secondary" type="button" onClick={() => router.push("/items")}>Abbrechen</Button>
          <Button type="submit" disabled={loading}>{loading ? "Speichert..." : "Item speichern"}</Button>
        </div>
      </form>

      {/* Live Preview Side */}
      <div>
        <div className="sticky top-28">
          <h3 className="text-sm font-display font-bold text-text-muted tracking-widest uppercase mb-4">Live Vorschau</h3>
          <Card className={`bg-surface border-2 transition-all duration-500 ${getGradeColor()} overflow-hidden`}>
            <CardContent className="p-0">
              <div className="bg-surface-2 p-8 flex justify-center items-center min-h-[200px] border-b border-inherit/30 relative">
                {formData.iconUrl ? (
                  <img src={formData.iconUrl} alt="Item" className="w-24 h-24 object-contain filter drop-shadow-xl" 
                       onError={(e) => { e.currentTarget.style.display='none' }} />
                ) : (
                  <div className="w-24 h-24 bg-border/20 rounded-md animate-pulse" />
                )}
                <div className="absolute top-3 right-3 text-xs font-mono opacity-50 px-2 py-1 bg-bg/50 rounded border border-inherit/30">
                  #{formData.vnum || "0"}
                </div>
              </div>
              <div className="p-6">
                <h4 className="font-display font-bold text-xl mb-1 truncate text-text">{formData.name || "Item Name"}</h4>
                <p className="text-sm text-text-muted mb-4 font-bold">{formData.itemType || "TYP"}</p>
                
                <p className="text-sm text-text/80 leading-relaxed mb-6 italic border-l-2 border-inherit/50 pl-3">
                  {formData.description || "Keine Beschreibung vorhanden..."}
                </p>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-text-muted uppercase mb-3">Attribute</div>
                  {(() => {
                    try {
                      const attrs = JSON.parse(formData.attributes)
                      return Object.entries(attrs).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-sm bg-surface-2/50 px-3 py-2 rounded">
                          <span className="text-text-muted">{key}</span>
                          <span className="text-primary font-bold">+{String(val)}</span>
                        </div>
                      ))
                    } catch {
                      return <div className="text-sm text-danger opacity-70 border border-danger/30 p-2 rounded">Warte auf valides JSON...</div>
                    }
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
