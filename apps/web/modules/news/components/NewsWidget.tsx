'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type NewsCategory = 'NEWS' | 'UPDATE' | 'EVENT' | 'MAINTENANCE'

interface NewsItem {
  id: string
  title: string
  excerpt: string | null
  category: NewsCategory
  pinned: boolean
  createdAt: string
}

const CATEGORY_COLOR: Record<NewsCategory, { color: string; bg: string }> = {
  NEWS:        { color: '#3498db', bg: 'rgba(52,152,219,0.12)' },
  UPDATE:      { color: '#2ecc71', bg: 'rgba(46,204,113,0.12)' },
  EVENT:       { color: '#f1c40f', bg: 'rgba(241,196,15,0.12)' },
  MAINTENANCE: { color: '#e74c3c', bg: 'rgba(231,76,60,0.12)' },
}

const CATEGORY_LABEL: Record<NewsCategory, string> = {
  NEWS: 'News', UPDATE: 'Update', EVENT: 'Event', MAINTENANCE: 'Wartung',
}

export default function NewsWidget() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/modules/news?limit=3')
      .then(r => { if (!r.ok) throw new Error(); return r.json() as Promise<NewsItem[]> })
      .then(setNews)
      .catch(() => setError('News konnten nicht geladen werden'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 6, padding: 20 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ marginBottom: 14 }} className="animate-pulse">
            <div style={{ height: 10, background: 'var(--color-surface-2)', borderRadius: 3, width: '30%', marginBottom: 6 }} />
            <div style={{ height: 14, background: 'var(--color-surface-2)', borderRadius: 3, width: '80%' }} />
          </div>
        ))}
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
          News
        </h2>
        <Link href='/news' style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--color-primary)', textDecoration: 'none' }}>
          Alle →
        </Link>
      </div>

      {/* Items */}
      <div style={{ padding: 16 }}>
        {news.map((item, idx) => {
          const cat = CATEGORY_COLOR[item.category]
          return (
            <div
              key={item.id}
              style={{
                borderLeft: item.pinned ? '3px solid var(--color-primary)' : '3px solid transparent',
                paddingLeft: 10,
                paddingBottom: idx < news.length - 1 ? 14 : 0,
                marginBottom: idx < news.length - 1 ? 14 : 0,
                borderBottom: idx < news.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{
                  background: cat.bg, color: cat.color,
                  border: `1px solid ${cat.color}40`,
                  borderRadius: 3, padding: '1px 6px',
                  fontFamily: 'var(--font-display)', fontWeight: 700,
                  fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {CATEGORY_LABEL[item.category]}
                </span>
                {item.pinned && <span title="Angeheftet" style={{ fontSize: '0.7rem' }}>📌</span>}
                <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>
                  {new Date(item.createdAt).toLocaleDateString('de-DE')}
                </span>
              </div>
              <p style={{
                fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.85rem',
                color: 'var(--color-text)', margin: '0 0 4px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {item.title}
              </p>
              {item.excerpt && (
                <p style={{
                  fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--color-text-muted)',
                  margin: 0, lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {item.excerpt}
                </p>
              )}
            </div>
          )
        })}

        {news.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-display)', fontSize: '0.8rem' }}>
            Noch keine News verfügbar.
          </p>
        )}
      </div>
    </div>
  )
}
