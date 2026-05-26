"use client"

import { useState, useEffect } from "react"
import { Download, History, Search, X, ArrowLeft, ArrowRight, Calendar } from "lucide-react"

export default function GrantLogPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Pagination State
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Filter Input States
  const [filterAdmin, setFilterAdmin] = useState("")
  const [filterPlayer, setFilterPlayer] = useState("")
  const [filterStartDate, setFilterStartDate] = useState("")
  const [filterEndDate, setFilterEndDate] = useState("")
  
  // Applied Filter States
  const [appliedAdmin, setAppliedAdmin] = useState("")
  const [appliedPlayer, setAppliedPlayer] = useState("")
  const [appliedStartDate, setAppliedStartDate] = useState("")
  const [appliedEndDate, setAppliedEndDate] = useState("")

  const fetchLogs = async (pageNum = 1) => {
    setLoading(true)
    let url = `/api/admin/items/grant-log?page=${pageNum}&limit=15`
    if (appliedAdmin) url += `&admin=${encodeURIComponent(appliedAdmin)}`
    if (appliedPlayer) url += `&player=${encodeURIComponent(appliedPlayer)}`
    if (appliedStartDate) url += `&startDate=${encodeURIComponent(appliedStartDate)}`
    if (appliedEndDate) url += `&endDate=${encodeURIComponent(appliedEndDate)}`

    try {
      const res = await fetch(url)
      const data = await res.json()
      if (res.ok) {
        setLogs(data.data || [])
        setPage(data.pagination.page)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      }
    } catch (err) {
      console.error("Error loading grant logs:", err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch logs on filter change
  useEffect(() => {
    fetchLogs(1)
  }, [appliedAdmin, appliedPlayer, appliedStartDate, appliedEndDate])

  // Trigger manual refresh or page change
  const handlePageChange = (newPageNum: number) => {
    if (newPageNum < 1 || newPageNum > totalPages) return
    fetchLogs(newPageNum)
  }

  const handleApplyFilters = () => {
    setAppliedAdmin(filterAdmin)
    setAppliedPlayer(filterPlayer)
    setAppliedStartDate(filterStartDate)
    setAppliedEndDate(filterEndDate)
  }

  const handleResetFilters = () => {
    setFilterAdmin("")
    setFilterPlayer("")
    setFilterStartDate("")
    setFilterEndDate("")
    setAppliedAdmin("")
    setAppliedPlayer("")
    setAppliedStartDate("")
    setAppliedEndDate("")
  }

  const handleCSVExport = async () => {
    setLoading(true)
    let url = `/api/admin/items/grant-log?page=1&limit=1000`
    if (appliedAdmin) url += `&admin=${encodeURIComponent(appliedAdmin)}`
    if (appliedPlayer) url += `&player=${encodeURIComponent(appliedPlayer)}`
    if (appliedStartDate) url += `&startDate=${encodeURIComponent(appliedStartDate)}`
    if (appliedEndDate) url += `&endDate=${encodeURIComponent(appliedEndDate)}`

    try {
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error("CSV Fetch failed")
      
      const exportLogs = data.data || []
      if (exportLogs.length === 0) {
        alert("Keine Logs für den CSV-Export unter diesen Filterkriterien vorhanden.")
        return
      }

      const headers = ["ID", "Zeitstempel", "Admin Name", "Spieler Account", "Spieler Account-ID", "Gegenstand Name", "VNUM", "Anzahl", "Zielort", "Notiz"]
      const rows = exportLogs.map((l: any) => [
        l.id,
        new Date(l.grantedAt).toLocaleString("de-DE"),
        l.admin?.name || "Unbekannt",
        l.accountName || "Unknown",
        l.accountId,
        l.itemTemplate?.name || "Unbekannt",
        l.itemTemplate?.vnum || "0",
        l.count,
        l.destination.toUpperCase(),
        `"${(l.note || "").replace(/"/g, '""')}"`
      ])

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n")
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `item-grant-log-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error(err)
      alert("Fehler beim Erstellen der CSV-Datei.")
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (note: string | null) => {
    if (note && note.startsWith("FAILED:")) {
      return (
        <span className="inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-danger/10 text-danger border border-danger/20">
          Fehler
        </span>
      )
    }
    return (
      <span className="inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-success/10 text-success border border-success/20">
        Erfolg
      </span>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6 text-text">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <h1 className="text-2xl font-display text-primary tracking-widest uppercase flex items-center gap-2">
          <History /> Item Grant Audit-Log
        </h1>
        <button 
          onClick={handleCSVExport}
          disabled={logs.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-surface-2 border border-border hover:border-primary text-text hover:text-primary transition-all rounded text-sm disabled:opacity-50 disabled:pointer-events-none"
        >
          <Download size={16} /> CSV Export ({total} Einträge)
        </button>
      </div>

      {/* FILTERBAR */}
      <div className="bg-surface border border-border p-4 rounded-lg shadow-[0_0_15px_var(--color-glow)] flex flex-col gap-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Admin</label>
            <input 
              type="text"
              placeholder="Admin-Name..."
              className="w-full bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
              value={filterAdmin}
              onChange={(e) => setFilterAdmin(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Spieler (Name/ID)</label>
            <input 
              type="text"
              placeholder="Spieler-Name..."
              className="w-full bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary"
              value={filterPlayer}
              onChange={(e) => setFilterPlayer(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Startdatum</label>
            <input 
              type="date"
              className="w-full bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary cursor-pointer"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] text-muted font-bold uppercase tracking-wider mb-1">Enddatum</label>
            <input 
              type="date"
              className="w-full bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text focus:outline-none focus:border-primary cursor-pointer"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end border-t border-border/10 pt-2 mt-1">
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-muted hover:text-text rounded text-xs transition-colors"
          >
            <X size={14} /> Zurücksetzen
          </button>
          <button
            onClick={handleApplyFilters}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary/20 text-primary border border-primary/50 hover:border-primary rounded text-xs font-bold transition-colors"
          >
            <Search size={14} /> Filtern
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-surface border border-border rounded-lg shadow-[0_0_20px_var(--color-glow)] overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-8 text-center text-muted">Lade Audit-Logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-muted text-sm">Keine Einträge für diese Filterkriterien gefunden.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-surface-2 border-b border-border text-xs text-muted uppercase tracking-wider">
                  <th className="p-4 font-display font-medium">Datum</th>
                  <th className="p-4 font-display font-medium">Admin</th>
                  <th className="p-4 font-display font-medium">Spieler</th>
                  <th className="p-4 font-display font-medium">Item</th>
                  <th className="p-4 font-display font-medium text-center">Anzahl</th>
                  <th className="p-4 font-display font-medium text-center">Ziel</th>
                  <th className="p-4 font-display font-medium text-center">Status</th>
                  <th className="p-4 font-display font-medium">Notiz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-2/30 transition-colors">
                    <td className="p-4 text-muted text-xs font-mono">
                      {new Date(log.grantedAt).toLocaleString("de-DE")}
                    </td>
                    <td className="p-4 font-bold text-accent">{log.admin?.name || "Unbekannt"}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-text">{log.accountName}</span>
                        <span className="text-[10px] text-muted">ID: {log.accountId}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div className="hex-icon w-8 h-8 shrink-0 flex items-center justify-center bg-surface-2">
                          {log.itemTemplate?.iconUrl ? (
                            <img src={log.itemTemplate.iconUrl} alt="icon" className="w-6 h-6 object-contain" />
                          ) : (
                            <span className="text-[8px] text-muted">Item</span>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className={log.itemTemplate?.grade === 'LEGENDARY' ? 'text-danger font-bold drop-shadow-[0_0_4px_var(--color-danger)]' : 'text-text'}>
                            {log.itemTemplate?.name || "Unbekannt"}
                          </span>
                          <span className="text-[9px] text-muted font-mono">VNUM: {log.itemTemplate?.vnum || "0"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center font-bold text-primary">{log.count}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.destination === 'web' ? 'bg-success/15 text-success border border-success/35 shadow-[0_0_6px_rgba(76,175,80,0.08)]' : 'bg-accent/15 text-accent border border-accent/35 shadow-[0_0_6px_rgba(42,109,217,0.08)]'}`}>
                        {log.destination.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {getStatusBadge(log.note)}
                    </td>
                    <td className="p-4 text-xs max-w-[200px] truncate" title={log.note || ""}>
                      <span className={log.note && log.note.startsWith("FAILED:") ? "text-danger" : "text-muted italic"}>
                        {log.note || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-surface border border-border px-4 py-3 rounded-lg shadow-sm">
          <span className="text-xs text-muted">
            Seite <strong className="text-text font-mono">{page}</strong> von <strong className="text-text font-mono">{totalPages}</strong> ({total} Einträge)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 border border-border text-muted hover:text-text hover:border-border-2 rounded text-xs transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              <ArrowLeft size={14} /> Zurück
            </button>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || loading}
              className="flex items-center gap-1 px-3 py-1.5 border border-border text-muted hover:text-text hover:border-border-2 rounded text-xs transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              Weiter <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
