"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

export function ItemTooltip({ item, x, y, isTrash = false }: { item: any, x: number, y: number, isTrash?: boolean }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const getGradeColor = (grade: string) => {
    switch(grade) {
      case 'LEGENDARY': return 'text-danger font-bold drop-shadow-[0_0_5px_var(--color-danger)]'
      case 'EPIC': return 'text-primary'
      case 'RARE': return 'text-accent'
      default: return 'text-text'
    }
  }

  const getExpiresText = () => {
    if (!item.expiresAt) return null
    const diff = new Date(item.expiresAt).getTime() - new Date().getTime()
    if (diff <= 0) return "Abgelaufen"
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    const isUrgent = diff < 24 * 60 * 60 * 1000
    
    return (
      <div className={`mt-2 text-xs font-bold ${isUrgent ? 'text-danger' : 'text-warning'}`}>
        Läuft ab in {days} Tagen {hours} Stunden
      </div>
    )
  }

  const tooltipContent = (
    <div 
      className="fixed z-50 bg-surface-2 border border-border shadow-[0_0_15px_var(--color-glow)] p-3 min-w-[200px] pointer-events-none rounded"
      style={{ left: x + 15, top: y + 15 }}
    >
      <div className={`font-display text-lg uppercase tracking-wider ${getGradeColor(item.template.grade)}`}>
        {item.template.name}
      </div>
      <div className="text-muted text-xs mb-2">{item.template.itemType}</div>
      
      {item.template.attributes && Object.keys(item.template.attributes).length > 0 && (
        <div className="text-sm mt-2 flex flex-col gap-1">
          {Object.entries(item.template.attributes).map(([k, v]) => (
            <div key={k} className="text-text"><span className="text-primary">{k}:</span> {String(v)}</div>
          ))}
        </div>
      )}

      {item.enchants && Object.keys(item.enchants).length > 0 && (
        <div className="text-sm mt-2 flex flex-col gap-1 border-t border-border/50 pt-2">
          {Object.entries(item.enchants).map(([k, v]) => (
            <div key={k} className="text-accent"><span className="text-primary">{k}:</span> {String(v)}</div>
          ))}
        </div>
      )}

      <div className="mt-2 flex justify-between text-xs text-muted border-t border-border/50 pt-2">
        <span>Anzahl:</span>
        <span className="text-text">{item.count}</span>
      </div>

      {isTrash && getExpiresText()}
    </div>
  )

  return createPortal(tooltipContent, document.body)
}
