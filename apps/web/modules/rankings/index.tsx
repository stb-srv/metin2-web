"use client"

import React, { useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusDot } from "@/components/ui/status-dot"
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

function RankingsContent() {
  const [data, setData] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"level" | "pvp" | "guild">("level")
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

  const handleTabChange = (tab: "level" | "pvp" | "guild") => {
    setActiveTab(tab)
    setPage(1)
  }

  const getJobName = (job: number) => {
    if (job === 0 || job === 4) return "Krieger"
    if (job === 1 || job === 5) return "Assassine"
    if (job === 2 || job === 6) return "Sura"
    if (job === 3 || job === 7) return "Schamane"
    return "Lykaner"
  }

  const getJobAbbreviation = (job: number) => {
    if (job === 0 || job === 4) return "KR"
    if (job === 1 || job === 5) return "AS"
    if (job === 2 || job === 6) return "SU"
    if (job === 3 || job === 7) return "SH"
    return "LY"
  }

  const getEmpireColor = (empire: number) => {
    switch (empire) {
      case 1: return "text-danger" // Shinsoo (Rot)
      case 2: return "text-warning" // Chunjo (Gelb)
      case 3: return "text-accent" // Jinno (Blau)
      default: return "text-text"
    }
  }

  const getEmpireName = (empire: number) => {
    switch (empire) {
      case 1: return "Shinsoo"
      case 2: return "Chunjo"
      case 3: return "Jinno"
      default: return "Unbekannt"
    }
  }

  const getRankHighlight = (rank: number) => {
    if (rank === 1) return "bg-primary/10 border-primary/50 shadow-[inset_0_0_20px_var(--color-glow)]"
    if (rank === 2) return "bg-slate-300/10 border-slate-300/40 shadow-[inset_0_0_15px_rgba(203,213,225,0.08)]"
    if (rank === 3) return "bg-amber-700/10 border-amber-700/40 shadow-[inset_0_0_15px_rgba(180,83,9,0.08)]"
    return "border-border/10 hover:bg-surface-2/40"
  }

  const getRankIconHighlight = (rank: number) => {
    if (rank === 1) return "text-bg bg-primary border-primary shadow-[0_0_8px_var(--color-primary)]"
    if (rank === 2) return "text-bg bg-slate-300 border-slate-300 shadow-[0_0_8px_rgba(203,213,225,0.5)]"
    if (rank === 3) return "text-bg bg-amber-700 border-amber-700 shadow-[0_0_8px_rgba(180,83,9,0.5)]"
    return "text-text-muted border-border/30 bg-surface-2"
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <Card className="w-full bg-surface border-border/30 shadow-[0_0_20px_var(--color-glow)]">
      <CardHeader className="border-b border-border/20 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="font-display text-2xl text-primary tracking-wider uppercase font-bold">Rangliste</CardTitle>
          <div className="flex gap-2 bg-surface-2/80 p-1 rounded-md border border-border/30">
            <Button 
              variant={activeTab === "level" ? "default" : "ghost"} 
              size="sm"
              onClick={() => handleTabChange("level")}
              className={`font-display uppercase tracking-wider text-xs px-4 ${activeTab === "level" ? "bg-primary text-bg hover:bg-primary/90 font-bold shadow-none" : "text-text-muted hover:text-text"}`}
            >
              Level
            </Button>
            <Button 
              variant={activeTab === "pvp" ? "default" : "ghost"} 
              size="sm"
              onClick={() => handleTabChange("pvp")}
              className={`font-display uppercase tracking-wider text-xs px-4 ${activeTab === "pvp" ? "bg-primary text-bg hover:bg-primary/90 font-bold shadow-none" : "text-text-muted hover:text-text"}`}
            >
              PvP (Rang)
            </Button>
            <Button 
              variant={activeTab === "guild" ? "default" : "ghost"} 
              size="sm"
              onClick={() => handleTabChange("guild")}
              className={`font-display uppercase tracking-wider text-xs px-4 ${activeTab === "guild" ? "bg-primary text-bg hover:bg-primary/90 font-bold shadow-none" : "text-text-muted hover:text-text"}`}
            >
              Gilden
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="text-center py-20 text-text-muted font-display tracking-widest animate-pulse">
            Daten werden abgerufen...
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-text-muted font-display">
            Keine Einträge gefunden.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-text-muted uppercase font-display tracking-widest border-b border-border/20">
                  <th className="p-4 w-16 text-center">#</th>
                  {activeTab !== "guild" ? (
                    <>
                      <th className="p-4 w-20 text-center">Klasse</th>
                      <th className="p-4">Name</th>
                      <th className="p-4 text-center">Level</th>
                      {activeTab === "pvp" && <th className="p-4 text-center">Rang-Punkte</th>}
                      <th className="p-4 text-center">Reich</th>
                      <th className="p-4 text-center">Status</th>
                    </>
                  ) : (
                    <>
                      <th className="p-4">Gilde</th>
                      <th className="p-4 text-center">Level</th>
                      <th className="p-4 text-center">Mitglieder</th>
                      <th className="p-4 text-center">Punkte / EXP</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/5">
                {activeTab !== "guild" ? (
                  (data as RankingPlayer[]).map((player) => (
                    <tr 
                      key={player.id} 
                      className={`transition-colors border border-transparent ${getRankHighlight(player.rank)}`}
                    >
                      <td className="p-4 text-center font-display font-bold text-lg">
                        {player.rank}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <div className={`hex-icon w-10 h-10 flex items-center justify-center font-display font-bold text-xs ${getRankIconHighlight(player.rank)}`}>
                            {getJobAbbreviation(player.job)}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Link 
                          href={`/character/${encodeURIComponent(player.name)}`}
                          className="font-medium text-text hover:text-primary transition-colors cursor-pointer font-display tracking-wide hover:underline decoration-primary/40 decoration-dotted"
                        >
                          {player.name}
                        </Link>
                        {player.guild_name && (
                          <div className="text-xs text-text-muted mt-0.5">
                            Gilde:{" "}
                            <Link 
                              href={`/guild/${encodeURIComponent(player.guild_name)}`}
                              className="text-primary/80 hover:text-primary transition-colors font-semibold"
                            >
                              [{player.guild_name}]
                            </Link>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center font-display text-primary font-bold text-lg">
                        {player.level}
                      </td>
                      {activeTab === "pvp" && (
                        <td className="p-4 text-center font-display text-warning/90 font-semibold">
                          {player.alignment?.toLocaleString() || "0"}
                        </td>
                      )}
                      <td className={`p-4 text-center font-bold font-display text-sm tracking-wide ${getEmpireColor(player.empire)}`}>
                        {getEmpireName(player.empire)}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center">
                          <Badge variant={player.status === "online" ? "success" : "default"} className="gap-2 px-3 py-1">
                            <StatusDot status={player.status} />
                            {player.status === "online" ? "Online" : "Offline"}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  (data as RankingGuild[]).map((guild) => (
                    <tr 
                      key={guild.id} 
                      className={`transition-colors border border-transparent ${getRankHighlight(guild.rank)}`}
                    >
                      <td className="p-4 text-center font-display font-bold text-lg">
                        {guild.rank}
                      </td>
                      <td className="p-4">
                        <Link 
                          href={`/guild/${encodeURIComponent(guild.name)}`}
                          className="font-medium text-text hover:text-primary transition-colors cursor-pointer font-display tracking-wide hover:underline decoration-primary/40 decoration-dotted text-lg"
                        >
                          {guild.name}
                        </Link>
                      </td>
                      <td className="p-4 text-center font-display text-primary font-bold text-lg">
                        {guild.level}
                      </td>
                      <td className="p-4 text-center font-display text-text font-medium">
                        {guild.member_count}
                      </td>
                      <td className="p-4 text-center font-display text-warning font-semibold">
                        {guild.exp.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/20">
            <span className="text-xs text-text-muted">
              Einträge {(page - 1) * limit + 1} - {Math.min(page * limit, total)} von {total}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="text-text-muted hover:text-text border border-border/10 hover:bg-surface-2 px-3 text-xs uppercase font-display"
              >
                Zurück
              </Button>
              <span className="text-xs font-display font-semibold px-2 text-primary">
                {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                className="text-text-muted hover:text-text border border-border/10 hover:bg-surface-2 px-3 text-xs uppercase font-display"
              >
                Weiter
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
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
