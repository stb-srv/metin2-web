"use client"

import { useRef, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { ItemTooltip } from "./ItemTooltip"
import { Trash2, RotateCcw } from "lucide-react"

export function TrashGrid({ trashItems, onUpdate }: { trashItems: any[], onUpdate: () => void }) {
  const COLUMNS = 10
  const TOTAL_SLOTS = 128
  const ROWS = Math.ceil(TOTAL_SLOTS / COLUMNS)

  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: ROWS,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64,
    overscan: 5,
  })

  const [hoveredItem, setHoveredItem] = useState<{ item: any, x: number, y: number } | null>(null)

  const handleEmptyTrash = async () => {
    if (confirm("Möchtest du den gesamten Papierkorb endgültig leeren? Dies kann nicht rückgängig gemacht werden!")) {
      const res = await fetch("/api/modules/web-storage/trash", { method: "DELETE" })
      if (res.ok) onUpdate()
    }
  }

  const handleRestore = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation()
    const res = await fetch(`/api/modules/web-storage/trash/${item.id}/restore`, { method: "POST" })
    if (res.ok) onUpdate()
    else alert("Fehler: " + (await res.json()).error)
  }

  const handleDelete = async (e: React.MouseEvent, item: any) => {
    e.stopPropagation()
    if (confirm(`Möchtest du ${item.template.name} endgültig löschen?`)) {
      const res = await fetch(`/api/modules/web-storage/trash/${item.id}`, { method: "DELETE" })
      if (res.ok) onUpdate()
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-2">
      <div className="flex justify-end">
        <button 
          onClick={handleEmptyTrash}
          className="flex items-center gap-2 px-3 py-1.5 bg-danger/20 text-danger border border-danger hover:bg-danger hover:text-white transition-colors rounded text-sm uppercase tracking-widest font-display"
        >
          <Trash2 size={16} /> Papierkorb leeren
        </button>
      </div>
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

                  const item = trashItems[slotIndex]

                  return (
                    <div
                      key={slotIndex}
                      className="w-14 h-14 relative flex items-center justify-center border border-border/30 bg-surface-2/30"
                    >
                      {item && (
                        <div
                          onMouseEnter={(e) => setHoveredItem({ item, x: e.clientX, y: e.clientY })}
                          onMouseMove={(e) => setHoveredItem({ item, x: e.clientX, y: e.clientY })}
                          onMouseLeave={() => setHoveredItem(null)}
                          className="hex-icon w-12 h-12 flex items-center justify-center opacity-50 grayscale sepia group relative"
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

                          {/* Action Overlay */}
                          <div className="absolute inset-0 bg-bg/80 hidden group-hover:flex flex-col items-center justify-center gap-1 z-10">
                            <button onClick={(e) => handleRestore(e, item)} className="text-success hover:scale-110 transition-transform" title="Wiederherstellen">
                              <RotateCcw size={16} />
                            </button>
                            <button onClick={(e) => handleDelete(e, item)} className="text-danger hover:scale-110 transition-transform" title="Endgültig löschen">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
        {hoveredItem && <ItemTooltip item={hoveredItem.item} x={hoveredItem.x} y={hoveredItem.y} isTrash />}
      </div>
    </div>
  )
}
