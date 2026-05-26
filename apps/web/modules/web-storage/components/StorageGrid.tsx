"use client"

import { useRef, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { ItemTooltip } from "./ItemTooltip"

export function StorageGrid({ storage, onUpdate }: { storage: any, onUpdate: () => void }) {
  const COLUMNS = 10
  const TOTAL_SLOTS = storage.maxSlots || 1000
  const ROWS = Math.ceil(TOTAL_SLOTS / COLUMNS)

  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: ROWS,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // 64px height per row
    overscan: 5,
  })

  // Map slots for easy access
  const itemsBySlot = new Map()
  storage.items?.forEach((item: any) => {
    itemsBySlot.set(item.slot, item)
  })

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [hoveredItem, setHoveredItem] = useState<{ item: any, x: number, y: number } | null>(null)

  const [transferItem, setTransferItem] = useState<any | null>(null)
  const [transferCount, setTransferCount] = useState<number>(1)
  const [transferring, setTransferring] = useState<boolean>(false)
  const [transferError, setTransferError] = useState<string | null>(null)

  const handleItemClick = (item: any) => {
    setTransferItem(item)
    setTransferCount(item.count)
    setTransferError(null)
  }

  const executeTransfer = async () => {
    if (!transferItem) return
    setTransferring(true)
    setTransferError(null)

    try {
      const res = await fetch("/api/storage/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storageItemId: transferItem.id,
          count: transferCount
        })
      })

      const data = await res.json()
      if (res.ok) {
        setTransferItem(null)
        onUpdate()
      } else {
        setTransferError(data.error || "Ein unbekannter Fehler ist aufgetreten.")
      }
    } catch (err) {
      setTransferError("Netzwerkfehler beim Senden des Transfers.")
    } finally {
      setTransferring(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItemId(itemId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, targetSlot: number) => {
    e.preventDefault()
    if (!draggedItemId) return

    const res = await fetch("/api/modules/web-storage/slots", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draggedItemId, targetSlot })
    })

    if (res.ok) {
      onUpdate()
    }
    setDraggedItemId(null)
  }

  const handleContextMenu = async (e: React.MouseEvent, item: any) => {
    e.preventDefault()
    if (confirm(`Möchtest du ${item.template.name} in den Papierkorb verschieben?`)) {
      const res = await fetch(`/api/modules/web-storage/items/${item.id}`, { method: "DELETE" })
      if (res.ok) onUpdate()
      else alert("Fehler: " + (await res.json()).error)
    }
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-auto bg-bg border border-border p-2 rounded-md custom-scrollbar relative">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          return (
            <div
              key={virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="flex justify-center gap-2 mb-2"
            >
              {Array.from({ length: COLUMNS }).map((_, colIndex) => {
                const slotIndex = virtualRow.index * COLUMNS + colIndex
                if (slotIndex >= TOTAL_SLOTS) return null

                const item = itemsBySlot.get(slotIndex)

                return (
                  <div
                    key={slotIndex}
                    className="w-14 h-14 relative flex items-center justify-center border-dashed border-2 border-border/50 rounded bg-surface-2/50"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, slotIndex)}
                  >
                    {item && (
                      <div
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onContextMenu={(e) => handleContextMenu(e, item)}
                        onClick={() => handleItemClick(item)}
                        onMouseEnter={(e) => setHoveredItem({ item, x: e.clientX, y: e.clientY })}
                        onMouseMove={(e) => setHoveredItem({ item, x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={`hex-icon w-12 h-12 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 
                          ${item.template.grade === 'RARE' ? 'shadow-[0_0_10px_var(--color-accent)] border-accent' : ''}
                          ${item.template.grade === 'EPIC' ? 'shadow-[0_0_15px_var(--color-primary)] border-primary' : ''}
                          ${item.template.grade === 'LEGENDARY' ? 'animate-rainbow-glow border-danger' : ''}
                        `}
                      >
                        {item.template.iconUrl ? (
                          <img src={item.template.iconUrl} alt={item.template.name} className="w-8 h-8 object-contain" />
                        ) : (
                          <span className="text-xs text-muted">{item.template.vnum}</span>
                        )}
                        {item.count > 1 && (
                          <span className="absolute bottom-0 right-0 text-[10px] bg-bg px-1 rounded text-primary border border-border">
                            {item.count}
                          </span>
                        )}
                      </div>
                    )}
                    <span className="absolute top-0 left-0 text-[8px] text-muted/30 p-0.5 select-none pointer-events-none">{slotIndex}</span>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      {hoveredItem && <ItemTooltip item={hoveredItem.item} x={hoveredItem.x} y={hoveredItem.y} />}

      {transferItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-lg shadow-[0_0_30px_var(--color-glow)] p-6 max-w-sm w-full mx-4 flex flex-col gap-4 animate-scale-in text-text">
            <div>
              <h3 className="font-display text-xl text-primary tracking-wider uppercase border-b border-border pb-2">
                Ins Ingame-Lager senden
              </h3>
            </div>
            
            <div className="flex items-center gap-4 bg-surface-2/40 p-3 rounded-md border border-border/20">
              <div className="hex-icon w-12 h-12 flex items-center justify-center">
                {transferItem.template.iconUrl ? (
                  <img src={transferItem.template.iconUrl} alt={transferItem.template.name} className="w-8 h-8 object-contain" />
                ) : (
                  <span className="text-[10px] text-muted">{transferItem.template.vnum}</span>
                )}
              </div>
              <div>
                <div className="font-display text-text uppercase tracking-wide text-sm">{transferItem.template.name}</div>
                <div className="text-muted text-xs">Im Web-Lager vorhanden: {transferItem.count}</div>
              </div>
            </div>

            {transferError && (
              <div className="bg-danger/10 border border-danger/30 text-danger text-xs p-2 rounded-md">
                {transferError}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="transfer-count" className="text-xs text-muted font-medium">
                Anzahl zu transferieren:
              </label>
              <input
                id="transfer-count"
                type="number"
                min={1}
                max={transferItem.count}
                value={transferCount}
                onChange={(e) => setTransferCount(Math.min(transferItem.count, Math.max(1, parseInt(e.target.value) || 1)))}
                disabled={transferring}
                className="bg-surface-2 border border-border rounded px-3 py-2 text-text text-sm focus:outline-none focus:border-primary disabled:opacity-50"
              />
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setTransferItem(null)}
                disabled={transferring}
                className="px-4 py-2 border border-border rounded text-xs hover:bg-surface-2 transition-colors text-muted hover:text-text disabled:opacity-50"
              >
                Abbrechen
              </button>
              <button
                onClick={executeTransfer}
                disabled={transferring || transferCount < 1 || transferCount > transferItem.count}
                className="px-4 py-2 bg-primary hover:bg-primary/95 text-bg font-semibold rounded text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-[0_0_10px_rgba(200,168,75,0.2)]"
              >
                {transferring ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-bg border-t-transparent animate-spin inline-block" />
                    Sende...
                  </>
                ) : (
                  "Transferieren"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
