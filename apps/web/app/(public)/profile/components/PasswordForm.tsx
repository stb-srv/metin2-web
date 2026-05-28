"use client"

import React, { useState } from "react"

export default function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (newPassword !== newPasswordConfirm) {
      setError("Die neuen Passwörter stimmen nicht überein.")
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, newPasswordConfirm }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Ein Fehler ist aufgetreten.")
      } else {
        setSuccess("Dein Passwort wurde erfolgreich geändert.")
        setCurrentPassword("")
        setNewPassword("")
        setNewPasswordConfirm("")
      }
    } catch (err) {
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
        Passwort ändern
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

          {(["Aktuelles Passwort", "Neues Passwort", "Neues Passwort bestätigen"] as const).map((label, i) => (
            <div key={label}>
              <label style={{
                display: "block", marginBottom: 6,
                fontFamily: "var(--font-display)", fontSize: "0.7rem",
                color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em",
              }}>{label}</label>
              <input
                type="password"
                value={i === 0 ? currentPassword : i === 1 ? newPassword : newPasswordConfirm}
                onChange={e => {
                  if (i === 0) setCurrentPassword(e.target.value)
                  else if (i === 1) setNewPassword(e.target.value)
                  else setNewPasswordConfirm(e.target.value)
                }}
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
            ℹ️ Wird auch im Spiel synchronisiert
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
            {loading ? "Wird gespeichert…" : "Passwort ändern"}
          </button>
        </form>
      </div>
    </div>
  )
}
