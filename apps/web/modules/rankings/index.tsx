"use client"

import React, { useEffect, useState, Suspense } from "react"
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
  alignment: number
  empire: number
  status: "online" | "offline"
}

function RankingsContent() {
  const [data, setData] = useState<RankingPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"level" | "pvp" | "playtime">("level")

  useEffect(() => {
    setLoading(true)
    fetch(`/api/modules/rankings?type=${activeTab}`)
      .then(res => res.json())
      .then(d => {
        setData(d.rankings || [])
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to load rankings:", err)
        setLoading(false)
      })
  }, [activeTab])

  const getJobName = (job: number) => {
    const jobs = ["Krieger", "Ninja", "Sura", "Schamane", "Lykaner"]
    return jobs[job] || "Unbekannt"
  }

  const getEmpireColor = (empire: number) => {
    switch (empire) {
      case 1: return "text-danger" // Shinsoo
      case 2: return "text-warning" // Chunjo
      case 3: return "text-accent" // Jinno
      default: return "text-text"
    }
  }

  const getRankHighlight = (rank: number) => {
    if (rank === 1) return "bg-primary/10 border-primary shadow-[inset_0_0_20px_var(--color-glow)]"
    if (rank === 2) return "bg-slate-300/10 border-slate-300 shadow-[inset_0_0_15px_rgba(203,213,225,0.1)]"
    if (rank === 3) return "bg-amber-700/10 border-amber-700 shadow-[inset_0_0_15px_rgba(180,83,9,0.1)]"
    return "border-border/30 hover:bg-surface-2"
  }

  const getRankIconHighlight = (rank: number) => {
    if (rank === 1) return "text-bg bg-primary border-primary"
    if (rank === 2) return "text-bg bg-slate-300 border-slate-300"
    if (rank === 3) return "text-bg bg-amber-700 border-amber-700"
    return "text-text-muted border-border bg-surface-2"
  }

  return (
    <Card className="w-full">
      <CardHeader className="border-b border-border/50 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle>Rangliste</CardTitle>
          <div className="flex gap-2 bg-surface-2 p-1 rounded-md border border-border">
            <Button
              variant={activeTab === "level" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("level")}
              className={activeTab === "level" ? "shadow-none" : ""}
            >
              Level
            </Button>
            <Button
              variant={activeTab === "pvp" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("pvp")}
              className={activeTab === "pvp" ? "shadow-none" : ""}
            >
              PvP
            </Button>
            <Button
              variant={activeTab === "playtime" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("playtime")}
              className={activeTab === "playtime" ? "shadow-none" : ""}
            >
              Spielzeit
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12 text-text-muted animate-pulse">Ranglisten werden aktualisiert...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-sm text-text-muted uppercase font-display tracking-wider">
                  <th className="p-4 w-16 text-center">#</th>
                  <th className="p-4 w-20 text-center">Klasse</th>
                  <th className="p-4">Spielername</th>
                  <th className="p-4 text-center">Level</th>
                  <th className="p-4 text-center">Reich</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {data.map((player) => (
                  <tr
                    key={player.id}
                    className={`transition-colors border border-transparent rounded-lg ${getRankHighlight(player.rank)}`}
                  >
                    <td className="p-4 text-center font-display font-bold text-lg">
                      {player.rank}
                    </td>
                    <td className="p-4 flex justify-center">
                      <div className={`hex-icon w-10 h-10 flex items-center justify-center font-display font-bold text-sm ${getRankIconHighlight(player.rank)}`}>
                        {player.job.toString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-text">{player.name}</div>
                      <div className="text-xs text-text-muted">{getJobName(player.job)}</div>
                    </td>
                    <td className="p-4 text-center font-display text-primary font-bold text-lg">
                      {player.level}
                    </td>
                    <td className={`p-4 text-center font-bold font-display tracking-wide ${getEmpireColor(player.empire)}`}>
                      {player.empire === 1 ? "Shinsoo" : player.empire === 2 ? "Chunjo" : "Jinno"}
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function RankingsModule() {
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
        <TopRankingPreview />
      </Suspense>
    </ModuleErrorBoundary>
  )
}
