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
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6, padding: 20 }}>
        <div className="animate-pulse space-y-3">
          <div style={{ height: 10, background: 'var(--color-surface-2)', borderRadius: 3, width: '40%', marginBottom: 12 }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ height: 28, background: 'var(--color-surface-2)', borderRadius: 3 }} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-danger)', borderRadius: 6, padding: 20 }}>
        <p style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-display)', fontSize: '0.8rem' }}>{error}</p>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'var(--color-surface-2)',
        borderBottom: '2px solid var(--color-primary)',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem',
          color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0,
        }}>
          Server Status
        </h2>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
          Auto-Refresh 60s
        </span>
      </div>

      {/* Channel-Tabelle */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['Channel', 'Status', 'Spieler'].map(h => (
              <th key={h} style={{
                padding: '8px 14px', textAlign: 'left',
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: '0.6rem', textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'var(--color-text-muted)',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {channels.map((ch, idx) => (
            <tr
              key={ch.channelId}
              style={{ background: idx % 2 === 0 ? '#141418' : '#111318' }}
            >
              <td style={{ padding: '9px 14px', fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--color-text)' }}>
                {ch.name}
              </td>
              <td style={{ padding: '9px 14px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: ch.online ? 'var(--color-success)' : 'var(--color-danger)',
                    boxShadow: ch.online ? '0 0 5px var(--color-success)' : 'none',
                    display: 'inline-block',
                  }} />
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: '0.72rem',
                    color: ch.online ? 'var(--color-success)' : 'var(--color-text-muted)',
                    fontWeight: 600,
                  }}>
                    {ch.online ? 'Online' : 'Offline'}
                  </span>
                </span>
              </td>
              <td style={{
                padding: '9px 14px',
                fontFamily: 'var(--font-display)', fontSize: '0.8rem',
                color: ch.online ? 'var(--color-text)' : 'var(--color-text-muted)',
              }}>
                {ch.online ? `${ch.playerCount} / ${ch.maxPlayers}` : '—'}
              </td>
            </tr>
          ))}
          {channels.length === 0 && (
            <tr>
              <td colSpan={3} style={{ padding: '16px 14px', fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                Keine Channel-Daten verfügbar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
