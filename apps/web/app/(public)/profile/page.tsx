"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { LogOut, ArrowRight } from "lucide-react"

import PasswordForm from "./components/PasswordForm"
import DeleteCodeForm from "./components/DeleteCodeForm"
import CharacterList from "./components/CharacterList"

interface ProfileDetails {
  id: string
  name: string | null
  email: string
  role: string
  accountId: number | null
  createdAt: string
}

const ROLE_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN:     { label: "Administrator", color: "#e74c3c", bg: "rgba(231,76,60,0.15)" },
  MODERATOR: { label: "Moderator",     color: "#3498db", bg: "rgba(52,152,219,0.15)" },
  USER:      { label: "Spieler",       color: "var(--color-text-muted)", bg: "rgba(255,255,255,0.05)" },
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const [profile, setProfile] = useState<ProfileDetails | null>(null)
  const [balance, setBalance] = useState<{ dr: number; dm: number } | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetch("/api/profile")
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setProfile(data) })
        .catch(err => console.error("Error loading profile", err))
        .finally(() => setLoadingDetails(false))

      fetch("/api/coins/balance")
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setBalance(data) })
        .catch(err => console.error("Error loading balance", err))
    }
  }, [session])

  if (status === "loading" || (session && loadingDetails)) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, color: "var(--color-text-muted)", fontFamily: "var(--font-display)" }}>
        <span className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" style={{ marginRight: 12 }} />
        Profil-Daten werden geladen…
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "center", paddingTop: 80 }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔐</div>
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--color-danger)", fontSize: "1.5rem", textTransform: "uppercase", marginBottom: 8 }}>
          Nicht angemeldet
        </h2>
        <p style={{ color: "var(--color-text-muted)", marginBottom: 24, fontFamily: "var(--font-body)", fontSize: "0.9rem" }}>
          Du musst angemeldet sein, um auf diese Seite zuzugreifen.
        </p>
        <Link href="/login" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "var(--color-primary)", color: "#fff",
          padding: "10px 24px", borderRadius: 4,
          fontFamily: "var(--font-display)", fontWeight: 700,
          fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em",
          textDecoration: "none",
        }}>
          Zum Login <ArrowRight size={14} />
        </Link>
      </div>
    )
  }

  const user = session.user
  const roleInfo = ROLE_STYLE[user.role ?? "USER"] ?? ROLE_STYLE.USER
  const registerDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" })
    : "Unbekannt"

  return (
    <div className="space-y-6" style={{ maxWidth: 1100 }}>
      <div>
        <h1 className="section-header" style={{ fontSize: "1.8rem", display: "inline-block" }}>Mein Profil</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: 6, fontFamily: "var(--font-body)" }}>
          Verwalte deine Account-Details, Sicherheitseinstellungen und Charaktere.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        {/* ── Linke Spalte ── */}
        <div className="space-y-5">
          {/* Account-Box */}
          <div style={{
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: 6, overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{
              background: "var(--color-surface-2)", padding: "20px 24px",
              borderBottom: "1px solid var(--color-border)",
              display: "flex", alignItems: "center", gap: 16,
            }}>
              {/* Initial-Kreis */}
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(192,57,43,0.2)", border: "2px solid rgba(192,57,43,0.5)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.6rem",
                color: "var(--color-primary)", flexShrink: 0,
              }}>
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
              <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.3rem", color: "var(--color-text)", margin: 0 }}>
                  {user.name || "Spieler"}
                </h2>
                <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  <span style={{
                    background: roleInfo.bg, color: roleInfo.color,
                    border: `1px solid ${roleInfo.color}40`,
                    borderRadius: 4, padding: "2px 10px",
                    fontFamily: "var(--font-display)", fontSize: "0.7rem",
                    fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>
                    {roleInfo.label}
                  </span>
                  <span style={{
                    background: "rgba(255,255,255,0.05)", color: "var(--color-text-muted)",
                    borderRadius: 4, padding: "2px 10px", border: "1px solid var(--color-border)",
                    fontFamily: "var(--font-display)", fontSize: "0.7rem",
                  }}>
                    ID: {user.accountId}
                  </span>
                </div>
              </div>
            </div>

            {/* Details */}
            <div style={{ padding: "20px 24px" }}>
              <h3 style={{
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.7rem",
                textTransform: "uppercase", letterSpacing: "0.1em",
                color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border)",
                paddingBottom: 8, marginBottom: 16,
              }}>
                Account-Daten
              </h3>

              {[
                { label: "Account-Name", value: user.name },
                { label: "E-Mail-Adresse", value: user.email },
                { label: "Registriert am", value: registerDate },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0", borderBottom: "1px solid var(--color-border)",
                }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "0.85rem", color: "var(--color-text)", fontWeight: 600 }}>
                    {value}
                  </span>
                </div>
              ))}

              {/* Kontostand */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0", borderBottom: "1px solid var(--color-border)",
              }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Kontostand
                </span>
                <div style={{ display: "flex", gap: 12, fontFamily: "var(--font-display)", fontSize: "0.85rem" }}>
                  <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>
                    💰 {(balance?.dr || 0).toLocaleString()} DR
                  </span>
                  <span style={{ color: "var(--color-success)", fontWeight: 700 }}>
                    💎 {(balance?.dm || 0).toLocaleString()} DM
                  </span>
                </div>
              </div>

              {/* Abmelden */}
              <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "rgba(231,76,60,0.1)", border: "1px solid rgba(231,76,60,0.3)",
                    color: "var(--color-danger)", borderRadius: 4,
                    padding: "8px 16px", cursor: "pointer",
                    fontFamily: "var(--font-display)", fontWeight: 700,
                    fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(231,76,60,0.2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(231,76,60,0.1)"}
                >
                  <LogOut size={14} /> Abmelden
                </button>
              </div>
            </div>
          </div>

          {/* Charaktere */}
          <CharacterList />
        </div>

        {/* ── Rechte Spalte: Formulare ── */}
        <div className="space-y-5">
          <PasswordForm />
          <DeleteCodeForm />
        </div>
      </div>
    </div>
  )
}
