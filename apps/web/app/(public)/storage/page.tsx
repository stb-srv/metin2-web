"use client"

import React, { useEffect, useState, useRef, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Trash2, RotateCcw } from "lucide-react"

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

const GRADE_BORDER: Record<string, string> = {
  NORMAL: "#252530",
  RARE: "#2980b9",
  EPIC: "#8e44ad",
  LEGENDARY: "#e67e22",
}

const GRADE_COLOR: Record<string, string> = {
  NORMAL: "var(--color-text-muted)",
  RARE: "#2980b9",
  EPIC: "#8e44ad",
  LEGENDARY: "#e67e22",
}

export default function StoragePage() {
  const { data: session } = useSession()

  const [items, setItems] = useState<StorageItem[]>([])
  const [trashItems, setTrashItems] = useState<TrashItem[]>([])
  const [activeTab, setActiveTab] = useState<"storage" | "trash">("storage")
  const [loading, setLoading] = useState(true)
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null)
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [restoringItem, setRestoringItem] = useState<TrashItem | null>(null)
  const [restoreSlot, setRestoreSlot] = useState<number>(0)

  const fetchStorage = () => {
    setLoading(true)
    fetch("/api/storage")
      .then(res => res.json())
      .then(data => { setItems(data.items || []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  const fetchTrash = () => {
    fetch("/api/storage/trash")
      .then(res => res.json())
      .then(data => setTrashItems(data.items || []))
      .catch(() => {})
  }

  useEffect(() => {
    if (session) { fetchStorage(); fetchTrash() }
  }, [session])

  const itemsMap = useMemo(() => {
    const map = new Map<number, StorageItem>()
    items.forEach(item => map.set(item.slot, item))
    return map
  }, [items])

  const handleDragStart = (e: React.DragEvent, slot: number) => {
    e.dataTransfer.setData("text/plain", slot.toString())
    setDraggedSlot(slot)
  }

  const handleDragOver = (e: React.DragEvent) => e.preventDefault()

  const handleDrop = async (e: React.DragEvent, targetSlot: number) => {
    e.preventDefault()
    const fromSlot = parseInt(e.dataTransfer.getData("text/plain"), 10)
    if (isNaN(fromSlot) || fromSlot === targetSlot) return

    const fromItem = items.find(i => i.slot === fromSlot)
    const toItem = items.find(i => i.slot === targetSlot)
    if (!fromItem) return

    let updated = items.map(item => {
      if (item.slot === fromSlot) return { ...item, slot: targetSlot }
      if (toItem && item.slot === targetSlot) return { ...item, slot: fromSlot }
      return item
    })
    setItems(updated)

    try {
      const res = await fetch("/api/storage/move", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fromSlot, toSlot: targetSlot }),
      })
      if (!res.ok) throw new Error()
    } catch { fetchStorage() }
    finally { setDraggedSlot(null) }
  }

  const handleTrashDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const fromSlot = parseInt(e.dataTransfer.getData("text/plain"), 10)
    if (isNaN(fromSlot)) return
    setItems(prev => prev.filter(i => i.slot !== fromSlot))
    try {
      const res = await fetch("/api/storage/item", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: fromSlot }),
      })
      if (!res.ok) throw new Error()
      fetchTrash()
    } catch { fetchStorage() }
    finally { setDraggedSlot(null) }
  }

  const handleOpenRestoreModal = (item: TrashItem) => {
    setRestoringItem(item)
    let firstFree = 0
    for (let i = 0; i < 1000; i++) {
      if (!itemsMap.has(i)) { firstFree = i; break }
    }
    setRestoreSlot(firstFree)
  }

  const handleConfirmRestore = async () => {
    if (!restoringItem) return
    try {
      const res = await fetch("/api/storage/trash/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trashId: restoringItem.id, targetSlot: restoreSlot }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Fehler")
      }
      setRestoringItem(null)
      fetchStorage(); fetchTrash()
    } catch (err: any) { alert(err.message) }
  }

  const storageCapacityPercent = (items.length / 1000) * 100
  const trashCapacityPercent = (trashItems.length / 128) * 100

  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: 100,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 62,
    overscan: 4,
  })

  const formatCountdown = (expiresAtStr: string) => {
    const diff = new Date(expiresAtStr).getTime() - Date.now()
    if (diff <= 0) return "Abgelaufen"
    const days = Math.floor(diff / (24 * 3600 * 1000))
    const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000))
    if (days > 0) return `${days}t ${hours}h`
    return `${hours}h`
  }

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: "10px 20px",
    background: "transparent",
    border: "none",
    borderBottom: isActive ? "2px solid var(--color-primary)" : "2px solid transparent",
    color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
    fontFamily: "var(--font-display)",
    fontWeight: 700, fontSize: "0.85rem",
    textTransform: "uppercase", letterSpacing: "0.08em",
    cursor: "pointer", transition: "all 0.15s",
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="section-header" style={{ fontSize: "1.8rem", display: "inline-block" }}>Web-Lager</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginTop: 6, fontFamily: "var(--font-body)" }}>
          Sortiere deine Gegenstände via Drag & Drop oder stelle gelöschte Items wieder her.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)" }}>
        <button style={tabStyle(activeTab === "storage")} onClick={() => setActiveTab("storage")}>
          Lager ({items.length}/1000)
        </button>
        <button style={tabStyle(activeTab === "trash")} onClick={() => setActiveTab("trash")}>
          Papierkorb ({trashItems.length}/128)
        </button>
      </div>

      {/* Capacity Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: "Lagerbelegung", pct: storageCapacityPercent, count: items.length, max: 1000 },
          { label: "Papierkorbbelegung", pct: trashCapacityPercent, count: trashItems.length, max: 128 },
        ].map(({ label, pct, count, max }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", fontFamily: "var(--font-display)", color: "var(--color-text-muted)" }}>
              <span>{label}</span>
              <span style={{ color: "var(--color-text)", fontWeight: 700 }}>{count} / {max}</span>
            </div>
            <div style={{ height: 4, background: "var(--color-surface-2)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2, transition: "width 0.5s",
                width: `${pct}%`,
                background: pct >= 90 ? "var(--color-danger)" : pct >= 70 ? "var(--color-warning)" : "var(--color-primary)",
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Storage Tab */}
      {activeTab === "storage" ? (
        <div>
          <div
            ref={parentRef}
            style={{
              height: 600, overflowY: "auto",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: 6, padding: 12,
            }}
          >
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
              {rowVirtualizer.getVirtualItems().map(virtualRow => {
                const rowIndex = virtualRow.index
                const rowSlots = Array.from({ length: 10 }, (_, c) => rowIndex * 10 + c)

                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: "absolute", top: 0, left: 0, width: "100%",
                      display: "grid", gridTemplateColumns: "repeat(10, 1fr)",
                      gap: 4, paddingBottom: 4,
                      height: 58,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {rowSlots.map(slotIndex => {
                      const item = itemsMap.get(slotIndex)
                      const isDragged = draggedSlot === slotIndex
                      const borderColor = item ? GRADE_BORDER[item.template.grade] : "#252530"

                      return (
                        <div
                          key={slotIndex}
                          onDragOver={handleDragOver}
                          onDrop={e => handleDrop(e, slotIndex)}
                          draggable={!!item}
                          onDragStart={e => handleDragStart(e, slotIndex)}
                          style={{
                            width: "100%", aspectRatio: "1",
                            background: "#0f1014",
                            border: `1px solid ${borderColor}`,
                            borderRadius: 4,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            position: "relative", transition: "border-color 0.15s, box-shadow 0.15s",
                            cursor: item ? "grab" : "default",
                            opacity: isDragged ? 0.3 : 1,
                          }}
                          onMouseEnter={e => {
                            if (item) {
                              setHoveredSlot(slotIndex)
                              setTooltipPos({ x: e.clientX + 12, y: e.clientY + 12 })
                              e.currentTarget.style.boxShadow = "0 0 8px rgba(192,57,43,0.4)"
                            }
                          }}
                          onMouseLeave={e => {
                            setHoveredSlot(null)
                            e.currentTarget.style.boxShadow = "none"
                          }}
                          onMouseMove={e => {
                            if (item) setTooltipPos({ x: e.clientX + 12, y: e.clientY + 12 })
                          }}
                        >
                          {item ? (
                            <>
                              <div style={{
                                width: 28, height: 28, borderRadius: 2,
                                background: "var(--color-surface)",
                                border: `1px solid ${borderColor}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontFamily: "var(--font-display)", fontWeight: 700,
                                fontSize: "0.55rem", color: "var(--color-text-muted)",
                              }}>
                                {item.template.vnum}
                              </div>
                              {item.count > 1 && (
                                <span style={{
                                  position: "absolute", bottom: 1, right: 2,
                                  background: "rgba(0,0,0,0.8)",
                                  color: "var(--color-text)", fontWeight: 700, fontSize: "0.5rem",
                                  padding: "0 2px", borderRadius: 2,
                                }}>
                                  {item.count}
                                </span>
                              )}
                            </>
                          ) : (
                            <span style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.1)" }}>{slotIndex + 1}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tooltip */}
          {hoveredSlot !== null && itemsMap.get(hoveredSlot) && (
            <div
              style={{
                position: "fixed", top: tooltipPos.y, left: tooltipPos.x,
                background: "var(--color-surface)", border: "1px solid var(--color-border)",
                borderTop: "2px solid var(--color-primary)",
                borderRadius: 4, padding: "10px 14px",
                maxWidth: 220, zIndex: 100, pointerEvents: "none",
                fontFamily: "var(--font-display)",
              }}
            >
              {(() => {
                const it = itemsMap.get(hoveredSlot)!
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", color: GRADE_COLOR[it.template.grade] }}>
                      {it.template.name}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {it.template.grade} · Slot {it.slot + 1}
                    </div>
                    {it.template.description && (
                      <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: 4, lineHeight: 1.4 }}>
                        {it.template.description}
                      </p>
                    )}
                    {it.enchants && Object.keys(it.enchants).length > 0 && (
                      <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 4, marginTop: 4 }}>
                        {Object.entries(it.enchants).map(([k, v]) => (
                          <div key={k} style={{ fontSize: "0.65rem", color: "var(--color-success)" }}>• {k}: +{String(v)}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          )}

          {/* Trash Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleTrashDrop}
            style={{
              marginTop: 16, padding: "16px 24px",
              border: "2px dashed rgba(231,76,60,0.3)", borderRadius: 6,
              background: "rgba(231,76,60,0.03)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              color: "var(--color-danger)", fontFamily: "var(--font-display)",
              fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.08em",
              transition: "all 0.15s", cursor: "default",
            }}
            onDragEnter={e => {
              e.currentTarget.style.borderColor = "rgba(231,76,60,0.7)"
              e.currentTarget.style.background = "rgba(231,76,60,0.08)"
            }}
            onDragLeave={e => {
              e.currentTarget.style.borderColor = "rgba(231,76,60,0.3)"
              e.currentTarget.style.background = "rgba(231,76,60,0.03)"
            }}
          >
            <Trash2 size={16} />
            <span>Gegenstand hier ablegen zum Löschen (Papierkorb)</span>
          </div>
        </div>
      ) : (
        /* Papierkorb Tab */
        <div style={{
          background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 6, overflow: "hidden",
        }}>
          <div className="section-header px-5 py-3" style={{
            background: "var(--color-surface-2)", borderBottom: "2px solid var(--color-primary)", fontSize: "0.85rem",
          }}>
            Papierkorb
          </div>
          <div style={{ padding: 20 }}>
            {trashItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "var(--color-text-muted)", fontFamily: "var(--font-display)" }}>
                Papierkorb ist leer.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    {["Item-Name", "Grade", "Gelöscht am", "Läuft ab", "Aktion"].map(h => (
                      <th key={h} style={{
                        padding: "8px 12px", textAlign: "left",
                        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.65rem",
                        textTransform: "uppercase", letterSpacing: "0.08em",
                        color: "var(--color-text-muted)",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trashItems.map((item, idx) => {
                    const soon = new Date(item.expiresAt).getTime() - Date.now() < 24 * 3600 * 1000
                    return (
                      <tr
                        key={item.id}
                        style={{ background: idx % 2 === 0 ? "#141418" : "#111318" }}
                      >
                        <td style={{ padding: "10px 12px", fontFamily: "var(--font-display)", fontWeight: 600, color: GRADE_COLOR[item.template.grade] }}>
                          {item.template.name}
                          {item.count > 1 && <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", marginLeft: 6 }}>x{item.count}</span>}
                        </td>
                        <td style={{ padding: "10px 12px", fontFamily: "var(--font-display)", fontSize: "0.75rem", color: GRADE_COLOR[item.template.grade] }}>
                          {item.template.grade}
                        </td>
                        <td style={{ padding: "10px 12px", fontFamily: "var(--font-display)", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          {new Date(item.deletedAt).toLocaleDateString("de-DE")}
                        </td>
                        <td style={{ padding: "10px 12px", fontFamily: "var(--font-display)", fontSize: "0.75rem", color: soon ? "var(--color-danger)" : "var(--color-text-muted)" }}>
                          {formatCountdown(item.expiresAt)}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <button
                            onClick={() => handleOpenRestoreModal(item)}
                            style={{
                              background: "transparent",
                              border: "1px solid var(--color-primary)",
                              color: "var(--color-primary)",
                              borderRadius: 4, padding: "4px 10px",
                              fontFamily: "var(--font-display)", fontWeight: 700,
                              fontSize: "0.7rem", textTransform: "uppercase",
                              letterSpacing: "0.06em", cursor: "pointer",
                              display: "inline-flex", alignItems: "center", gap: 5,
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = "var(--color-primary)"
                              e.currentTarget.style.color = "#fff"
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = "transparent"
                              e.currentTarget.style.color = "var(--color-primary)"
                            }}
                          >
                            <RotateCcw size={11} /> Wiederherstellen
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {restoringItem && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(4px)", zIndex: 50,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
        }}>
          <div style={{
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderTop: "3px solid var(--color-success)", borderRadius: 6,
            maxWidth: 440, width: "100%", overflow: "hidden",
          }}>
            <div style={{
              padding: "16px 20px", background: "var(--color-surface-2)",
              borderBottom: "1px solid var(--color-border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--color-success)", textTransform: "uppercase" }}>
                Slot auswählen
              </span>
              <button onClick={() => setRestoringItem(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "1.25rem" }}>×</button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "0.9rem", color: "var(--color-text)", fontWeight: 600 }}>
                {restoringItem.template.name}
                <span style={{ color: "var(--color-text-muted)", fontWeight: 400, fontSize: "0.8rem", marginLeft: 8 }}>×{restoringItem.count}</span>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontFamily: "var(--font-display)", fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Zielslot wählen
                </label>
                <select
                  value={restoreSlot}
                  onChange={e => setRestoreSlot(parseInt(e.target.value, 10))}
                  style={{
                    width: "100%", padding: "9px 12px",
                    background: "var(--color-surface-2)", border: "1px solid var(--color-border)",
                    borderRadius: 4, color: "var(--color-text)",
                    fontFamily: "var(--font-display)", fontSize: "0.85rem", outline: "none",
                  }}
                >
                  {Array.from({ length: 1000 }, (_, idx) => {
                    if (itemsMap.has(idx)) return null
                    return <option key={idx} value={idx}>Slot {idx + 1} (Frei)</option>
                  })}
                </select>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setRestoringItem(null)}
                  style={{
                    flex: 1, padding: "10px 0", background: "transparent",
                    border: "1px solid var(--color-border)", borderRadius: 4,
                    color: "var(--color-text-muted)", fontFamily: "var(--font-display)",
                    fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase",
                    letterSpacing: "0.06em", cursor: "pointer",
                  }}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleConfirmRestore}
                  style={{
                    flex: 1, padding: "10px 0", background: "var(--color-success)",
                    border: "none", borderRadius: 4, color: "#fff",
                    fontFamily: "var(--font-display)", fontWeight: 700,
                    fontSize: "0.8rem", textTransform: "uppercase",
                    letterSpacing: "0.06em", cursor: "pointer",
                  }}
                >
                  Bestätigen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
