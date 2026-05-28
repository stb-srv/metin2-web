"use client"

import React, { useEffect, useState } from "react"

type NewsCategory = "NEWS" | "UPDATE" | "EVENT" | "MAINTENANCE" | "ALL"

interface NewsItem {
  id: string
  title: string
  excerpt: string | null
  content?: string
  category: "NEWS" | "UPDATE" | "EVENT" | "MAINTENANCE"
  pinned: boolean
  createdAt: string
}

const CATEGORY_LABEL: Record<string, string> = {
  ALL:         "Alle",
  NEWS:        "News",
  UPDATE:      "Update",
  EVENT:       "Event",
  MAINTENANCE: "Wartung",
}

const CATEGORY_COLOR: Record<string, { color: string; bg: string }> = {
  NEWS:        { color: "#3498db", bg: "rgba(52,152,219,0.15)" },
  UPDATE:      { color: "#2ecc71", bg: "rgba(46,204,113,0.15)" },
  EVENT:       { color: "#f1c40f", bg: "rgba(241,196,15,0.15)" },
  MAINTENANCE: { color: "#e74c3c", bg: "rgba(231,76,60,0.15)" },
}

const ALL_CATS: NewsCategory[] = ["ALL", "NEWS", "UPDATE", "EVENT", "MAINTENANCE"]

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<NewsCategory>("ALL")

  useEffect(() => {
    setLoading(true)
    const catParam = activeCategory !== "ALL" ? `&category=${activeCategory}` : ""
    fetch(`/api/modules/news?limit=20${catParam}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: NewsItem[]) => { setNews(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [activeCategory])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-header" style={{ fontSize: "1.8rem", display: "inline-block" }}>
          Neuigkeiten
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: 6, fontFamily: "var(--font-body)" }}>
          Aktuelle Nachrichten, Updates und Events aus dem Reich.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 items-start">
        {/* Kategorie-Sidebar */}
        <aside style={{
          background: "var(--color-surface)", border: "1px solid var(--color-border)",
          borderRadius: 6, overflow: "hidden",
          position: "sticky", top: 80,
        }}>
          <div className="section-header px-4 py-3" style={{
            background: "var(--color-surface-2)", borderBottom: "2px solid var(--color-primary)",
            fontSize: "0.7rem",
          }}>
            Kategorien
          </div>
          <div style={{ padding: "8px" }}>
            {ALL_CATS.map(cat => {
              const isActive = activeCategory === cat
              const colorInfo = cat !== "ALL" ? CATEGORY_COLOR[cat] : null
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    width: "100%", padding: "9px 12px",
                    border: "none",
                    borderLeft: isActive ? "3px solid var(--color-primary)" : "3px solid transparent",
                    color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                    fontFamily: "var(--font-display)", fontWeight: isActive ? 700 : 400,
                    fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em",
                    cursor: "pointer", borderRadius: "0 4px 4px 0",
                    background: isActive ? "rgba(192,57,43,0.06)" : "transparent",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = "var(--color-text)" }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = "var(--color-text-muted)" }}
                >
                  {cat !== "ALL" && colorInfo && (
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: colorInfo.color, flexShrink: 0,
                    }} />
                  )}
                  {CATEGORY_LABEL[cat]}
                </button>
              )
            })}
          </div>
        </aside>

        {/* News-Liste */}
        <main>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{
                  background: "var(--color-surface)", border: "1px solid var(--color-border)",
                  borderRadius: 6, height: 120, animation: "pulse 1.5s ease-in-out infinite",
                }} />
              ))}
            </div>
          ) : news.length === 0 ? (
            <div style={{
              background: "var(--color-surface)", border: "1px solid var(--color-border)",
              borderRadius: 6, padding: "48px 24px", textAlign: "center",
              color: "var(--color-text-muted)", fontFamily: "var(--font-display)",
            }}>
              Keine Neuigkeiten vorhanden.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {news.map(item => {
                const catColor = CATEGORY_COLOR[item.category]
                return (
                  <article
                    key={item.id}
                    style={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderLeft: item.pinned ? "3px solid var(--color-primary)" : "1px solid var(--color-border)",
                      borderRadius: item.pinned ? "0 6px 6px 0" : 6,
                      padding: "16px 20px",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(192,57,43,0.4)"}
                    onMouseLeave={e => {
                      if (item.pinned) e.currentTarget.style.borderColor = "var(--color-primary)"
                      else e.currentTarget.style.borderColor = "var(--color-border)"
                    }}
                  >
                    {/* Meta-Zeile */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {/* Kategorie-Badge */}
                        <span style={{
                          background: catColor.bg, color: catColor.color,
                          border: `1px solid ${catColor.color}40`,
                          borderRadius: 4, padding: "2px 8px",
                          fontFamily: "var(--font-display)", fontWeight: 700,
                          fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em",
                        }}>
                          {CATEGORY_LABEL[item.category]}
                        </span>
                        {item.pinned && (
                          <span style={{ fontSize: "0.85rem" }} title="Angeheftet">📌</span>
                        )}
                      </div>
                      <span style={{
                        fontFamily: "var(--font-display)", fontSize: "0.72rem",
                        color: "var(--color-text-muted)",
                      }}>
                        {new Date(item.createdAt).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>

                    {/* Titel */}
                    <h2 style={{
                      fontFamily: "var(--font-display)", fontWeight: 700,
                      fontSize: "1.1rem", color: "var(--color-text)",
                      margin: "0 0 6px",
                    }}>
                      {item.title}
                    </h2>

                    {/* Excerpt */}
                    {item.excerpt && (
                      <p style={{
                        fontFamily: "var(--font-body)", fontSize: "0.85rem",
                        color: "var(--color-text-muted)", lineHeight: 1.5,
                        display: "-webkit-box", WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical", overflow: "hidden",
                        margin: "0 0 10px",
                      }}>
                        {item.excerpt}
                      </p>
                    )}

                    {/* Weiterlesen */}
                    <a
                      href={`/news/${item.id}`}
                      style={{
                        fontFamily: "var(--font-display)", fontWeight: 700,
                        fontSize: "0.78rem", color: "var(--color-primary)",
                        textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.06em",
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                    >
                      Weiterlesen →
                    </a>
                  </article>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
