'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TopPlayer {
  name: string
  level: number
  job: number
  account_name: string
}

// job 0-7 → Klassenname
const JOB_NAMES: Record<number, string> = {
  0: 'Krieger',
  1: 'Kriegerin',
  2: 'Ninja',
  3: 'Ninjain',
  4: 'Sura',
  5: 'Surain',
  6: 'Schamane',
  7: 'Schamanin',
}

const PLACE_STYLES = [
  'text-yellow-400',   // Gold
  'text-gray-300',     // Silber
  'text-amber-600',    // Bronze
]

export default function TopRankingPreview() {
  const [players, setPlayers] = useState<TopPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/modules/rankings/top5')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<TopPlayer[]>
      })
      .then(setPlayers)
      .catch(() => setError('Ranking konnte nicht geladen werden'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6 shadow-[0_0_20px_var(--color-glow)] space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 bg-surface-2 rounded animate-pulse" />
        ))}
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-primary tracking-widest uppercase text-sm">
          Top Rankings
        </h2>
        <Link href="/rankings" className="text-accent text-xs hover:underline">
          Alle Rankings →
        </Link>
      </div>

      <div className="space-y-2">
        {players.map((player, idx) => (
          <div
            key={player.name}
            className="flex items-center gap-3 py-2 border-b border-border last:border-0"
          >
            {/* Platz */}
            <span
              className={`font-display text-sm w-5 text-center shrink-0 ${
                PLACE_STYLES[idx] ?? 'text-muted'
              }`}
            >
              {idx + 1}
            </span>

            {/* Klassen-Icon (hex) */}
            <div
              className="hex-icon w-7 h-7 flex items-center justify-center shrink-0"
              title={JOB_NAMES[player.job] ?? 'Unbekannt'}
            >
              <span className="text-xs text-muted">{player.job}</span>
            </div>

            {/* Name */}
            <Link
              href={`/character/${encodeURIComponent(player.name)}`}
              className="text-text text-sm hover:text-primary transition-colors flex-1 truncate"
            >
              {player.name}
            </Link>

            {/* Klasse */}
            <span className="text-muted text-xs shrink-0 hidden sm:block">
              {JOB_NAMES[player.job] ?? '—'}
            </span>

            {/* Level */}
            <span className="font-display text-primary text-sm shrink-0">Lv. {player.level}</span>
          </div>
        ))}

        {players.length === 0 && (
          <p className="text-muted text-sm">Keine Spieler gefunden.</p>
        )}
      </div>
    </div>
  )
}
