"use client"

import React, { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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

const GRADE_TEXT_COLOR = {
  NORMAL: "text-text-muted",
  RARE: "text-[#4a9eff] drop-shadow-[0_0_4px_rgba(74,158,255,0.4)]",
  EPIC: "text-[#b24bff] drop-shadow-[0_0_4px_rgba(178,75,255,0.4)]",
  LEGENDARY: "text-[#ff8c00] drop-shadow-[0_0_8px_rgba(255,140,0,0.6)] font-bold",
}

const GRADE_BORDER_STYLE = {
  NORMAL: "border-border/20",
  RARE: "border-[#4a9eff]/30 shadow-[0_0_12px_rgba(74,158,255,0.1)]",
  EPIC: "border-[#b24bff]/30 shadow-[0_0_16px_rgba(178,75,255,0.15)]",
  LEGENDARY: "border-[#ff8c00]/40 item-legendary",
}

export default function ItemShopPage() {
  const { data: session } = useSession()
  
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategoryId, setActiveCategoryId] = useState<string>("")
  const [items, setItems] = useState<ShopItem[]>([])
  const [totalItems, setTotalItems] = useState(0)
  
  const [loadingCats, setLoadingCats] = useState(true)
  const [loadingItems, setLoadingItems] = useState(true)
  const [cashbackPercent, setCashbackPercent] = useState<number>(0)
  
  // Coin Balances
  const [coins, setCoins] = useState<{ dr: number; dm: number } | null>(null)
  
  // Purchase Modal State
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharName, setSelectedCharName] = useState<string>("")
  const [loadingChars, setLoadingChars] = useState(false)
  const [buying, setBuying] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Fetch initial data
  useEffect(() => {
    // Fetch categories
    fetch("/api/modules/itemshop/categories")
      .then(res => res.json())
      .then((data: Category[]) => {
        setCategories(data)
        if (data.length > 0) {
          setActiveCategoryId(data[0].id)
        }
        setLoadingCats(false)
      })
      .catch(() => setLoadingCats(false))

    // Fetch cashback setting
    fetch("/api/coins/balance")
      .then(res => res.json())
      .then(setCoins)
      .catch(() => {})

    // Load setting for display cashback
    fetch("/api/admin/settings")
      .then(res => res.ok ? res.json() : [])
      .then((settings: any[]) => {
        const cashback = settings.find((s: any) => s.key === "dm_cashback_percent")
        if (cashback) {
          setCashbackPercent(parseInt(cashback.value, 10))
        }
      })
      .catch(() => {})
  }, [])

  // Fetch items when active category changes
  useEffect(() => {
    if (!activeCategoryId) return
    setLoadingItems(true)
    fetch(`/api/modules/itemshop/items?categoryId=${activeCategoryId}&limit=24`)
      .then(res => res.json())
      .then((data: { items: ShopItem[]; total: number }) => {
        setItems(data.items || [])
        setTotalItems(data.total || 0)
        setLoadingItems(false)
      })
      .catch(() => setLoadingItems(false))
  }, [activeCategoryId])

  // Open Buy Dialog
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
    
    // Fetch characters
    fetch("/api/modules/character/my-characters")
      .then(res => res.json())
      .then((data: Character[]) => {
        setCharacters(data)
        if (data.length > 0) {
          setSelectedCharName(data[0].name)
        }
        setLoadingChars(false)
      })
      .catch(() => setLoadingChars(false))
  };

  // Perform purchase
  const handleConfirmPurchase = async () => {
    if (!selectedItem || !selectedCharName) return
    setBuying(true)
    setErrorMsg(null)
    
    try {
      const res = await fetch("/api/modules/itemshop/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopItemId: selectedItem.id,
          characterName: selectedCharName,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Kauf fehlgeschlagen.")
      }

      setSuccessMsg(`Erfolgreich gekauft! Das Item wurde an das Ingame-Depot von ${selectedCharName} gesendet.`)
      
      // Update coins locally
      if (data.newBalance) {
        setCoins(data.newBalance)
      }
      
      // Dispatch update to Topbar widget
      window.dispatchEvent(new Event("coin-balance-update"))
      
      // Auto close after 3 seconds
      setTimeout(() => {
        setSelectedItem(null)
        setSuccessMsg(null)
      }, 3000)
    } catch (err: any) {
      setErrorMsg(err.message || "Ein unbekannter Fehler ist aufgetreten.")
    } finally {
      setBuying(false)
    }
  }

  const getJobName = (job: number) => {
    const jobs: Record<number, string> = {
      0: "Krieger", 1: "Krieger(w)",
      2: "Ninja", 3: "Ninja(w)",
      4: "Sura", 5: "Sura(w)",
      6: "Schamane", 7: "Schamane(w)"
    }
    return jobs[job] || "Klasse"
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl text-primary uppercase tracking-widest font-bold">
            Item Shop
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Rüste deinen Charakter mit den mächtigsten Gegenständen und Buffs unseres Reiches aus.
          </p>
        </div>

        {/* Balance Widget (if not visible in topbar, shown here too for extra wow factor) */}
        {coins && (
          <div className="flex gap-4 bg-surface border border-border/30 rounded-lg p-3 shadow-[0_0_15px_var(--color-glow)] font-display">
            <div className="flex flex-col">
              <span className="text-[10px] text-text-muted uppercase tracking-widest">Dragon Coins</span>
              <span className="text-primary font-bold text-lg">💰 {coins.dr.toLocaleString()} DR</span>
            </div>
            <div className="flex flex-col border-l border-border/20 pl-4">
              <span className="text-[10px] text-text-muted uppercase tracking-widest">Dark Matter</span>
              <span className="text-accent font-bold text-lg">💎 {coins.dm.toLocaleString()} DM</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 items-start">
        {/* Left Sidebar: Categories */}
        <aside className="bg-surface border border-border/30 rounded-lg p-4 shadow-[0_0_20px_var(--color-glow)] space-y-2.5">
          <h2 className="font-display text-xs text-text-muted uppercase tracking-widest border-b border-border/10 pb-2 mb-2">
            Kategorien
          </h2>
          {loadingCats ? (
            <div className="space-y-2 animate-pulse">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-9 bg-surface-2 rounded-md" />
              ))}
            </div>
          ) : (
            <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 pb-2 lg:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`flex items-center gap-3.5 px-4 py-2.5 rounded-md text-xs font-display uppercase tracking-wider text-left transition-all duration-300 w-full shrink-0 lg:shrink-1 border ${
                    activeCategoryId === cat.id
                      ? "bg-primary/5 border-primary text-primary font-semibold shadow-[0_0_12px_var(--color-glow)]"
                      : "bg-transparent border-transparent text-text-muted hover:bg-surface-2/40 hover:text-text"
                  }`}
                >
                  <span className="text-lg shrink-0">{cat.icon || "⚔️"}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Right Content: Grid */}
        <main className="space-y-4">
          {loadingItems ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-surface border border-border/20 rounded-lg p-4 animate-pulse space-y-3">
                  <div className="aspect-square bg-surface-2 rounded-md" />
                  <div className="h-4 bg-surface-2 rounded w-3/4" />
                  <div className="h-4 bg-surface-2 rounded w-1/2" />
                  <div className="h-8 bg-surface-2 rounded" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <Card className="bg-surface border-border/30 shadow-[0_0_20px_var(--color-glow)] p-12 text-center text-text-muted font-display">
              Keine Artikel in dieser Kategorie verfügbar.
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((item) => {
                const grade = item.itemTemplate?.grade || "NORMAL"
                const borderClass = GRADE_BORDER_STYLE[grade] || "border-border/20"
                const titleColorClass = GRADE_TEXT_COLOR[grade] || "text-text"
                const cashback = cashbackPercent > 0 ? Math.floor((item.price * cashbackPercent) / 100) : 0

                return (
                  <div
                    key={item.id}
                    className={`bg-surface border rounded-lg p-4 flex flex-col justify-between transition-all duration-300 ${borderClass} hover:shadow-[0_0_24px_var(--color-glow)]`}
                  >
                    {/* Item Image / Visual */}
                    <div className="aspect-square bg-surface-2/45 rounded-md border border-border/10 flex items-center justify-center relative mb-3 group overflow-hidden">
                      <div className="hex-icon w-14 h-14 flex items-center justify-center bg-surface border-border/40 text-primary font-bold text-xs shadow-[0_0_12px_var(--color-glow)] transition-transform duration-500 group-hover:scale-110">
                        {item.itemTemplate?.vnum || item.itemVnum || "?"}
                      </div>
                      
                      {item.count > 1 && (
                        <span className="absolute bottom-2 right-2 bg-primary text-bg font-display font-bold text-[10px] px-1.5 py-0.5 rounded shadow">
                          x{item.count}
                        </span>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="space-y-1 mb-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className={`font-display text-sm truncate uppercase tracking-wider ${titleColorClass}`}>
                          {item.name}
                        </h3>
                        <p className="text-[11px] text-text-muted line-clamp-2 mt-1 leading-relaxed">
                          {item.description || "Keine Beschreibung verfügbar."}
                        </p>
                      </div>

                      {/* Prices & Cashback Info */}
                      <div className="mt-3 space-y-1">
                        <div className="text-primary text-sm font-display font-bold">
                          💰 {item.price.toLocaleString()} DR
                        </div>
                        {cashback > 0 && (
                          <div className="text-success text-[10px] uppercase font-bold tracking-wider">
                            💎 +{cashback} DM Cashback
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Buy Trigger */}
                    <Button
                      onClick={() => handleOpenBuyModal(item)}
                      disabled={coins ? coins.dr < item.price : false}
                      className="w-full bg-primary text-bg font-display uppercase tracking-widest text-xs py-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_12px_var(--color-glow)] transition-all shrink-0"
                    >
                      {coins && coins.dr < item.price ? "Münzen fehlen" : "Kaufen"}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {/* Custom HTML5 Buy Dialog / Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-[#000]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-primary/30 max-w-md w-full rounded-lg shadow-[0_0_40px_var(--color-glow)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-border/20 flex justify-between items-center bg-surface-2/40">
              <h3 className="font-display font-bold text-lg text-primary tracking-widest uppercase">
                Kauf bestätigen
              </h3>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-text-muted hover:text-text text-xl font-bold focus:outline-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-danger/10 border border-danger text-danger rounded text-xs leading-relaxed font-display">
                  ⚠️ {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 bg-success/10 border border-success text-success rounded text-xs leading-relaxed font-display">
                  ✨ {successMsg}
                </div>
              )}

              {!successMsg && (
                <>
                  {/* Item info */}
                  <div className="flex items-center gap-4 bg-surface-2/45 p-3 rounded border border-border/10">
                    <div className="hex-icon w-12 h-12 flex items-center justify-center bg-surface border-border/30 text-primary font-bold text-xs shrink-0">
                      {selectedItem.itemTemplate?.vnum || selectedItem.itemVnum || "?"}
                    </div>
                    <div>
                      <h4 className="font-display text-sm text-text font-bold uppercase tracking-wider">
                        {selectedItem.name}
                      </h4>
                      <div className="text-primary font-display text-xs font-semibold mt-0.5">
                        Preis: 💰 {selectedItem.price.toLocaleString()} DR
                      </div>
                    </div>
                  </div>

                  {/* Character select */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-display text-text-muted uppercase tracking-wider">
                      Charakter auswählen
                    </label>
                    {loadingChars ? (
                      <div className="h-10 bg-surface-2 border border-border/20 rounded animate-pulse" />
                    ) : characters.length === 0 ? (
                      <div className="text-xs text-danger font-display bg-danger/5 p-3 rounded border border-danger/10">
                        Keine Charaktere auf diesem Account vorhanden. Erstelle zuerst einen Charakter im Spiel.
                      </div>
                    ) : (
                      <select
                        value={selectedCharName}
                        onChange={(e) => setSelectedCharName(e.target.value)}
                        className="w-full bg-surface-2 border border-border/40 rounded px-3.5 py-2 text-sm text-text font-display focus:outline-none focus:border-primary transition-colors cursor-pointer"
                      >
                        {characters.map((char) => (
                          <option key={char.id} value={char.name}>
                            {char.name} (Lv. {char.level} — {getJobName(char.job)})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Cashback banner */}
                  {cashbackPercent > 0 && (
                    <div className="bg-success/5 border border-success/20 rounded p-3 text-xs leading-relaxed text-success font-display">
                      💎 <strong>DM Cashback Aktiv:</strong> Nach diesem Kauf werden dir automatisch{" "}
                      <strong>{Math.floor((selectedItem.price * cashbackPercent) / 100)} DM</strong> gutgeschrieben.
                    </div>
                  )}

                  {/* Submit / Cancel Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedItem(null)}
                      className="w-1/2 border border-border/20 text-text-muted hover:text-text font-display uppercase tracking-widest text-xs py-2 hover:bg-surface-2"
                    >
                      Abbrechen
                    </Button>
                    <Button
                      onClick={handleConfirmPurchase}
                      disabled={buying || !selectedCharName}
                      className="w-1/2 bg-primary text-bg font-display uppercase tracking-widest text-xs py-2 hover:bg-primary/95 hover:shadow-[0_0_12px_var(--color-glow)] disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                    >
                      {buying ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                          Kauft…
                        </>
                      ) : (
                        "Kauf abschließen"
                      )}
                    </Button>
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
