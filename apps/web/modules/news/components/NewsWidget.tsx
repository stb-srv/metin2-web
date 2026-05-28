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

const categoryStyles: Record<NewsCategory, string> = {
  NEWS: 'bg-accent/10 text-accent',
  UPDATE: 'bg-success/10 text-success',
  EVENT: 'bg-warning/10 text-warning',
  MAINTENANCE: 'bg-danger/10 text-danger',
}

const categoryLabel: Record<NewsCategory, string> = {
  NEWS: 'News',
  UPDATE: 'Update',
  EVENT: 'Event',
  MAINTENANCE: 'Wartung',
}

export default function NewsWidget() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/modules/news?limit=3')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json() as Promise<NewsItem[]>
      })
      .then(setNews)
      .catch(() => setError('News konnten nicht geladen werden'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-lg p-6 shadow-[0_0_20px_var(--color-glow)] space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="h-3 bg-surface-2 rounded w-1/4" />
            <div className="h-4 bg-surface-2 rounded w-3/4" />
          </div>
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
        <h2 className="font-display text-primary tracking-widest uppercase text-sm">News</h2>
        <Link href="/news" className="text-accent text-xs hover:underline">
          Alle News →
        </Link>
      </div>

      <div className="space-y-4">
        {news.map((item) => (
          <div key={item.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs px-2 py-0.5 rounded uppercase tracking-wider font-display ${
                  categoryStyles[item.category]
                }`}
              >
                {categoryLabel[item.category]}
              </span>
              {item.pinned && (
                <span className="text-xs text-primary">📌</span>
              )}
              <span className="text-muted text-xs ml-auto">
                {new Date(item.createdAt).toLocaleDateString('de-DE')}
              </span>
            </div>
            <p className="text-text text-sm font-display">{item.title}</p>
            {item.excerpt && (
              <p className="text-muted text-xs mt-1 line-clamp-2">{item.excerpt}</p>
            )}
          </div>
        ))}

        {news.length === 0 && (
          <p className="text-muted text-sm">Noch keine News verfügbar.</p>
        )}
      </div>
    </div>
  )
}
