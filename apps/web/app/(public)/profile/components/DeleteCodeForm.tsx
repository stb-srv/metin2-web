"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DeleteCodeForm() {
  const [currentDeleteCode, setCurrentDeleteCode] = useState("")
  const [newDeleteCode, setNewDeleteCode] = useState("")
  const [newDeleteCodeConfirm, setNewDeleteCodeConfirm] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!/^\d{7}$/.test(newDeleteCode)) {
      setError("Der Löschcode muss genau 7 Ziffern enthalten.")
      setLoading(false)
      return
    }

    if (newDeleteCode !== newDeleteCodeConfirm) {
      setError("Die neuen Löschcodes stimmen nicht überein.")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/profile/change-delete-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentDeleteCode, newDeleteCode, newDeleteCodeConfirm }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Ein Fehler ist aufgetreten.")
      } else {
        setSuccess("Dein Löschcode wurde erfolgreich geändert.")
        setCurrentDeleteCode("")
        setNewDeleteCode("")
        setNewDeleteCodeConfirm("")
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
        <CardTitle className="font-display text-lg text-primary uppercase tracking-wider">Löschcode ändern</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
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
            <label className="text-xs text-text-muted font-display uppercase tracking-wider">Aktueller Löschcode</label>
            <input
              type="text"
              maxLength={7}
              placeholder="7 Ziffern"
              value={currentDeleteCode}
              onChange={(e) => setCurrentDeleteCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-surface-2 border border-border/25 rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50 transition-colors"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted font-display uppercase tracking-wider">Neuer Löschcode</label>
            <input
              type="text"
              maxLength={7}
              placeholder="z.B. 1234567"
              value={newDeleteCode}
              onChange={(e) => setNewDeleteCode(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-surface-2 border border-border/25 rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50 transition-colors"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-text-muted font-display uppercase tracking-wider">Neuer Löschcode bestätigen</label>
            <input
              type="text"
              maxLength={7}
              placeholder="z.B. 1234567"
              value={newDeleteCodeConfirm}
              onChange={(e) => setNewDeleteCodeConfirm(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-surface-2 border border-border/25 rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50 transition-colors"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/95 text-bg font-display uppercase tracking-widest text-xs py-2 hover:shadow-[0_0_15px_var(--color-glow)] transition-all"
          >
            {loading ? "Wird gespeichert..." : "Löschcode ändern"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
