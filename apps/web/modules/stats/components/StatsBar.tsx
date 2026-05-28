'use client'

import { useEffect, useState, useRef } from 'react'

interface Stats {
  totalAccounts: number
  onlinePlayers: number
  totalGuilds: number
  maxLevel: number
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (target === 0) return
    const start = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      setValue(Math.floor(progress * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return value
}

function StatCard({
  label, value, isOnline = false,
}: { label: string; value: number; isOnline?: boolean }) {
  const display = useCountUp(value)

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderLeft: '3px solid var(--color-primary)',
      borderRadius: '0 6px 6px 0',
      padding: '18px 20px',
      display: 'flex', flexDirection: 'column',
      transition: 'border-color 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
    onMouseLeave={e => {
      e.currentTarget.style.borderTopColor = 'var(--color-border)'
      e.currentTarget.style.borderRightColor = 'var(--color-border)'
      e.currentTarget.style.borderBottomColor = 'var(--color-border)'
    }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2.2rem',
          color: isOnline ? 'var(--color-success)' : 'var(--color-text)',
          lineHeight: 1,
        }}>
          {display.toLocaleString('de-DE')}
        </span>
        {isOnline && (
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--color-success)',
            boxShadow: '0 0 6px var(--color-success)',
            display: 'inline-block', flexShrink: 0,
          }} className="animate-pulse" />
        )}
      </div>
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: '0.65rem', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-muted)',
      }}>
        {label}
      </span>
    </div>
  )
}

export default function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/modules/stats')
      .then(r => { if (!r.ok) throw new Error(); return r.json() as Promise<Stats> })
      .then(setStats)
      .catch(() => setError('Stats konnten nicht geladen werden'))
  }, [])

  if (error) return <p style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-display)', fontSize: '0.8rem' }}>{error}</p>

  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderLeft: '3px solid var(--color-primary)', borderRadius: '0 6px 6px 0',
            padding: 20, height: 80,
          }} className="animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Accounts gesamt"  value={stats.totalAccounts} />
      <StatCard label="Spieler online"   value={stats.onlinePlayers} isOnline />
      <StatCard label="Gilden"           value={stats.totalGuilds} />
      <StatCard label="Max. Level"       value={stats.maxLevel} />
    </div>
  )
}
