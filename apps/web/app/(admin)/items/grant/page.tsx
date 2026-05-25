"use client"

import { useState, useEffect } from "react"
import { Search, Gift, AlertCircle, Info } from "lucide-react"

export default function ItemGrantPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null)

  const [itemQuery, setItemQuery] = useState("")
  const [items, setItems] = useState<any[]>([])
  const [selectedItem, setSelectedItem] = useState<any>(null)

  const [count, setCount] = useState(1)
  const [destination, setDestination] = useState<"ingame" | "web">("web")
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetch("/api/admin/items?limit=100")
      .then(res => res.json())
      .then(data => setItems(data.data || []))
  }, [])

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(itemQuery.toLowerCase()) || 
    i.vnum.toString().includes(itemQuery)
  ).slice(0, 5)

  const handlePlayerSearch = async () => {
    if (searchQuery.length < 2) return
    setIsSearching(true)
    try {
      const res = await fetch(`/api/admin/players/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (res.ok) setSearchResults(data.results || [])
      else alert(data.error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleGrant = async () => {
    if (!selectedPlayer || !selectedItem) return
    
    if (!confirm(`Möchtest du ${count}x ${selectedItem.name} an ${selectedPlayer.accountName} senden?`)) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin/items/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountName: selectedPlayer.accountName,
          accountId: selectedPlayer.accountId,
          itemTemplateId: selectedItem.id,
          count,
          destination,
          note
        })
      })
      const data = await res.json()
      if (res.ok) {
        alert("Item erfolgreich geschenkt!")
        setSelectedItem(null)
        setItemQuery("")
        setCount(1)
        setNote("")
      } else {
        alert("Fehler: " + data.error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const JOB_NAMES = ['Krieger', 'Assassine', 'Sura', 'Schamane', 'Krieger', 'Assassine', 'Sura', 'Schamane']
  const EMPIRE_NAMES: Record<number, string> = { 1: 'Shinsoo', 2: 'Chunjo', 3: 'Jinno' }

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-display text-primary flex items-center gap-2">
        <Gift /> Item Schenken
      </h1>

      <div className="bg-surface border border-border p-4 rounded-md">
        <h2 className="text-xl font-display mb-4 text-text">1. Spieler auswählen</h2>
        <div className="flex gap-2 mb-4">
          <input 
            type="text"
            className="flex-1 bg-bg border border-border rounded px-3 py-2 text-text"
            placeholder="Accountname oder Charaktername suchen (min 2 Zeichen)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePlayerSearch()}
          />
          <button 
            onClick={handlePlayerSearch}
            disabled={isSearching}
            className="bg-primary/20 text-primary border border-primary px-4 py-2 rounded hover:bg-primary hover:text-white transition-colors flex items-center gap-2"
          >
            <Search size={18} /> Suchen
          </button>
        </div>

        {searchResults.length > 0 && !selectedPlayer && (
          <div className="grid gap-2 max-h-[300px] overflow-auto custom-scrollbar">
            {searchResults.map((acc: any) => (
              <div 
                key={acc.accountId} 
                className="bg-bg border border-border p-3 rounded flex flex-col gap-2 cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedPlayer(acc)}
              >
                <div className="font-bold text-accent">Account: {acc.accountName}</div>
                <div className="flex flex-wrap gap-2">
                  {acc.characters.map((char: any) => (
                    <div key={char.id} className="bg-surface-2 text-xs p-2 rounded border border-border/50">
                      <span className="text-primary font-bold">{char.name}</span>
                      <span className="text-muted ml-1">
                        (Lv.{char.level} {JOB_NAMES[char.job]} | {EMPIRE_NAMES[char.empire]} {char.guildName ? `| ${char.guildName}` : ''})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedPlayer && (
          <div className="bg-bg border border-primary p-4 rounded flex justify-between items-center">
            <div>
              <div className="text-sm text-muted">Ausgewählter Account</div>
              <div className="text-xl font-bold text-primary">{selectedPlayer.accountName}</div>
              <div className="text-sm mt-1 text-text">
                {selectedPlayer.characters.length} Charaktere gefunden
              </div>
            </div>
            <button 
              onClick={() => setSelectedPlayer(null)}
              className="text-xs text-muted hover:text-danger underline"
            >
              Auswahl aufheben
            </button>
          </div>
        )}
      </div>

      {selectedPlayer && (
        <div className="bg-surface border border-border p-4 rounded-md flex flex-col gap-4">
          <h2 className="text-xl font-display text-text">2. Item Details</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1">Item suchen</label>
              <input 
                type="text"
                className="w-full bg-bg border border-border rounded px-3 py-2 text-text mb-2"
                placeholder="Name oder VNUM..."
                value={itemQuery}
                onChange={(e) => { setItemQuery(e.target.value); setSelectedItem(null); }}
              />
              {!selectedItem && itemQuery && (
                <div className="bg-bg border border-border rounded max-h-[150px] overflow-auto custom-scrollbar">
                  {filteredItems.map(item => (
                    <div 
                      key={item.id} 
                      className="p-2 hover:bg-surface-2 cursor-pointer flex gap-2 items-center"
                      onClick={() => { setSelectedItem(item); setItemQuery(item.name); }}
                    >
                      {item.iconUrl && <img src={item.iconUrl} alt="icon" className="w-6 h-6 object-contain" />}
                      <span>{item.name} <span className="text-muted text-xs">({item.vnum})</span></span>
                    </div>
                  ))}
                </div>
              )}
              {selectedItem && (
                <div className="flex items-center gap-2 text-success mt-2">
                  <div className={`hex-icon w-8 h-8 flex items-center justify-center bg-surface-2 ${selectedItem.grade === 'LEGENDARY' ? 'animate-rainbow-glow' : ''}`}>
                     {selectedItem.iconUrl && <img src={selectedItem.iconUrl} alt="icon" className="w-6 h-6 object-contain" />}
                  </div>
                  <span>{selectedItem.name} ausgewählt</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm text-muted mb-1">Anzahl</label>
              <input 
                type="number"
                min="1"
                className="w-full bg-bg border border-border rounded px-3 py-2 text-text"
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-muted mb-1">Ziel-Lager</label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="dest" checked={destination === "web"} onChange={() => setDestination("web")} />
                  <span>Web-Lager (Sicher)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="dest" checked={destination === "ingame"} onChange={() => setDestination("ingame")} />
                  <span>Ingame-Lager (Item-Award)</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm text-muted mb-1">Audit-Notiz (Pflicht bei Events etc.)</label>
              <input 
                type="text"
                className="w-full bg-bg border border-border rounded px-3 py-2 text-text"
                placeholder="Grund für das Geschenk..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button 
              onClick={handleGrant}
              disabled={isSubmitting || !selectedItem}
              className="bg-primary/20 text-primary border border-primary px-6 py-2 rounded hover:bg-primary hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-display uppercase tracking-widest"
            >
              {isSubmitting ? "Wird gesendet..." : "Item Schenken"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
