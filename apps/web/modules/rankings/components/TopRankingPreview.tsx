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

const JOB_ABBREV: Record<number, string> = {
  0: 'KR', 1: 'KR(w)', 2: 'NJ', 3: 'NJ(w)',
  4: 'SU', 5: 'SU(w)', 6: 'SM', 7: 'SM(w)',
}

const EMPIRE_DOT: Record<number, string> = {
  1: '#c0392b', // Shinsoo
  2: '#f1c40f', // Chunjo
  3: '#3498db', // Jinno
}

export default function TopRankingPreview() {
  const [players, setPlayers] = useState<TopPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/modules/rankings/top5')
      .then(r => { if (!r.ok) throw new Error(); return r.json() as Promise<TopPlayer[]> })
      .then(setPlayers)
      .catch(() => setError('Ranking konnte nicht geladen werden'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6, padding: 20 }}>
        <div className="animate-pulse space-y-3">
          <div style={{ height: 10, background: 'var(--color-surface-2)', borderRadius: 3, width: '40%', marginBottom: 12 }} />
          {Array.from({ length: 5 }).map((_, i) => (
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
          Top Rankings
        </h2>
        <Link href='/rankings' style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
          Alle Rankings →
        </Link>
      </div>

      {/* Tabelle */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['#', 'Name', 'Klasse', 'Lv.', 'Reich'].map(h => (
              <th key={h} style={{
                padding: '8px 12px', textAlign: 'left',
                fontFamily: 'var(--font-display)', fontWeight: 700,
                fontSize: '0.6rem', textTransform: 'uppercase',
                letterSpacing: '0.08em', color: 'var(--color-text-muted)',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((player, idx) => (
            <tr
              key={player.name}
              style={{ background: idx % 2 === 0 ? '#141418' : '#111318' }}
            >
              <td style={{ padding: '8px 12px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem' }}>
                {idx === 0 && '🥇'}
                {idx === 1 && '🥈'}
                {idx === 2 && '🥉'}
                {idx > 2 && `${idx + 1}`}
              </td>
              <td style={{ padding: '8px 12px' }}>
                <Link
                  href={`/character/${encodeURIComponent(player.name)}`}
                  style={{
                    fontFamily: 'var(--font-display)', fontWeight: 600,
                    fontSize: '0.82rem', color: 'var(--color-text)', textDecoration: 'none',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--color-primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text)'}
                >
                  {player.name}
                </Link>
              </td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                {JOB_ABBREV[player.job] ?? '—'}
              </td>
              <td style={{ padding: '8px 12px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--color-primary)' }}>
                {player.level}
              </td>
              <td style={{ padding: '8px 12px' }}>
                <span
                  title={String(player.empire)}
                  style={{
                    width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
                    background: EMPIRE_DOT[player.empire] ?? 'var(--color-text-muted)',
                    boxShadow: `0 0 4px ${EMPIRE_DOT[player.empire] ?? 'transparent'}`,
                  }}
                />
              </td>
            </tr>
          ))}
          {players.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '16px 12px', textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                Keine Spieler gefunden.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
