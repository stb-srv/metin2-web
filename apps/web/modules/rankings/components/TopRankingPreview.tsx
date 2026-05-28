'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TopPlayer {
  name: string
  level: number
  job: number
  empire: number
  account_name: string
}

// job 0-7 → Klassenname
const JOB_NAMES: Record<number, string> = {
  0: 'Krieger',
  1: 'Krieger(w)',
  2: 'Ninja',
  3: 'Ninja(w)',
  4: 'Sura',
  5: 'Sura(w)',
  6: 'Schamane',
  7: 'Schamane(w)',
}

const JOB_ABBREV: Record<number, string> = {
  0: 'KR',
  1: 'KR(w)',
  2: 'NJ',
  3: 'NJ(w)',
  4: 'SU',
  5: 'SU(w)',
  6: 'SM',
  7: 'SM(w)',
}

const EMPIRE_COLORS: Record<number, string> = {
  1: '#e74c3c', // Rot
  2: '#f1c40f', // Gelb
  3: '#3498db', // Blau
}

const EMPIRE_NAMES: Record<number, string> = {
  1: 'Shinsoo',
  2: 'Chunjo',
  3: 'Jinno',
}

const PLACE_STYLES = [
  'text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.4)]', // Gold
  'text-slate-300 drop-shadow-[0_0_6px_rgba(203,213,225,0.4)]',  // Silber
  'text-amber-600 drop-shadow-[0_0_6px_rgba(180,83,9,0.4)]',   // Bronze
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
        <div className="h-4 bg-surface-2 rounded w-1/3 mb-4 animate-pulse" />
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
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/30">
        <h2 className="font-display text-primary tracking-widest uppercase text-sm font-semibold">
          Top Rankings
        </h2>
        <Link href="/rankings" className="text-accent text-xs hover:text-primary transition-colors hover:underline">
          Alle Rankings →
        </Link>
      </div>

      <div className="space-y-3">
        {players.map((player, idx) => (
          <div
            key={player.name}
            className="flex items-center gap-3 py-1.5 border-b border-border/10 last:border-0"
          >
            {/* Platz */}
            <span
              className={`font-display font-bold text-sm w-5 text-center shrink-0 ${
                PLACE_STYLES[idx] ?? 'text-muted'
              }`}
            >
              {idx === 0 && '🥇'}
              {idx === 1 && '🥈'}
              {idx === 2 && '🥉'}
              {idx > 2 && `${idx + 1}`}
            </span>

            {/* Klassen-Icon (hex) */}
            <div
              className="hex-icon w-8 h-8 flex items-center justify-center shrink-0 border border-primary/20 bg-surface-2"
              title={JOB_NAMES[player.job] ?? 'Unbekannt'}
            >
              <span className="text-[10px] font-bold text-primary">{JOB_ABBREV[player.job] ?? '??'}</span>
            </div>

            {/* Name & Empire */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Empire Color Indicator Dot */}
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: EMPIRE_COLORS[player.empire] ?? 'var(--color-text-muted)',
                  boxShadow: `0 0 6px ${EMPIRE_COLORS[player.empire] ?? 'transparent'}`
                }}
                title={EMPIRE_NAMES[player.empire] ?? 'Unbekannt'}
              />
              
              <Link
                href={`/character/${encodeURIComponent(player.name)}`}
                className="text-text text-sm hover:text-primary transition-colors truncate font-medium hover:underline"
              >
                {player.name}
              </Link>
            </div>

            {/* Klasse */}
            <span className="text-muted text-xs shrink-0 hidden sm:block">
              {JOB_NAMES[player.job] ?? '—'}
            </span>

            {/* Level */}
            <span className="font-display text-primary text-sm font-semibold shrink-0">Lv. {player.level}</span>
          </div>
        ))}

        {players.length === 0 && (
          <p className="text-muted text-sm">Keine Spieler gefunden.</p>
        )}
      </div>
    </div>
  )
}
