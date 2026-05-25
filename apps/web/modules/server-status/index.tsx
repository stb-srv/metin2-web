"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { StatusDot } from "@/components/ui/status-dot"
import { ModuleErrorBoundary } from "@/lib/module-loader"
import { Users, Server } from "lucide-react"

type ServerStatusData = {
  id: string
  channel: string
  online: boolean
  players: number
  maxPlayers: number
  load: "LOW" | "MEDIUM" | "HIGH"
}

function ServerStatusContent() {
  const [data, setData] = useState<ServerStatusData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/modules/server-status")
      .then(res => res.json())
      .then(d => {
        setData(d.status || [])
        setLoading(false)
      })
      .catch(err => {
        console.error("Failed to load server status:", err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="text-text-muted text-sm text-center py-4">Lade Server-Status...</div>
  }

  const getLoadColor = (load: string) => {
    switch (load) {
      case "LOW": return "text-success"
      case "MEDIUM": return "text-warning"
      case "HIGH": return "text-danger"
      default: return "text-text"
    }
  }

  const getStatusType = (online: boolean, load: string) => {
    if (!online) return "offline"
    if (load === "HIGH") return "warning"
    return "online"
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.length > 0 ? data.map(ch => (
          <Card key={ch.id} className="transition-all hover:shadow-[0_0_25px_var(--color-glow)]">
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-primary tracking-widest">{ch.channel}</span>
                <StatusDot status={getStatusType(ch.online, ch.load)} />
              </div>
              
              <div className="flex items-center gap-2 text-sm text-text-muted">
                <Server className="w-4 h-4" />
                <span>{ch.online ? "Online" : "Offline"}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm mt-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-text-muted" />
                  <span className="text-text">{ch.players} / {ch.maxPlayers}</span>
                </div>
                <span className={`font-bold ${getLoadColor(ch.load)}`}>
                  {ch.load}
                </span>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="text-text-muted text-sm col-span-full border border-dashed border-border/50 rounded-lg p-8 text-center bg-surface-2/50">
            Keine Channel-Daten verfügbar.
          </div>
        )}
      </div>
      
      <div className="text-right text-xs text-text-muted font-mono tracking-widest opacity-60">
        UPTIME: 99.9%
      </div>
    </div>
  )
}

export default function ServerStatusModule() {
  return (
    <ModuleErrorBoundary moduleId="server-status">
      <ServerStatusContent />
    </ModuleErrorBoundary>
  )
}
