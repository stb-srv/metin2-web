"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type ModuleType = {
  id: string
  name: string
  enabled: boolean
  order: number
}

export function ModulesList({ initialModules }: { initialModules: ModuleType[] }) {
  const [modules, setModules] = useState<ModuleType[]>(initialModules)

  const toggleModule = async (id: string, currentEnabled: boolean) => {
    try {
      // Optimistic update for fast UI feeling
      setModules(prev => prev.map(m => m.id === id ? { ...m, enabled: !currentEnabled } : m))

      const res = await fetch(`/api/admin/modules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentEnabled })
      })

      if (!res.ok) {
        throw new Error("Failed to update module")
      }
    } catch (err) {
      console.error(err)
      // Revert if API fails
      setModules(prev => prev.map(m => m.id === id ? { ...m, enabled: currentEnabled } : m))
    }
  }

  return (
    <div className="grid gap-4">
      {modules.map(mod => (
        <Card key={mod.id} className="bg-surface/80 hover:border-primary/50 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="font-display font-bold text-lg text-text tracking-wide">{mod.name}</div>
              <div className="text-sm text-text-muted font-mono">{mod.id}</div>
            </div>
            
            <div className="flex items-center gap-6">
              <Badge variant={mod.enabled ? "success" : "default"} className="w-24 justify-center">
                {mod.enabled ? "Aktiv" : "Deaktiviert"}
              </Badge>
              
              <button
                onClick={() => toggleModule(mod.id, mod.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg ${mod.enabled ? 'bg-success shadow-[0_0_8px_var(--color-success)]' : 'bg-surface-2 border border-border'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mod.enabled ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {modules.length === 0 && (
        <div className="text-center p-8 border border-dashed border-border/50 rounded-lg text-text-muted">
          Keine Module in der Datenbank gefunden.
        </div>
      )}
    </div>
  )
}
