"use client"

import React, { useState } from "react"

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
    } catch {
      setError("Verbindung zum Server fehlgeschlagen.")
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#0f1014",
    border: "1px solid var(--color-border)",
    borderRadius: 4, padding: "10px 14px",
    color: "var(--color-text)", fontFamily: "var(--font-body)",
    fontSize: "0.875rem", outline: "none", transition: "border-color 0.15s",
  }

  return (
    <div style={{
      background: "var(--color-surface)", border: "1px solid var(--color-border)",
      borderRadius: 6, overflow: "hidden",
    }}>
      <div className="section-header px-5 py-3" style={{
        background: "var(--color-surface-2)", borderBottom: "2px solid var(--color-primary)",
        fontSize: "0.85rem",
      }}>
        Löschcode ändern
      </div>
      <div style={{ padding: "20px 24px" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {error && (
            <div style={{
              padding: "10px 12px", borderRadius: 4,
              background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.3)",
              color: "var(--color-danger)", fontFamily: "var(--font-display)", fontSize: "0.78rem",
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              padding: "10px 12px", borderRadius: 4,
              background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.3)",
              color: "var(--color-success)", fontFamily: "var(--font-display)", fontSize: "0.78rem",
            }}>
              {success}
            </div>
          )}

          {[
            { label: "Aktueller Löschcode", val: currentDeleteCode, setter: setCurrentDeleteCode },
            { label: "Neuer Löschcode",     val: newDeleteCode,     setter: setNewDeleteCode },
            { label: "Löschcode bestätigen",val: newDeleteCodeConfirm, setter: setNewDeleteCodeConfirm },
          ].map(({ label, val, setter }) => (
            <div key={label}>
              <label style={{
                display: "block", marginBottom: 6,
                fontFamily: "var(--font-display)", fontSize: "0.7rem",
                color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em",
              }}>{label}</label>
              <input
                type="text"
                maxLength={7}
                placeholder="7 Ziffern"
                value={val}
                onChange={e => setter(e.target.value.replace(/\D/g, ""))}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = "var(--color-primary)" }}
                onBlur={e => { e.currentTarget.style.borderColor = "var(--color-border)" }}
                required
              />
            </div>
          ))}

          <p style={{
            fontFamily: "var(--font-body)", fontSize: "0.72rem",
            color: "var(--color-text-muted)", marginTop: 2,
          }}>
            ℹ️ 7-stellige Zahl — zum Löschen von Charakteren und Items
          </p>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px 0",
              background: loading ? "var(--color-surface-2)" : "var(--color-primary)",
              border: "none", borderRadius: 4, color: "#fff",
              fontFamily: "var(--font-display)", fontWeight: 700,
              fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em",
              cursor: loading ? "not-allowed" : "pointer", transition: "background 0.15s",
            }}
          >
            {loading ? "Wird gespeichert…" : "Löschcode ändern"}
          </button>
        </form>
      </div>
    </div>
  )
}
