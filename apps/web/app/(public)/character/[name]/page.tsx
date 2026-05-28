"use client"

import React, { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

type CharacterDetails = {
  id: number
  name: string
  level: number
  job: number
  empire: number
  guild_name: string | null
  playtime: number
  alignment: number
  hp_max: number
  sp_max: number
  st: number
  ht: number
  dx: number
  iq: number
  str: number
  exp: number
  gold: number
  logoff_time: number
}

const JOB_INFO: Record<number, { name: string; emoji: string; color: string }> = {
  0: { name: "Krieger",    emoji: "⚔",  color: "#c0392b" },
  1: { name: "Kriegerin",  emoji: "⚔",  color: "#c0392b" },
  2: { name: "Ninja",      emoji: "🏹", color: "#2980b9" },
  3: { name: "Ninja(w)",   emoji: "🏹", color: "#2980b9" },
  4: { name: "Sura",       emoji: "🔮", color: "#8e44ad" },
  5: { name: "Sura(w)",    emoji: "🔮", color: "#8e44ad" },
  6: { name: "Schamane",   emoji: "🌿", color: "#27ae60" },
  7: { name: "Schamanin",  emoji: "🌿", color: "#27ae60" },
}

const EMPIRE_INFO: Record<number, { name: string; color: string; bg: string }> = {
  1: { name: "Shinsoo", color: "#e74c3c", bg: "rgba(231,76,60,0.15)" },
  2: { name: "Chunjo",  color: "#f1c40f", bg: "rgba(241,196,15,0.15)" },
  3: { name: "Jinno",   color: "#3498db", bg: "rgba(52,152,219,0.15)" },
}

function StatBlock({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      background: "var(--color-surface-2)",
      borderLeft: "3px solid var(--color-primary)",
      borderRadius: "0 4px 4px 0",
      padding: "12px 16px",
    }}>
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: "0.65rem",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: "var(--color-text-muted)",
        marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: "1.2rem",
        fontWeight: 700,
        color: "var(--color-text)",
      }}>
        {value}
      </div>
    </div>
  )
}

export default function CharacterPage({ params }: { params: Promise<{ name: string }> }) {
  const router = useRouter()
  const { name } = use(params)
  const [character, setCharacter] = useState<CharacterDetails | null>(null)
  const [serverRank, setServerRank] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/modules/character/${name}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(res.status === 404 ? "Charakter nicht gefunden" : "Serverfehler")
        }
        return res.json()
      })
      .then(d => {
        setCharacter(d)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error loading character:", err)
        setError(err.message || "Fehler beim Laden des Charakters")
        setLoading(false)
      })
  }, [name])

  useEffect(() => {
    fetch("/api/modules/rankings?type=level&limit=1000")
      .then(res => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then(d => {
        const rankings = d.rankings || []
        const decodedName = decodeURIComponent(name)
        const idx = rankings.findIndex((r: any) => r.name.toLowerCase() === decodedName.toLowerCase())
        setServerRank(idx !== -1 ? idx + 1 : null)
      })
      .catch(err => {
        console.error("Error fetching rank:", err)
      })
  }, [name])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-display)" }}>
        <span className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin mr-3" />
        Charakter-Daten werden geladen…
      </div>
    )
  }

  if (error || !character) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--color-danger)", fontSize: "1.5rem", textTransform: "uppercase" }}>
          Fehler
        </h2>
        <p style={{ color: "var(--color-text-muted)" }}>{error || "Charakter konnte nicht geladen werden."}</p>
        <button
          onClick={() => router.back()}
          style={{
            background: "var(--color-primary)", color: "#fff",
            fontFamily: "var(--font-display)", textTransform: "uppercase",
            letterSpacing: "0.1em", padding: "8px 20px", borderRadius: 4, border: "none",
            cursor: "pointer", fontWeight: 700,
          }}
        >
          ← Zurück
        </button>
      </div>
    )
  }

  const job = JOB_INFO[character.job] ?? { name: "Lykaner", emoji: "🐺", color: "#888" }
  const empire = EMPIRE_INFO[character.empire] ?? { name: "Unbekannt", color: "#888", bg: "transparent" }
  const isOnline = character.logoff_time === 0
  const playtimeHours = Math.floor(character.playtime / 60)

  return (
    <div className="space-y-4">
      {/* Zurück-Button */}
      <button
        onClick={() => router.back()}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "transparent", border: "1px solid var(--color-border)",
          color: "var(--color-text-muted)", fontFamily: "var(--font-display)",
          fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em",
          padding: "6px 14px", borderRadius: 4, cursor: "pointer", transition: "all 0.15s",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = "var(--color-text)"
          e.currentTarget.style.borderColor = "var(--color-text-muted)"
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = "var(--color-text-muted)"
          e.currentTarget.style.borderColor = "var(--color-border)"
        }}
      >
        <ArrowLeft size={12} /> Zurück
      </button>

      {/* Main 2-Spalten-Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">

        {/* ── Linke Sidebar ── */}
        <div style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 6,
          padding: "28px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          textAlign: "center",
        }}>
          {/* Klassen-Avatar */}
          <div style={{
            width: 90, height: 90,
            borderRadius: 6,
            background: `${job.color}20`,
            border: `2px solid ${job.color}50`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.8rem",
          }}>
            {job.emoji}
          </div>

          {/* Name */}
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "var(--color-text)",
            margin: 0,
            lineHeight: 1.1,
          }}>
            {character.name}
          </h1>

          {/* Klasse */}
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: "0.8rem",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}>
            {job.name}
          </span>

          {/* Imperium-Badge */}
          <span style={{
            display: "inline-block",
            background: empire.bg,
            color: empire.color,
            border: `1px solid ${empire.color}50`,
            borderRadius: 4,
            padding: "3px 12px",
            fontFamily: "var(--font-display)",
            fontSize: "0.75rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            {empire.name}
          </span>

          {/* Online-Status */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-display)", fontSize: "0.8rem" }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: isOnline ? "var(--color-success)" : "var(--color-text-muted)",
              boxShadow: isOnline ? "0 0 6px var(--color-success)" : "none",
              display: "inline-block",
              flexShrink: 0,
            }} />
            <span style={{ color: isOnline ? "var(--color-success)" : "var(--color-text-muted)" }}>
              {isOnline
                ? "Online"
                : `Zuletzt: ${new Date(character.logoff_time * 1000).toLocaleDateString("de-DE")}`
              }
            </span>
          </div>

          {/* Server-Rang */}
          {serverRank !== null && (
            <div style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
              padding: "6px 16px",
              fontFamily: "var(--font-display)",
              fontSize: "0.8rem",
              color: "var(--color-text-muted)",
            }}>
              🏆 <span style={{ color: "var(--color-primary)", fontWeight: 700 }}>#{serverRank}</span> im Level-Ranking
            </div>
          )}

          {/* Link zum Ranking */}
          <Link
            href="/rankings"
            style={{
              color: "var(--color-primary)",
              fontFamily: "var(--font-display)",
              fontSize: "0.75rem",
              textDecoration: "none",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Alle Rankings →
          </Link>
        </div>

        {/* ── Rechte Spalte ── */}
        <div className="space-y-5">

          {/* Block 1: Charakter-Stats */}
          <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            overflow: "hidden",
          }}>
            <div className="section-header px-5 py-3 flex items-center" style={{
              background: "var(--color-surface-2)",
              paddingBottom: "0.75rem",
              borderBottom: "2px solid var(--color-primary)",
            }}>
              <span>Charakter-Stats</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5">
              <StatBlock label="Level" value={character.level} />
              <StatBlock label="Klasse" value={job.name} />
              <StatBlock label="Gilde" value={character.guild_name ?? "—"} />
              <StatBlock label="Imperium" value={empire.name} />
            </div>
          </div>

          {/* Block 2: Kampf-Stats */}
          <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            overflow: "hidden",
          }}>
            <div className="section-header px-5 py-3 flex items-center" style={{
              background: "var(--color-surface-2)",
              paddingBottom: "0.75rem",
              borderBottom: "2px solid var(--color-primary)",
            }}>
              <span>Kampf-Stats</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5">
              <StatBlock label="HP (max)" value={character.hp_max.toLocaleString()} />
              <StatBlock label="MP (max)" value={character.sp_max.toLocaleString()} />
              <StatBlock label="Spielzeit" value={`${playtimeHours} Std.`} />
              <StatBlock label="Erfahrung" value={character.exp.toLocaleString()} />
            </div>
          </div>

          {/* Block 3: Basis-Attribute */}
          <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            overflow: "hidden",
          }}>
            <div className="section-header px-5 py-3 flex items-center" style={{
              background: "var(--color-surface-2)",
              paddingBottom: "0.75rem",
              borderBottom: "2px solid var(--color-primary)",
            }}>
              <span>Basis-Attribute</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5">
              <StatBlock label="Stärke (STR)" value={character.str} />
              <StatBlock label="Vitalität (HT)" value={character.ht} />
              <StatBlock label="Intelligenz (IQ)" value={character.iq} />
              <StatBlock label="Geschicklichkeit (DX)" value={character.dx} />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
