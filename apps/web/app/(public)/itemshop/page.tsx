"use client"

import React, { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

type Category = {
  id: string
  name: string
  icon: string | null
}

type ShopItem = {
  id: string
  name: string
  description: string | null
  price: number
  currency: string
  itemVnum: number | null
  count: number
  itemTemplate?: {
    id: string
    vnum: number
    name: string
    grade: "NORMAL" | "RARE" | "EPIC" | "LEGENDARY"
  } | null
}

type Character = {
  id: number
  name: string
  level: number
  job: number
}

const GRADE_COLOR: Record<string, string> = {
  NORMAL: "var(--color-text)",
  RARE: "#2980b9",
  EPIC: "#8e44ad",
  LEGENDARY: "#e67e22",
}

const GRADE_BORDER: Record<string, string> = {
  NORMAL: "var(--color-border)",
  RARE: "rgba(41,128,185,0.5)",
  EPIC: "rgba(142,68,173,0.5)",
  LEGENDARY: "rgba(230,126,34,0.6)",
}

export default function ItemShopPage() {
  const { data: session } = useSession()

  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategoryId, setActiveCategoryId] = useState<string>("")
  const [items, setItems] = useState<ShopItem[]>([])

  const [loadingCats, setLoadingCats] = useState(true)
  const [loadingItems, setLoadingItems] = useState(true)
  const [cashbackPercent, setCashbackPercent] = useState<number>(0)

  const [coins, setCoins] = useState<{ dr: number; dm: number } | null>(null)

  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharName, setSelectedCharName] = useState<string>("")
  const [loadingChars, setLoadingChars] = useState(false)
  const [buying, setBuying] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/modules/itemshop/categories")
      .then(res => res.json())
      .then((data: Category[]) => {
        setCategories(data)
        if (data.length > 0) setActiveCategoryId(data[0].id)
        setLoadingCats(false)
      })
      .catch(() => setLoadingCats(false))

    fetch("/api/coins/balance")
      .then(res => res.json())
      .then(setCoins)
      .catch(() => {})

    fetch("/api/admin/settings")
      .then(res => res.ok ? res.json() : [])
      .then((settings: any[]) => {
        const cashback = settings.find((s: any) => s.key === "dm_cashback_percent")
        if (cashback) setCashbackPercent(parseInt(cashback.value, 10))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!activeCategoryId) return
    setLoadingItems(true)
    fetch(`/api/modules/itemshop/items?categoryId=${activeCategoryId}&limit=24`)
      .then(res => res.json())
      .then((data: { items: ShopItem[]; total: number }) => {
        setItems(data.items || [])
        setLoadingItems(false)
      })
      .catch(() => setLoadingItems(false))
  }, [activeCategoryId])

  const handleOpenBuyModal = (item: ShopItem) => {
    if (!session) {
      setErrorMsg("Du musst angemeldet sein, um Käufe zu tätigen.")
      return
    }
    setSelectedItem(item)
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoadingChars(true)
    setSelectedCharName("")

    fetch("/api/modules/character/my-characters")
      .then(res => res.json())
      .then((data: Character[]) => {
        setCharacters(data)
        if (data.length > 0) setSelectedCharName(data[0].name)
        setLoadingChars(false)
      })
      .catch(() => setLoadingChars(false))
  }

  const handleConfirmPurchase = async () => {
    if (!selectedItem || !selectedCharName) return
    setBuying(true)
    setErrorMsg(null)

    try {
      const res = await fetch("/api/modules/itemshop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopItemId: selectedItem.id, characterName: selectedCharName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Kauf fehlgeschlagen.")

      setSuccessMsg(`Erfolgreich gekauft! Das Item wurde an das Ingame-Depot von ${selectedCharName} gesendet.`)
      if (data.newBalance) setCoins(data.newBalance)
      window.dispatchEvent(new Event("coin-balance-update"))
      setTimeout(() => { setSelectedItem(null); setSuccessMsg(null) }, 3000)
    } catch (err: any) {
      setErrorMsg(err.message || "Ein unbekannter Fehler ist aufgetreten.")
    } finally {
      setBuying(false)
    }
  }

  const getJobName = (job: number) => {
    const jobs: Record<number, string> = {
      0: "Krieger", 1: "Krieger(w)", 2: "Ninja", 3: "Ninja(w)",
      4: "Sura", 5: "Sura(w)", 6: "Schamane", 7: "Schamane(w)"
    }
    return jobs[job] || "Klasse"
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="section-header" style={{ fontSize: "1.8rem", display: "inline-block" }}>
            Item Shop
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: 6, fontFamily: "var(--font-body)" }}>
            Rüste deinen Charakter mit den mächtigsten Gegenständen aus.
          </p>
        </div>

        {/* Balance Widget */}
        {coins && (
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            background: "var(--color-surface-2)",
            borderLeft: "3px solid var(--color-primary)",
            borderRadius: "0 4px 4px 0",
            padding: "10px 16px",
            fontFamily: "var(--font-display)",
          }}>
            <div>
              <div style={{ fontSize: "0.6rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Dragon Coins</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text)" }}>
                💰 <span style={{ color: "var(--color-primary)" }}>{coins.dr.toLocaleString()}</span> DR
              </div>
            </div>
            <div style={{ borderLeft: "1px solid var(--color-border)", paddingLeft: 16 }}>
              <div style={{ fontSize: "0.6rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Dark Matter</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text)" }}>
                💎 <span style={{ color: "var(--color-success)" }}>{coins.dm.toLocaleString()}</span> DM
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
        {/* Kategorie-Sidebar */}
        <aside style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: 6,
          overflow: "hidden",
        }}>
          <div className="section-header px-4 py-3" style={{
            borderBottom: "2px solid var(--color-primary)",
            background: "var(--color-surface-2)",
            fontSize: "0.7rem",
          }}>
            Kategorien
          </div>
          <div className="p-2 space-y-1">
            {loadingCats ? (
              <div className="space-y-2 animate-pulse p-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ height: 36, background: "var(--color-surface-2)", borderRadius: 4 }} />
                ))}
              </div>
            ) : (
              categories.map(cat => {
                const isActive = activeCategoryId === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "9px 12px",
                      borderRadius: 4, border: "none", cursor: "pointer",
                      textAlign: "left", transition: "all 0.15s",
                      borderLeft: isActive ? "3px solid var(--color-primary)" : "3px solid transparent",
                      background: isActive ? "rgba(192,57,43,0.06)" : "transparent",
                      color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                      fontFamily: "var(--font-display)",
                      fontSize: "0.8rem",
                      fontWeight: isActive ? 700 : 400,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.color = "var(--color-primary)"
                        e.currentTarget.style.borderLeftColor = "rgba(192,57,43,0.3)"
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.color = "var(--color-text-muted)"
                        e.currentTarget.style.borderLeftColor = "transparent"
                      }
                    }}
                  >
                    <span style={{ fontSize: "1rem" }}>{cat.icon || "⚔️"}</span>
                    <span>{cat.name}</span>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* Item Grid */}
        <main>
          {loadingItems ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  background: "var(--color-surface)", border: "1px solid var(--color-border)",
                  borderRadius: 6, padding: 16, height: 220,
                }} className="animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div style={{
              background: "var(--color-surface)", border: "1px solid var(--color-border)",
              borderRadius: 6, padding: "48px 24px", textAlign: "center",
              color: "var(--color-text-muted)", fontFamily: "var(--font-display)",
            }}>
              Keine Artikel in dieser Kategorie verfügbar.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map(item => {
                const grade = item.itemTemplate?.grade || "NORMAL"
                const titleColor = GRADE_COLOR[grade]
                const borderColor = GRADE_BORDER[grade]
                const cashback = cashbackPercent > 0 ? Math.floor((item.price * cashbackPercent) / 100) : 0
                const canAfford = coins ? coins.dr >= item.price : true

                return (
                  <div
                    key={item.id}
                    style={{
                      background: "var(--color-surface)",
                      border: `1px solid ${borderColor}`,
                      borderRadius: 6,
                      display: "flex", flexDirection: "column",
                      overflow: "hidden",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = `0 0 16px ${borderColor}`
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = "none"
                    }}
                  >
                    {/* Item Icon Bereich */}
                    <div style={{
                      height: 90,
                      background: "var(--color-surface-2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      position: "relative",
                    }}>
                      <div style={{
                        width: 52, height: 52,
                        background: "var(--color-bg)",
                        border: `1px solid ${borderColor}`,
                        borderRadius: 4,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--font-display)", fontWeight: 700,
                        fontSize: "0.65rem", color: "var(--color-text-muted)",
                      }}>
                        {item.itemTemplate?.vnum || item.itemVnum || "?"}
                      </div>
                      {item.count > 1 && (
                        <span style={{
                          position: "absolute", bottom: 6, right: 8,
                          background: "var(--color-primary)", color: "#fff",
                          borderRadius: 3, padding: "1px 5px",
                          fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.65rem",
                        }}>
                          x{item.count}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ padding: "12px 12px 0", flex: 1 }}>
                      <div style={{
                        fontFamily: "var(--font-display)", fontWeight: 700,
                        fontSize: "0.85rem", color: titleColor,
                        textTransform: "uppercase", letterSpacing: "0.04em",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {item.name}
                      </div>
                      {item.description && (
                        <p style={{
                          fontFamily: "var(--font-body)", fontSize: "0.72rem",
                          color: "var(--color-text-muted)", marginTop: 4,
                          lineHeight: 1.4, display: "-webkit-box",
                          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}>
                          {item.description}
                        </p>
                      )}
                      {/* Preis */}
                      <div style={{ marginTop: 8 }}>
                        <div style={{
                          fontFamily: "var(--font-display)", fontWeight: 700,
                          fontSize: "0.9rem", color: "#fff",
                        }}>
                          💰 {item.price.toLocaleString()} DR
                        </div>
                        {cashback > 0 && (
                          <div style={{ fontFamily: "var(--font-display)", fontSize: "0.7rem", color: "var(--color-success)", marginTop: 2 }}>
                            💎 +{cashback} DM Cashback
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Kaufen-Button */}
                    <div style={{ padding: "10px 12px 12px" }}>
                      <button
                        onClick={() => handleOpenBuyModal(item)}
                        disabled={!canAfford}
                        style={{
                          width: "100%", height: 36,
                          background: canAfford ? "var(--color-primary)" : "var(--color-surface-2)",
                          color: canAfford ? "#fff" : "var(--color-text-muted)",
                          border: "none", borderRadius: 4, cursor: canAfford ? "pointer" : "not-allowed",
                          fontFamily: "var(--font-display)", fontWeight: 700,
                          fontSize: "0.8rem", textTransform: "uppercase",
                          letterSpacing: "0.08em", transition: "background 0.15s",
                        }}
                        onMouseEnter={e => { if (canAfford) e.currentTarget.style.background = "#a93226" }}
                        onMouseLeave={e => { if (canAfford) e.currentTarget.style.background = "var(--color-primary)" }}
                      >
                        {canAfford ? "Kaufen" : "Münzen fehlen"}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {/* Kauf-Modal */}
      {selectedItem && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(4px)", zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <div style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderTop: "3px solid var(--color-primary)",
            borderRadius: 6, maxWidth: 440, width: "100%",
            overflow: "hidden",
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid var(--color-border)",
              background: "var(--color-surface-2)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{
                fontFamily: "var(--font-display)", fontWeight: 700,
                fontSize: "1rem", color: "var(--color-primary)",
                textTransform: "uppercase", letterSpacing: "0.08em",
              }}>
                Kauf bestätigen
              </span>
              <button
                onClick={() => setSelectedItem(null)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--color-text-muted)", fontSize: "1.25rem", lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
              {errorMsg && (
                <div style={{
                  padding: "10px 12px", borderRadius: 4,
                  background: "rgba(231,76,60,0.1)", border: "1px solid var(--color-danger)",
                  color: "var(--color-danger)", fontFamily: "var(--font-display)", fontSize: "0.8rem",
                }}>
                  ⚠️ {errorMsg}
                </div>
              )}
              {successMsg && (
                <div style={{
                  padding: "10px 12px", borderRadius: 4,
                  background: "rgba(46,204,113,0.1)", border: "1px solid var(--color-success)",
                  color: "var(--color-success)", fontFamily: "var(--font-display)", fontSize: "0.8rem",
                }}>
                  ✓ {successMsg}
                </div>
              )}

              {!successMsg && (
                <>
                  {/* Item-Info */}
                  <div style={{
                    display: "flex", gap: 12, alignItems: "center",
                    background: "var(--color-surface-2)", borderRadius: 4,
                    padding: "10px 12px", border: "1px solid var(--color-border)",
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 4,
                      background: "var(--color-bg)", border: "1px solid var(--color-border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, fontFamily: "var(--font-display)", fontSize: "0.65rem",
                      color: "var(--color-text-muted)",
                    }}>
                      {selectedItem.itemTemplate?.vnum || selectedItem.itemVnum || "?"}
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: "var(--color-text)" }}>
                        {selectedItem.name}
                      </div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "0.8rem", color: "var(--color-primary)", marginTop: 2 }}>
                        💰 {selectedItem.price.toLocaleString()} DR
                      </div>
                    </div>
                  </div>

                  {/* Charakter-Dropdown */}
                  <div>
                    <label style={{
                      display: "block", marginBottom: 6,
                      fontFamily: "var(--font-display)", fontSize: "0.7rem",
                      color: "var(--color-text-muted)", textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}>
                      Charakter auswählen
                    </label>
                    {loadingChars ? (
                      <div style={{
                        height: 38, background: "var(--color-surface-2)",
                        borderRadius: 4, border: "1px solid var(--color-border)",
                      }} className="animate-pulse" />
                    ) : characters.length === 0 ? (
                      <div style={{
                        padding: "10px 12px", borderRadius: 4,
                        background: "rgba(231,76,60,0.06)", border: "1px solid rgba(231,76,60,0.2)",
                        color: "var(--color-danger)", fontFamily: "var(--font-display)", fontSize: "0.75rem",
                      }}>
                        Keine Charaktere vorhanden.
                      </div>
                    ) : (
                      <select
                        value={selectedCharName}
                        onChange={e => setSelectedCharName(e.target.value)}
                        style={{
                          width: "100%", padding: "9px 12px",
                          background: "var(--color-surface-2)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 4, color: "var(--color-text)",
                          fontFamily: "var(--font-display)", fontSize: "0.85rem",
                          outline: "none", cursor: "pointer",
                        }}
                      >
                        {characters.map(char => (
                          <option key={char.id} value={char.name}>
                            {char.name} (Lv. {char.level} — {getJobName(char.job)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* DM Cashback Banner */}
                  {cashbackPercent > 0 && (
                    <div style={{
                      padding: "10px 12px", borderRadius: 4,
                      background: "rgba(46,204,113,0.06)",
                      border: "1px solid rgba(46,204,113,0.2)",
                      color: "var(--color-success)",
                      fontFamily: "var(--font-display)", fontSize: "0.78rem",
                    }}>
                      💎 <strong>DM Cashback Aktiv:</strong> Du erhältst{" "}
                      <strong>{Math.floor((selectedItem.price * cashbackPercent) / 100)} DM</strong> zurück.
                    </div>
                  )}

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => setSelectedItem(null)}
                      style={{
                        flex: 1, padding: "10px 0",
                        background: "transparent", border: "1px solid var(--color-border)",
                        borderRadius: 4, color: "var(--color-text-muted)",
                        fontFamily: "var(--font-display)", fontWeight: 700,
                        fontSize: "0.8rem", textTransform: "uppercase",
                        letterSpacing: "0.06em", cursor: "pointer", transition: "all 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "var(--color-text)"}
                      onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-muted)"}
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={handleConfirmPurchase}
                      disabled={buying || !selectedCharName}
                      style={{
                        flex: 1, padding: "10px 0",
                        background: "var(--color-primary)", border: "none",
                        borderRadius: 4, color: "#fff",
                        fontFamily: "var(--font-display)", fontWeight: 700,
                        fontSize: "0.8rem", textTransform: "uppercase",
                        letterSpacing: "0.06em", cursor: buying ? "not-allowed" : "pointer",
                        opacity: buying || !selectedCharName ? 0.7 : 1,
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      }}
                    >
                      {buying ? (
                        <>
                          <span style={{
                            width: 14, height: 14, borderRadius: "50%",
                            border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff",
                            display: "inline-block", animation: "spin 0.7s linear infinite",
                          }} />
                          Kauft…
                        </>
                      ) : "Kauf abschließen"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
