"use client"

import React, { useEffect, useState, useRef, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, RotateCcw, AlertTriangle, Info } from "lucide-react"

type StorageItem = {
  id: string
  slot: number
  count: number
  enchants: any
  template: {
    id: string
    vnum: number
    name: string
    grade: "NORMAL" | "RARE" | "EPIC" | "LEGENDARY"
    description: string | null
  }
}

type TrashItem = {
  id: string
  count: number
  enchants: any
  deletedAt: string
  expiresAt: string
  template: {
    id: string
    vnum: number
    name: string
    grade: "NORMAL" | "RARE" | "EPIC" | "LEGENDARY"
    description: string | null
  }
}

const GRADE_BORDER_CLASS = {
  NORMAL: "border-border/30",
  RARE: "border-[#4a9eff]/40 shadow-[0_0_12px_rgba(74,158,255,0.15)]",
  EPIC: "border-[#b24bff]/40 shadow-[0_0_16px_rgba(178,75,255,0.2)] animate-pulse",
  LEGENDARY: "border-[#ff8c00]/50 item-legendary",
}

const GRADE_TEXT_CLASS = {
  NORMAL: "text-text-muted",
  RARE: "text-[#4a9eff]",
  EPIC: "text-[#b24bff]",
  LEGENDARY: "text-[#ff8c00] font-bold",
}

export default function StoragePage() {
  const { data: session } = useSession()
  
  const [items, setItems] = useState<StorageItem[]>([])
  const [trashItems, setTrashItems] = useState<TrashItem[]>([])
  const [activeTab, setActiveTab] = useState<"storage" | "trash">("storage")
  
  const [loading, setLoading] = useState(true)
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null)
  
  // Custom Hover Tooltip State
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  
  // Restore Modal State
  const [restoringItem, setRestoringItem] = useState<TrashItem | null>(null)
  const [restoreSlot, setRestoreSlot] = useState<number>(0)
  
  // Fetch Storage Items
  const fetchStorage = () => {
    setLoading(true)
    fetch("/api/storage")
      .then(res => res.json())
      .then((data) => {
        setItems(data.items || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  // Fetch Trash Items
  const fetchTrash = () => {
    fetch("/api/storage/trash")
      .then(res => res.json())
      .then((data) => {
        setTrashItems(data.items || [])
      })
      .catch(() => {})
  }

  useEffect(() => {
    if (session) {
      fetchStorage()
      fetchTrash()
    }
  }, [session])

  // Build key-value map for O(1) slot lookups during virtual rendering
  const itemsMap = useMemo(() => {
    const map = new Map<number, StorageItem>()
    items.forEach(item => {
      map.set(item.slot, item)
    })
    return map
  }, [items])

  // HTML5 Drag handlers
  const handleDragStart = (e: React.DragEvent, slot: number) => {
    e.dataTransfer.setData("text/plain", slot.toString())
    setDraggedSlot(slot)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetSlot: number) => {
    e.preventDefault()
    const fromSlot = parseInt(e.dataTransfer.getData("text/plain"), 10)
    if (isNaN(fromSlot) || fromSlot === targetSlot) return

    // Optimistically update positions in local UI state
    const fromItem = items.find(i => i.slot === fromSlot)
    const toItem = items.find(i => i.slot === targetSlot)

    if (!fromItem) return

    let updatedItems = [...items]
    updatedItems = updatedItems.map(item => {
      if (item.slot === fromSlot) return { ...item, slot: targetSlot }
      if (toItem && item.slot === targetSlot) return { ...item, slot: fromSlot }
      return item
    })
    setItems(updatedItems)

    try {
      const res = await fetch("/api/storage/move", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromSlot, toSlot: targetSlot }),
      })
      if (!res.ok) throw new Error()
      fetchTrash() // Maybe cashback/trash updated
    } catch {
      // Revert if API failed
      fetchStorage()
    } finally {
      setDraggedSlot(null)
    }
  }

  // Trash Drop Handler
  const handleTrashDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const fromSlot = parseInt(e.dataTransfer.getData("text/plain"), 10)
    if (isNaN(fromSlot)) return

    // Optimistically delete from UI list
    setItems(prev => prev.filter(i => i.slot !== fromSlot))

    try {
      const res = await fetch("/api/storage/item", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: fromSlot }),
      })
      if (!res.ok) throw new Error()
      fetchTrash()
    } catch {
      fetchStorage()
    } finally {
      setDraggedSlot(null)
    }
  }

  // Restore Action
  const handleOpenRestoreModal = (item: TrashItem) => {
    setRestoringItem(item)
    // Find first empty slot
    let firstFree = 0
    for (let i = 0; i < 1000; i++) {
      if (!itemsMap.has(i)) {
        firstFree = i
        break
      }
    }
    setRestoreSlot(firstFree)
  }

  const handleConfirmRestore = async () => {
    if (!restoringItem) return
    
    try {
      const res = await fetch("/api/storage/trash/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trashId: restoringItem.id,
          targetSlot: restoreSlot,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Wiederherstellung fehlgeschlagen.")
      }

      setRestoringItem(null)
      fetchStorage()
      fetchTrash()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Capacity calculations
  const storageCapacityPercent = (items.length / 1000) * 100
  const trashCapacityPercent = (trashItems.length / 128) * 100

  // Row Virtualizer Settings (100 rows, 10 columns per row)
  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: 100,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 62,
    overscan: 4,
  })

  // Format Unix Timestamp Countdown
  const formatCountdown = (expiresAtStr: string) => {
    const diff = new Date(expiresAtStr).getTime() - Date.now()
    if (diff <= 0) return "Abgelaufen"
    const days = Math.floor(diff / (24 * 3600 * 1000))
    const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000))
    if (days > 0) return `${days}t ${hours}h`
    return `${hours}h`
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display text-3xl text-primary uppercase tracking-widest font-bold">
            Web-Lager
          </h1>
          <p className="text-text-muted text-sm mt-1">
            Sortiere deine Gegenstände via Drag & Drop oder stelle gelöschte Items aus dem Papierkorb wieder her.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2 bg-surface-2/80 p-1 rounded-md border border-border/30 font-display text-xs uppercase tracking-wider">
          <button
            onClick={() => setActiveTab("storage")}
            className={`px-4 py-2 rounded transition-colors ${
              activeTab === "storage"
                ? "bg-primary text-bg font-bold shadow-[0_0_8px_var(--color-glow)]"
                : "text-text-muted hover:text-text"
            }`}
          >
            Lager ({items.length}/1000)
          </button>
          <button
            onClick={() => setActiveTab("trash")}
            className={`px-4 py-2 rounded transition-colors ${
              activeTab === "trash"
                ? "bg-danger text-text font-bold shadow-[0_0_8px_rgba(224,90,58,0.2)]"
                : "text-text-muted hover:text-text"
            }`}
          >
            Papierkorb ({trashItems.length}/128)
          </button>
        </div>
      </div>

      {/* Capacity Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lager Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-text-muted">
            <span>Lagerbelegung</span>
            <span className="font-bold text-text">{items.length} / 1000 Slots</span>
          </div>
          <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden border border-border/10">
            <div
              className={`h-full transition-all duration-500 ${
                storageCapacityPercent >= 95 
                  ? "bg-danger shadow-[0_0_8px_var(--color-danger)]" 
                  : storageCapacityPercent >= 80 
                    ? "bg-warning shadow-[0_0_8px_var(--color-warning)]" 
                    : "bg-primary shadow-[0_0_8px_var(--color-glow)]"
              }`}
              style={{ width: `${storageCapacityPercent}%` }}
            />
          </div>
        </div>

        {/* Trash Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-text-muted">
            <span>Papierkorbbelegung</span>
            <span className="font-bold text-text">{trashItems.length} / 128 Items</span>
          </div>
          <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden border border-border/10">
            <div
              className="h-full bg-danger shadow-[0_0_8px_var(--color-danger)] transition-all duration-500"
              style={{ width: `${trashCapacityPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid Views */}
      {activeTab === "storage" ? (
        <div className="relative">
          {/* Virtual Grid Container */}
          <div
            ref={parentRef}
            className="h-[600px] overflow-y-auto border border-border/30 rounded-lg bg-surface/50 p-4 shadow-[0_0_30px_var(--color-glow)]"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const rowIndex = virtualRow.index
                const rowSlots = Array.from({ length: 10 }).map((_, c) => rowIndex * 10 + c)

                return (
                  <div
                    key={virtualRow.key}
                    className="absolute top-0 left-0 w-full grid grid-cols-10 gap-2 pb-2"
                    style={{
                      height: "54px",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {rowSlots.map((slotIndex) => {
                      const item = itemsMap.get(slotIndex)
                      const isDragged = draggedSlot === slotIndex

                      return (
                        <div
                          key={slotIndex}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, slotIndex)}
                          className={`aspect-square w-full rounded border flex items-center justify-center relative transition-all duration-300 ${
                            item 
                              ? `${GRADE_BORDER_CLASS[item.template.grade]} bg-surface-2 cursor-grab active:cursor-grabbing` 
                              : "border-border/10 bg-surface-2/10 hover:bg-surface-2/20"
                          } ${isDragged ? "opacity-30" : ""}`}
                          draggable={!!item}
                          onDragStart={(e) => handleDragStart(e, slotIndex)}
                          onMouseEnter={(e) => {
                            if (item) {
                              setHoveredSlot(slotIndex)
                              setTooltipPos({ x: e.clientX + 10, y: e.clientY + 10 })
                            }
                          }}
                          onMouseMove={(e) => {
                            if (item) {
                              setTooltipPos({ x: e.clientX + 12, y: e.clientY + 12 })
                            }
                          }}
                          onMouseLeave={() => setHoveredSlot(null)}
                        >
                          {item ? (
                            <>
                              {/* Item icon (hex badge placeholder) */}
                              <div className="hex-icon w-9 h-9 flex items-center justify-center font-display font-bold text-[9px] text-primary bg-surface/80 border border-primary/20">
                                {item.template.vnum}
                              </div>
                              {item.count > 1 && (
                                <span className="absolute bottom-1 right-1 bg-surface-2/90 border border-border/20 text-text font-mono font-bold text-[8px] px-1 rounded">
                                  {item.count}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-text-muted font-mono">{slotIndex + 1}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>

          {/* HTML5 Custom Tooltip */}
          {hoveredSlot !== null && itemsMap.get(hoveredSlot) && (
            <div
              className="fixed bg-surface border border-primary/40 rounded-md p-3.5 shadow-[0_0_24px_rgba(200,168,75,0.35)] max-w-xs z-50 animate-in fade-in duration-100 font-display pointer-events-none"
              style={{ top: `${tooltipPos.y}px`, left: `${tooltipPos.x}px` }}
            >
              {(() => {
                const it = itemsMap.get(hoveredSlot)!
                return (
                  <div className="space-y-1.5 text-xs">
                    <div className={`font-bold uppercase tracking-wider text-sm ${GRADE_TEXT_CLASS[it.template.grade]}`}>
                      {it.template.name}
                    </div>
                    <div className="text-[10px] text-text-muted uppercase border-b border-border/10 pb-1 flex justify-between">
                      <span>Rarity: {it.template.grade}</span>
                      <span>Slot: {it.slot + 1}</span>
                    </div>
                    <p className="text-[11px] text-text-muted leading-normal">
                      {it.template.description || "Ein geheimnisvoller Gegenstand."}
                    </p>
                    {it.enchants && Object.keys(it.enchants).length > 0 && (
                      <div className="pt-1.5 border-t border-border/10">
                        <div className="text-[10px] text-primary uppercase tracking-wider mb-1">Boni</div>
                        <ul className="space-y-0.5 text-[10px] text-success">
                          {Object.entries(it.enchants).map(([k, v]) => (
                            <li key={k}>• {k}: +{String(v)}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {/* DND Drag-to-delete Trash zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleTrashDrop}
            className="mt-6 border-2 border-dashed border-danger/30 hover:border-danger/60 bg-danger/5 hover:bg-danger/10 text-danger rounded-lg p-5 flex items-center justify-center gap-3 transition-all duration-300 font-display uppercase tracking-wider text-xs shadow-[0_0_15px_rgba(224,90,58,0.05)] cursor-default"
          >
            <Trash2 className="w-5 h-5 animate-bounce" />
            <span>Gegenstand hier ablegen zum Löschen (Papierkorb)</span>
          </div>
        </div>
      ) : (
        /* Trash tab view */
        <Card className="bg-surface border border-border/30 shadow-[0_0_20px_var(--color-glow)]">
          <CardHeader className="border-b border-border/20 pb-4">
            <CardTitle className="font-display text-lg text-danger tracking-wider uppercase font-semibold">
              Papierkorb
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {trashItems.length === 0 ? (
              <div className="text-center py-16 text-text-muted font-display">
                Papierkorb ist leer.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trashItems.map((item) => {
                  const remains = new Date(item.expiresAt).getTime() - Date.now()
                  const isExpiringSoon = remains < 24 * 3600 * 1000 // < 24 hours

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between p-4 rounded bg-surface-2/45 border ${
                        isExpiringSoon ? "border-danger shadow-[0_0_12px_rgba(224,90,58,0.2)]" : "border-border/10"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="hex-icon w-11 h-11 flex items-center justify-center bg-surface border border-border/30 text-text-muted grayscale opacity-60">
                          {item.template.vnum}
                        </div>
                        <div>
                          <h4 className="font-display font-bold text-xs uppercase tracking-wide text-text-muted">
                            {item.template.name}
                          </h4>
                          <span className="text-[10px] text-text-muted font-mono">
                            Anzahl: {item.count}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge variant={isExpiringSoon ? "danger" : "default"} className="text-[9px] uppercase tracking-wider">
                          ⏱️ {formatCountdown(item.expiresAt)}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleOpenRestoreModal(item)}
                          className="bg-success/15 hover:bg-success/25 text-success border border-success/30 font-display text-[10px] uppercase tracking-wider py-1 px-3.5 h-7 transition-all"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" /> Wiederherstellen
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Target Slot Selection Modal for Trashed Items */}
      {restoringItem && (
        <div className="fixed inset-0 bg-[#000]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-success/30 max-w-md w-full rounded-lg shadow-[0_0_40px_var(--color-glow)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-border/20 flex justify-between items-center bg-surface-2/40">
              <h3 className="font-display font-bold text-lg text-success tracking-widest uppercase">
                Slot auswählen
              </h3>
              <button 
                onClick={() => setRestoringItem(null)}
                className="text-text-muted hover:text-text text-xl font-bold focus:outline-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 bg-surface-2/45 p-3 rounded border border-border/10">
                <div className="hex-icon w-12 h-12 flex items-center justify-center bg-surface border-border/30 text-text-muted">
                  {restoringItem.template.vnum}
                </div>
                <div>
                  <h4 className="font-display text-sm text-text font-bold uppercase tracking-wider">
                    {restoringItem.template.name}
                  </h4>
                  <div className="text-[10px] text-text-muted mt-0.5">
                    Anzahl: {restoringItem.count}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-display text-text-muted uppercase tracking-wider">
                  Zielslot wählen (nur freie Slots angezeigt)
                </label>
                <select
                  value={restoreSlot}
                  onChange={(e) => setRestoreSlot(parseInt(e.target.value, 10))}
                  className="w-full bg-surface-2 border border-border/40 rounded px-3.5 py-2 text-sm text-text font-display focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  {Array.from({ length: 1000 }).map((_, idx) => {
                    if (itemsMap.has(idx)) return null
                    return (
                      <option key={idx} value={idx}>
                        Slot {idx + 1} (Frei)
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Submit Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setRestoringItem(null)}
                  className="w-1/2 border border-border/20 text-text-muted hover:text-text font-display uppercase tracking-widest text-xs py-2 hover:bg-surface-2"
                >
                  Abbrechen
                </Button>
                <Button
                  onClick={handleConfirmRestore}
                  className="w-1/2 bg-success text-bg font-display uppercase tracking-widest text-xs py-2 hover:bg-success/95 hover:shadow-[0_0_12px_rgba(76,175,80,0.15)] transition-all"
                >
                  Bestätigen
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
