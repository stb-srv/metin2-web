"use client"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle2, Trash2 } from "lucide-react"

type ThemeType = {
  id: string
  name: string
  isDefault: boolean
  config: string
}

export function ThemesList({ initialThemes }: { initialThemes: ThemeType[] }) {
  const [themes, setThemes] = useState<ThemeType[]>(initialThemes)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activateTheme = async (id: string) => {
    try {
      setThemes(prev => prev.map(t => ({ ...t, isDefault: t.id === id })))
      const res = await fetch(`/api/themes/${id}/activate`, { method: "POST" })
      if (!res.ok) throw new Error("Aktivierung fehlgeschlagen")
    } catch (err) {
      console.error(err)
      alert("Fehler beim Aktivieren des Themes.")
      window.location.reload()
    }
  }

  const deleteTheme = async (id: string) => {
    if (!confirm("Theme wirklich löschen?")) return
    try {
      const res = await fetch(`/api/admin/themes/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Löschen fehlgeschlagen")
      }
      setThemes(prev => prev.filter(t => t.id !== id))
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      
      const res = await fetch("/api/admin/themes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Upload fehlgeschlagen")
      }

      const newTheme = await res.json()
      setThemes(prev => [newTheme, ...prev])
      alert("Theme erfolgreich hochgeladen!")
    } catch (err: any) {
      alert(`Fehler beim Upload: ${err.message}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <input 
          type="file" 
          accept=".json" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? "Wird hochgeladen..." : "Theme JSON hochladen"}
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
        {themes.map(theme => {
          let configObj: any = {}
          try { configObj = JSON.parse(theme.config) } catch (e) {}
          const colors = configObj.colors || {}

          return (
            <Card key={theme.id} className={`bg-surface/80 ${theme.isDefault ? 'border-primary shadow-[0_0_15px_var(--color-glow)]' : ''}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-display font-bold text-xl">{theme.name}</h3>
                      {theme.isDefault && <Badge variant="success">Aktiv</Badge>}
                    </div>
                    <p className="text-sm text-text-muted font-mono">{theme.id}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    {!theme.isDefault && (
                      <Button variant="secondary" size="sm" onClick={() => activateTheme(theme.id)}>
                        <CheckCircle2 className="w-4 h-4 mr-2" /> Aktivieren
                      </Button>
                    )}
                    {!theme.isDefault && (
                      <Button variant="danger" size="icon" onClick={() => deleteTheme(theme.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-2">Farbpalette</div>
                  <div className="flex flex-wrap gap-2">
                    {['--color-primary', '--color-bg', '--color-surface', '--color-accent', '--color-danger'].map(colorKey => (
                      <div 
                        key={colorKey}
                        className="w-8 h-8 rounded-full border border-border/50 shadow-sm"
                        style={{ backgroundColor: colors[colorKey] || 'transparent' }}
                        title={`${colorKey}: ${colors[colorKey]}`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
