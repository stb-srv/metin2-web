'use client'

import { useEffect, useState, useCallback } from 'react'

interface Channel {
  channelId: string
  name: string
  online: boolean
  playerCount: number
  maxPlayers: number
}

export default function ServerStatusWidget() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/modules/server-status')
      if (!res.ok) throw new Error('Fehler beim Laden')
      const data: Channel[] = await res.json()
      setChannels(data)
      setError(null)
    } catch {
      setError('Server-Status konnte nicht geladen werden')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 60_000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6 shadow-[0_0_20px_var(--color-glow)]">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-surface-2 rounded w-1/3" />
          <div className="h-8 bg-surface-2 rounded" />
          <div className="h-8 bg-surface-2 rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-surface border border-danger rounded-lg p-6">
        <p className="text-danger text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-lg shadow-[0_0_20px_var(--color-glow)] p-6">
      <h2 className="font-display text-primary tracking-widest uppercase text-sm mb-4">
        Server Status
      </h2>
      <div className="space-y-3">
        {channels.map((ch) => {
          const loadPercent = Math.min(100, (ch.playerCount / ch.maxPlayers) * 100)
          const loadColorClass = loadPercent >= 70 ? 'bg-danger' : loadPercent >= 30 ? 'bg-warning' : 'bg-success'
          
          return (
            <div key={ch.channelId} className="flex items-center gap-3">
              {/* Online-Indikator */}
              <span
                className={`shrink-0 w-2 h-2 rounded-full ${
                  ch.online
                    ? 'bg-success shadow-[0_0_6px_var(--color-success)] animate-pulse'
                    : 'bg-muted'
                }`}
              />

              {/* Channel-Name */}
              <span className="text-text text-sm w-28 shrink-0">{ch.name}</span>

              {/* Badge */}
              <span
                className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                  ch.online ? 'bg-success/10 text-success' : 'bg-muted/10 text-muted'
                }`}
              >
                {ch.online ? 'Online' : 'Offline'}
              </span>

              {/* Spieleranzahl */}
              <span className="text-muted text-xs shrink-0">
                {ch.playerCount}/{ch.maxPlayers}
              </span>

              {/* Load-Bar */}
              {ch.online && (
                <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${loadColorClass}`}
                    style={{ width: `${loadPercent}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}

        {channels.length === 0 && (
          <p className="text-muted text-sm">Keine Channel-Daten verfügbar.</p>
        )}
      </div>
    </div>
  )
}
