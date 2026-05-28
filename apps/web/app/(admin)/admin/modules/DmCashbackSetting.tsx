"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface DmCashbackSettingProps {
  initialValue: string
}

export function DmCashbackSetting({ initialValue }: DmCashbackSettingProps) {
  const [value, setValue] = useState(initialValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const numValue = parseInt(value, 10)
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      setError("Der DM-Cashback-Prozentsatz muss zwischen 0 und 100 liegen.")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "dm_cashback_percent", value: String(numValue) }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Ein Fehler ist aufgetreten.")
      } else {
        setSuccess("Einstellung erfolgreich gespeichert.")
        setValue(String(numValue))
      }
    } catch (err) {
      setError("Verbindung zum Server fehlgeschlagen.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-surface border-border/30 shadow-[0_0_20px_var(--color-glow)]">
      <CardHeader className="border-b border-border/20 pb-4">
        <CardTitle className="font-display text-lg text-primary uppercase tracking-wider">
          Dark Matter (DM) Cashback Einstellung
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSave} className="space-y-4 max-w-md">
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
            <label className="text-xs text-text-muted font-display uppercase tracking-wider">
              DM Cashback Prozentsatz
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-surface-2 border border-border/25 rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50 transition-colors"
                required
              />
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/95 text-bg font-display uppercase tracking-wider text-xs px-6 py-2 transition-all hover:shadow-[0_0_12px_var(--color-glow)]"
              >
                {loading ? "Speichern..." : "Speichern"}
              </Button>
            </div>
            <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
              Hinweis: 0 = kein DM-Cashback, 10 = 10% DM pro DR-Ausgabe.
              Bei jedem Einkauf im Item Shop erhält der Spieler den konfigurierten Prozentsatz des Kaufpreises in DM erstattet.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
