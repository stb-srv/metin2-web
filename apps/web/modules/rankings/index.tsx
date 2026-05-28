"use client"

import React, { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { ModuleErrorBoundary } from "@/lib/module-loader"
import TopRankingPreview from "./components/TopRankingPreview"

type RankingPlayer = {
  rank: number
  id: number
  name: string
  level: number
  job: number
  playtime: number
  alignment?: number
  empire: number
  guild_name: string | null
  login: string
  status: "online" | "offline"
}

type RankingGuild = {
  rank: number
  id: number
  name: string
  level: number
  exp: number
  member_count: number
}

const EMPIRE_DOT_COLOR: Record<number, string> = {
  1: "#c0392b", // Shinsoo — Rot
  2: "#f1c40f", // Chunjo — Gelb
  3: "#3498db", // Jinno — Blau
}

const EMPIRE_NAME: Record<number, string> = {
  1: "Shinsoo",
  2: "Chunjo",
  3: "Jinno",
}

const JOB_ABBREV: Record<number, string> = {
  0: "KR",
  1: "KR(w)",
  2: "NJ",
  3: "NJ(w)",
  4: "SU",
  5: "SU(w)",
  6: "SM",
  7: "SM(w)",
}

function rankIcon(rank: number) {
  if (rank === 1) return "🥇"
  if (rank === 2) return "🥈"
  if (rank === 3) return "🥉"
  return rank
}

function RankingsContent() {
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"level" | "guild">("level")
  const [page, setPage] = useState(1)
  const limit = 50

  useEffect(() => {
    setLoading(true)
    fetch(`/api/modules/rankings?type=${activeTab}&page=${page}&limit=${limit}`)
      .then(res => res.json())
      .then(d => {
        setData(d.rankings || [])
        setTotal(d.total || 0)
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to load rankings:", err)
        setLoading(false)
      })
  }, [activeTab, page])

  const handleTabChange = (tab: "level" | "guild") => {
    setActiveTab(tab)
    setPage(1)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="w-full">
      {/* Tab-Leiste */}
      <div className="flex border-b border-[var(--color-border)] mb-0">
        {(["level", "guild"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            style={activeTab === tab ? {
              color: "var(--color-primary)",
              borderBottom: "2px solid var(--color-primary)",
              fontFamily: "var(--font-display)",
            } : {
              color: "var(--color-text-muted)",
              borderBottom: "2px solid transparent",
              fontFamily: "var(--font-display)",
            }}
            className="px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all hover:text-text"
          >
            {tab === "level" ? "Spieler-Ranking" : "Gilden-Ranking"}
          </button>
        ))}
      </div>

      {/* Tabelle */}
      <div
        className="rounded-b-md overflow-hidden"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderTop: "none" }}
      >
        {loading ? (
          <div className="py-16 text-center" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-display)" }}>
            <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
            Daten werden geladen…
          </div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-display)" }}>
            Keine Einträge gefunden.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-2)", borderBottom: "1px solid var(--color-border)" }}>
                  {activeTab === "level" ? (
                    <>
                      <th className="px-4 py-3 text-center w-14" style={thStyle}>#</th>
                      <th className="px-4 py-3" style={thStyle}>Spieler</th>
                      <th className="px-4 py-3 text-center" style={thStyle}>Level</th>
                      <th className="px-4 py-3 text-center" style={thStyle}>Gilde</th>
                      <th className="px-4 py-3 text-center" style={thStyle}>Reich</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 text-center w-14" style={thStyle}>#</th>
                      <th className="px-4 py-3" style={thStyle}>Gilde</th>
                      <th className="px-4 py-3 text-center" style={thStyle}>Mitglieder</th>
                      <th className="px-4 py-3 text-center" style={thStyle}>Level</th>
                      <th className="px-4 py-3 text-center" style={thStyle}>Punkte</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {activeTab === "level"
                  ? (data as RankingPlayer[]).map((player, idx) => (
                    <tr
                      key={player.id}
                      style={{
                        background: idx % 2 === 0 ? "#141418" : "#111318",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(192,57,43,0.08)")}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "#141418" : "#111318")}
                    >
                      <td className="px-4 py-3 text-center" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", minWidth: 48 }}>
                        {rankIcon(player.rank)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/character/${encodeURIComponent(player.name)}`}
                          style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--color-text)", textDecoration: "none", transition: "color 0.15s" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "var(--color-primary)")}
                          onMouseLeave={e => (e.currentTarget.style.color = "var(--color-text)")}
                        >
                          {player.name}
                        </Link>
                        <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", fontFamily: "var(--font-display)" }}>
                          {JOB_ABBREV[player.job] ?? "?"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center" style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-primary)" }}>
                        {player.level}
                      </td>
                      <td className="px-4 py-3 text-center" style={{ fontFamily: "var(--font-display)", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                        {player.guild_name ? `[${player.guild_name}]` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          title={EMPIRE_NAME[player.empire] ?? "Unbekannt"}
                          style={{
                            display: "inline-block",
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: EMPIRE_DOT_COLOR[player.empire] ?? "var(--color-text-muted)",
                            boxShadow: player.empire ? `0 0 5px ${EMPIRE_DOT_COLOR[player.empire]}` : "none",
                          }}
                        />
                      </td>
                    </tr>
                  ))
                  : (data as RankingGuild[]).map((guild, idx) => (
                    <tr
                      key={guild.id}
                      style={{
                        background: idx % 2 === 0 ? "#141418" : "#111318",
                        transition: "background 0.15s ease",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(192,57,43,0.08)")}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "#141418" : "#111318")}
                    >
                      <td className="px-4 py-3 text-center" style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem" }}>
                        {rankIcon(guild.rank)}
                      </td>
                      <td className="px-4 py-3" style={{ fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--color-text)" }}>
                        {guild.name}
                      </td>
                      <td className="px-4 py-3 text-center" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-display)" }}>
                        {guild.member_count}
                      </td>
                      <td className="px-4 py-3 text-center" style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-primary)" }}>
                        {guild.level}
                      </td>
                      <td className="px-4 py-3 text-center" style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-display)" }}>
                        {guild.exp.toLocaleString()}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: "var(--font-display)" }}>
              {(page - 1) * limit + 1}–{Math.min(page * limit, total)} von {total}
            </span>
            <div className="flex items-center gap-1">
              <PagBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Zurück</PagBtn>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                return (
                  <PagBtn key={p} onClick={() => setPage(p)} active={p === page}>
                    {p}
                  </PagBtn>
                )
              })}
              <PagBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Weiter →</PagBtn>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const thStyle: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontWeight: 700,
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "var(--color-text-muted)",
}

function PagBtn({ children, onClick, disabled, active }: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 32,
        height: 28,
        padding: "0 8px",
        borderRadius: 4,
        border: active ? "1px solid var(--color-primary)" : "1px solid var(--color-border)",
        background: active ? "var(--color-primary)" : "transparent",
        color: active ? "#fff" : "var(--color-text-muted)",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: "0.75rem",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  )
}

export default function RankingsModule({ preview = false }: { preview?: boolean }) {
  return (
    <ModuleErrorBoundary moduleId="rankings">
      <Suspense
        fallback={
          <div className="bg-surface border border-border rounded-lg p-6 animate-pulse space-y-3">
            <div className="h-4 bg-surface-2 rounded w-1/3" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 bg-surface-2 rounded" />
            ))}
          </div>
        }
      >
        {preview ? <TopRankingPreview /> : <RankingsContent />}
      </Suspense>
    </ModuleErrorBoundary>
  )
}
