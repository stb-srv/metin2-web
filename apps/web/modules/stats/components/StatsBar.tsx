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
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return value
}

function StatCard({ label, value }: { label: string; value: number }) {
  const display = useCountUp(value)
  return (
    <div className="bg-surface border border-border rounded-lg p-5 flex flex-col items-center
                    shadow-[0_0_20px_var(--color-glow)] hover:shadow-[0_0_32px_var(--color-glow)]
                    hover:border-primary transition-all">
      <span className="font-display text-primary text-2xl tracking-wider">
        {display.toLocaleString('de-DE')}
      </span>
      <span className="text-muted text-xs mt-1 uppercase tracking-widest">{label}</span>
    </div>
  )
}

export default function StatsBar() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/modules/stats')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<Stats>
      })
      .then(setStats)
      .catch(() => setError('Stats konnten nicht geladen werden'))
  }, [])

  if (error) {
    return <p className="text-danger text-sm text-center">{error}</p>
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-5 animate-pulse">
            <div className="h-7 bg-surface-2 rounded mb-2" />
            <div className="h-3 bg-surface-2 rounded w-2/3 mx-auto" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Accounts" value={stats.totalAccounts} />
      <StatCard label="Online" value={stats.onlinePlayers} />
      <StatCard label="Gilden" value={stats.totalGuilds} />
      <StatCard label="Max Level" value={stats.maxLevel} />
    </div>
  )
}
