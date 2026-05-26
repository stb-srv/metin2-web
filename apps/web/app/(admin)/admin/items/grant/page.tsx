"use client"

import { useState, useEffect } from "react"
import { Search, Gift, AlertCircle, Info, ShieldAlert, Sparkles, X, Swords } from "lucide-react"

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
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Load item templates
  useEffect(() => {
    fetch("/api/admin/items?limit=250")
      .then(res => res.json())
      .then(data => setItems(data.data || []))
      .catch(err => console.error("Error loading items:", err))
  }, [])

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(itemQuery.toLowerCase()) || 
    i.vnum.toString().includes(itemQuery)
  ).slice(0, 8)

  const handlePlayerSearch = async () => {
    if (searchQuery.length < 2) return
    setIsSearching(true)
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/admin/players/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (res.ok) {
        setSearchResults(data.results || [])
        if ((data.results || []).length === 0) {
          setErrorMessage("Keine Spieler oder Accounts mit diesem Namen gefunden.")
        }
      } else {
        setErrorMessage(data.error || "Fehler bei der Suche.")
      }
    } catch (err) {
      setErrorMessage("Netzwerkfehler bei der Suche.")
    } finally {
      setIsSearching(false)
    }
  }

  const handleGrantSubmit = async () => {
    if (!selectedPlayer || !selectedItem) return
    
    setIsSubmitting(true)
    setErrorMessage(null)
    setShowConfirmModal(false)

    try {
      const res = await fetch("/api/admin/items/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountName: selectedPlayer.accountName,
          itemTemplateId: selectedItem.id,
          count,
          destination,
          note
        })
      })
      
      const data = await res.json()
      if (res.ok) {
        alert("Schenkung erfolgreich durchgeführt!")
        setSelectedItem(null)
        setItemQuery("")
        setCount(1)
        setNote("")
      } else {
        setErrorMessage(data.error || "Fehler beim Ausführen der Schenkung.")
      }
    } catch (err) {
      setErrorMessage("Netzwerkfehler bei der Übermittlung der Schenkung.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const JOB_NAMES = ['Krieger', 'Ninja', 'Sura', 'Schamane', 'Krieger', 'Ninja', 'Sura', 'Schamane']
  const EMPIRE_NAMES: Record<number, string> = { 1: 'Shinsoo (Rot)', 2: 'Chunjo (Gelb)', 3: 'Jinno (Blau)' }
  
  const getEmpireBadgeColor = (empire: number) => {
    switch (empire) {
      case 1: return "bg-red-500/10 text-red-500 border-red-500/30"
      case 2: return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
      case 3: return "bg-blue-500/10 text-blue-500 border-blue-500/30"
      default: return "bg-muted/10 text-muted border-border"
    }
  }

  const getGradeColor = (grade: string) => {
    switch(grade) {
      case 'LEGENDARY': return 'text-danger font-bold drop-shadow-[0_0_5px_var(--color-danger)]'
      case 'EPIC': return 'text-primary'
      case 'RARE': return 'text-accent'
      default: return 'text-text'
    }
  }

  const getJobSymbol = (job: number) => {
    // Return emoji representation for premium fantasy feel
    switch(job % 4) {
      case 0: return '⚔️' // Warrior
      case 1: return '🏹' // Ninja
      case 2: return '🔮' // Sura
      case 3: return '🎋' // Shaman
      default: return '👤'
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6 text-text">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <h1 className="text-2xl font-display text-primary tracking-widest uppercase flex items-center gap-2">
          <Gift className="text-primary animate-pulse" /> Item Schenken
        </h1>
        <span className="bg-danger/20 text-danger border border-danger/30 text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded">
          Admin-Aktion (Protokolliert)
        </span>
      </div>

      {errorMessage && (
        <div className="bg-danger/20 border border-danger text-danger p-3.5 rounded-md flex items-start gap-3">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <div>
            <span className="font-bold">Aktion fehlgeschlagen:</span> {errorMessage}
          </div>
        </div>
      )}

      {/* 1. SPIELER AUSWÄHLEN */}
      <div className="bg-surface border border-border p-5 rounded-lg shadow-[0_0_20px_var(--color-glow)] flex flex-col gap-4">
        <h2 className="text-lg font-display text-primary tracking-wider uppercase border-b border-border/30 pb-2">
          1. Spieler auswählen
        </h2>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input 
              type="text"
              disabled={!!selectedPlayer}
              className="w-full bg-surface-2 border border-border rounded pl-10 pr-3 py-2.5 text-text focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Accountname oder Charaktername eingeben (min. 2 Zeichen)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePlayerSearch()}
            />
            <Search className="absolute left-3.5 top-3.5 text-muted" size={16} />
          </div>
          {!selectedPlayer && (
            <button 
              onClick={handlePlayerSearch}
              disabled={isSearching || searchQuery.length < 2}
              className="bg-primary/20 text-primary border border-primary/50 hover:border-primary px-5 py-2.5 rounded hover:bg-primary hover:text-bg font-semibold transition-all flex items-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
            >
              Suchen
            </button>
          )}
        </div>

        {/* Suchergebnisse */}
        {searchResults.length > 0 && !selectedPlayer && (
          <div className="grid gap-3 max-h-[300px] overflow-auto custom-scrollbar mt-2">
            {searchResults.map((acc: any) => (
              <div 
                key={acc.accountId} 
                className="bg-surface-2 border border-border hover:border-primary p-3 rounded-lg flex flex-col gap-3 cursor-pointer transition-colors shadow-sm"
                onClick={() => setSelectedPlayer(acc)}
              >
                <div className="flex justify-between items-center border-b border-border/20 pb-1.5">
                  <span className="font-bold text-accent font-mono">Account: {acc.accountName}</span>
                  <span className="text-[10px] text-muted">ID: {acc.accountId}</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {acc.characters.map((char: any) => (
                    <div 
                      key={char.id} 
                      className={`flex items-center gap-2 px-3 py-2 rounded border ${getEmpireBadgeColor(char.empire)}`}
                    >
                      <span className="text-sm shrink-0">{getJobSymbol(char.job)}</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold font-display uppercase tracking-wide">{char.name}</span>
                        <span className="text-[10px] opacity-75">
                          Lv.{char.level} {JOB_NAMES[char.job]} {char.guildName ? `| [${char.guildName}]` : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                  {acc.characters.length === 0 && (
                    <span className="text-xs text-muted italic">Keine Charaktere auf diesem Account</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gewählter Spieler */}
        {selectedPlayer && (
          <div className="bg-bg border-2 border-primary/50 p-4 rounded-lg flex justify-between items-center shadow-[0_0_15px_rgba(200,168,75,0.1)]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded bg-surface-2 border border-primary/30 flex items-center justify-center text-2xl">
                🛡️
              </div>
              <div>
                <div className="text-[10px] text-muted uppercase font-bold tracking-widest">Ausgewählter Account</div>
                <div className="text-xl font-bold text-primary font-mono">{selectedPlayer.accountName}</div>
                <div className="text-xs text-text mt-0.5">
                  ID: {selectedPlayer.accountId} • {selectedPlayer.characters.length} Charaktere
                </div>
              </div>
            </div>
            <button 
              onClick={() => { setSelectedPlayer(null); setSearchResults([]); setSearchQuery(""); }}
              className="text-xs text-muted hover:text-danger hover:underline font-medium transition-colors"
            >
              Spieler wechseln
            </button>
          </div>
        )}
      </div>

      {/* 2. ITEM DETAILS & SENDEN */}
      {selectedPlayer && (
        <div className="bg-surface border border-border p-5 rounded-lg shadow-[0_0_20px_var(--color-glow)] flex flex-col gap-5">
          <h2 className="text-lg font-display text-primary tracking-wider uppercase border-b border-border/30 pb-2">
            2. Item Details & Schenkung
          </h2>
          
          <div className="grid md:grid-cols-2 gap-5">
            {/* Item-Suche Autocomplete */}
            <div className="relative">
              <label className="block text-xs text-muted font-bold uppercase tracking-wider mb-1.5">Item suchen</label>
              <input 
                type="text"
                className="w-full bg-surface-2 border border-border rounded px-3 py-2.5 text-text focus:outline-none focus:border-primary"
                placeholder="Name oder VNUM eingeben..."
                value={itemQuery}
                onChange={(e) => { setItemQuery(e.target.value); setSelectedItem(null); }}
              />
              
              {!selectedItem && itemQuery && (
                <div className="absolute z-10 w-full bg-surface-2 border border-border rounded-b shadow-xl max-h-[220px] overflow-auto custom-scrollbar mt-1">
                  {filteredItems.map(item => (
                    <div 
                      key={item.id} 
                      className="p-3 hover:bg-surface border-b border-border/20 cursor-pointer flex gap-3 items-center justify-between transition-colors"
                      onClick={() => { setSelectedItem(item); setItemQuery(item.name); }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="hex-icon w-8 h-8 flex items-center justify-center bg-surface-2">
                          {item.iconUrl ? (
                            <img src={item.iconUrl} alt="icon" className="w-6 h-6 object-contain" />
                          ) : (
                            <span className="text-[8px] text-muted">VNUM</span>
                          )}
                        </div>
                        <span className={`text-sm ${getGradeColor(item.grade)}`}>{item.name}</span>
                      </div>
                      <span className="text-xs text-muted font-mono">({item.vnum})</span>
                    </div>
                  ))}
                  {filteredItems.length === 0 && (
                    <div className="p-3 text-center text-muted text-xs">Keine Items gefunden</div>
                  )}
                </div>
              )}

              {selectedItem && (
                <div className="flex items-center gap-3 bg-bg/50 border border-success/30 p-2.5 rounded mt-2.5 shadow-sm">
                  <div className={`hex-icon w-10 h-10 flex items-center justify-center bg-surface-2 border border-success/40 ${selectedItem.grade === 'LEGENDARY' ? 'animate-rainbow-glow' : ''}`}>
                     {selectedItem.iconUrl ? (
                       <img src={selectedItem.iconUrl} alt="icon" className="w-7 h-7 object-contain" />
                     ) : (
                       <span className="text-[10px] text-muted">{selectedItem.vnum}</span>
                     )}
                  </div>
                  <div>
                    <div className={`text-sm font-bold ${getGradeColor(selectedItem.grade)}`}>{selectedItem.name}</div>
                    <div className="text-[10px] text-muted">VNUM: {selectedItem.vnum} • Typ: {selectedItem.itemType}</div>
                  </div>
                  <button 
                    onClick={() => { setSelectedItem(null); setItemQuery(""); }} 
                    className="ml-auto p-1 text-muted hover:text-danger rounded"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Anzahl */}
            <div>
              <label className="block text-xs text-muted font-bold uppercase tracking-wider mb-1.5">Anzahl</label>
              <input 
                type="number"
                min="1"
                className="w-full bg-surface-2 border border-border rounded px-3 py-2.5 text-text focus:outline-none focus:border-primary"
                value={count}
                onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <span className="text-[10px] text-muted mt-1 block">Min. 1 Stück.</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mt-2">
            {/* Ziel-Lager */}
            <div>
              <label className="block text-xs text-muted font-bold uppercase tracking-wider mb-2">Ziel-Lager</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDestination("web")}
                  className={`px-3 py-3 border rounded text-xs font-bold transition-all text-center flex flex-col gap-1 items-center justify-center
                    ${destination === "web" 
                      ? "border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(200,168,75,0.15)]" 
                      : "border-border bg-surface-2 text-muted hover:text-text hover:border-border-2"
                    }`}
                >
                  <span className="text-sm">🌐 Web-Lager</span>
                  <span className="text-[9px] opacity-75 font-normal">Sicher im CMS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDestination("ingame")}
                  className={`px-3 py-3 border rounded text-xs font-bold transition-all text-center flex flex-col gap-1 items-center justify-center
                    ${destination === "ingame" 
                      ? "border-primary bg-primary/10 text-primary shadow-[0_0_10px_rgba(200,168,75,0.15)]" 
                      : "border-border bg-surface-2 text-muted hover:text-text hover:border-border-2"
                    }`}
                >
                  <span className="text-sm">🎮 Ingame-Lager</span>
                  <span className="text-[9px] opacity-75 font-normal">Über item_award</span>
                </button>
              </div>
            </div>

            {/* Audit-Notiz */}
            <div>
              <label className="block text-xs text-muted font-bold uppercase tracking-wider mb-1.5">Notiz / Grund (Pflicht)</label>
              <textarea 
                className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-text focus:outline-none focus:border-primary text-sm h-[74px] resize-none"
                placeholder="z.B. Gewinnspiel-Belohnung, Ausgleich für Bug, Event-Preise..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end border-t border-border/20 pt-4">
            <button 
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting || !selectedItem || !note.trim()}
              className="bg-primary/20 text-primary border border-primary/50 px-6 py-3 rounded hover:bg-primary hover:text-bg font-display uppercase tracking-widest text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(200,168,75,0.1)] hover:shadow-[0_0_20px_rgba(200,168,75,0.2)]"
            >
              Geschenk vorbereiten
            </button>
          </div>
        </div>
      )}

      {/* STYLISH CONFIRMATION MODAL */}
      {showConfirmModal && selectedPlayer && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="bg-surface border-2 border-primary rounded-lg shadow-[0_0_40px_rgba(200,168,75,0.3)] p-6 max-w-md w-full mx-4 flex flex-col gap-5 animate-scale-in text-text">
            <div className="flex items-center gap-2 text-primary border-b border-border/30 pb-3">
              <ShieldAlert size={22} className="animate-bounce" />
              <h3 className="font-display text-lg tracking-wider uppercase">
                Schenkung bestätigen
              </h3>
            </div>

            <div className="bg-danger/10 border border-danger/20 text-danger p-3 rounded text-xs flex gap-2">
              <Info size={16} className="shrink-0 mt-0.5" />
              <span>
                Diese Aktion ist administrativ und wird unwiderruflich im Audit-Log vermerkt. Missbrauch wird sanktioniert.
              </span>
            </div>

            <div className="flex flex-col gap-3 bg-surface-2/40 p-4 rounded border border-border/30 text-sm">
              <div className="flex justify-between border-b border-border/10 pb-1.5">
                <span className="text-muted">Empfänger:</span>
                <span className="font-bold text-accent font-mono">{selectedPlayer.accountName}</span>
              </div>
              <div className="flex justify-between border-b border-border/10 pb-1.5">
                <span className="text-muted">Gegenstand:</span>
                <span className={`font-semibold ${getGradeColor(selectedItem.grade)}`}>{selectedItem.name}</span>
              </div>
              <div className="flex justify-between border-b border-border/10 pb-1.5">
                <span className="text-muted">Anzahl:</span>
                <span className="font-bold text-primary">{count} Stück</span>
              </div>
              <div className="flex justify-between border-b border-border/10 pb-1.5">
                <span className="text-muted">Ziel-Ort:</span>
                <span className="uppercase text-xs font-semibold px-2 py-0.5 rounded bg-surface border border-border/50">
                  {destination === "web" ? "🌐 Web-Lager" : "🎮 Ingame (item_award)"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-muted">Grund / Notiz:</span>
                <span className="bg-bg/60 p-2 rounded text-xs text-muted border border-border/10 italic">
                  {note || "-"}
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-border rounded text-xs hover:bg-surface-2 transition-colors text-muted hover:text-text"
              >
                Abbrechen
              </button>
              <button
                onClick={handleGrantSubmit}
                className="px-5 py-2 bg-primary hover:bg-primary/95 text-bg font-semibold rounded text-xs transition-colors shadow-[0_0_15px_rgba(200,168,75,0.2)] flex items-center gap-1.5"
              >
                Schenkung ausführen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
