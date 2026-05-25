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
    </div>
  )
}
