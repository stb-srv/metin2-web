"use client"

import { useState, useEffect } from "react"
import { webStorageConfig } from "./module.config"
import { StorageGrid } from "./components/StorageGrid"
import { TrashGrid } from "./components/TrashGrid"
import { AlertCircle } from "lucide-react"

export default function WebStorageModule() {
  const [activeTab, setActiveTab] = useState<"storage" | "trash">("storage")
  const [storageData, setStorageData] = useState<any>(null)
  const [trashData, setTrashData] = useState<any[]>([])

  const fetchStorage = async () => {
    const res = await fetch("/api/modules/web-storage")
    if (res.ok) setStorageData(await res.json())
  }

  const fetchTrash = async () => {
    const res = await fetch("/api/modules/web-storage/trash")
    if (res.ok) setTrashData(await res.json())
  }

  useEffect(() => {
    fetchStorage()
    fetchTrash()
  }, [])

  if (!webStorageConfig.enabled) return null
  if (!storageData) return <div>Loading Web-Lager...</div>

  const storageItemsCount = storageData.items?.length || 0
  const maxStorageSlots = storageData.maxSlots || 1000
  const trashItemsCount = trashData.length || 0
  const maxTrashSlots = 128

  const storageFillRatio = storageItemsCount / maxStorageSlots
  const storageBarColor = storageFillRatio >= 0.95 ? "bg-danger" : storageFillRatio >= 0.8 ? "bg-warning" : "bg-success"

  const trashFillRatio = trashItemsCount / maxTrashSlots
  const trashBarColor = trashFillRatio >= 0.95 ? "bg-danger" : trashFillRatio >= 0.8 ? "bg-warning" : "bg-success"

  return (
    <div className="flex flex-col h-full bg-surface text-text rounded-md border border-border p-4 gap-4">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <h2 className="font-display text-2xl text-primary">{webStorageConfig.name}</h2>
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("storage")}
            className={`px-4 py-2 font-display uppercase tracking-widest text-sm transition-colors ${activeTab === "storage" ? "text-primary border-b-2 border-primary" : "text-muted hover:text-text"}`}
          >
            Lager ({storageItemsCount}/{maxStorageSlots})
          </button>
          <button
            onClick={() => setActiveTab("trash")}
            className={`px-4 py-2 font-display uppercase tracking-widest text-sm transition-colors ${activeTab === "trash" ? "text-primary border-b-2 border-primary" : "text-muted hover:text-text"}`}
          >
            Papierkorb ({trashItemsCount}/{maxTrashSlots})
          </button>
        </div>
      </div>

      {trashItemsCount >= maxTrashSlots && (
        <div className="bg-danger/20 border border-danger text-danger p-3 rounded-md flex items-center gap-2">
          <AlertCircle size={18} />
          <span>Dein Papierkorb ist voll! Du kannst keine weiteren Items löschen, bis du Platz machst.</span>
        </div>
      )}

      {activeTab === "storage" && (
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
            <div className={`h-full ${storageBarColor}`} style={{ width: `${storageFillRatio * 100}%` }} />
          </div>
          <StorageGrid 
            storage={storageData} 
            onUpdate={() => { fetchStorage(); fetchTrash(); }} 
          />
        </div>
      )}

      {activeTab === "trash" && (
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <div className="h-2 w-full bg-surface-2 rounded-full overflow-hidden">
            <div className={`h-full ${trashBarColor}`} style={{ width: `${trashFillRatio * 100}%` }} />
          </div>
          <TrashGrid 
            trashItems={trashData} 
            onUpdate={() => { fetchStorage(); fetchTrash(); }} 
          />
        </div>
      )}
    </div>
  )
}
