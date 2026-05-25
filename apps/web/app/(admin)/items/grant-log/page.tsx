"use client"

import { useState, useEffect } from "react"
import { Download, History } from "lucide-react"

export default function GrantLogPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/items/grant-log")
      .then(res => res.json())
      .then(data => {
        setLogs(data.data || [])
        setLoading(false)
      })
  }, [])

  const handleCSVExport = () => {
    if (logs.length === 0) return
    const headers = ["ID", "Admin", "Account ID", "Item", "VNUM", "Anzahl", "Ziel", "Datum", "Notiz"]
    const rows = logs.map(l => [
      l.id,
      l.admin.name,
      l.accountId,
      l.itemTemplate?.name || "Unknown",
      l.itemTemplate?.vnum || "0",
      l.count,
      l.destination,
      new Date(l.grantedAt).toLocaleString(),
      `"${(l.note || "").replace(/"/g, '""')}"`
    ])

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `item-grant-log-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-display text-primary flex items-center gap-2">
          <History /> Item Grant Audit-Log
        </h1>
        <button 
          onClick={handleCSVExport}
          className="flex items-center gap-2 px-4 py-2 bg-surface-2 border border-border text-text hover:text-primary transition-colors rounded"
        >
          <Download size={18} /> CSV Export
        </button>
      </div>

      <div className="bg-surface border border-border rounded-md overflow-hidden">
        {loading ? (
          <div className="p-4 text-center text-muted">Lade Logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-4 text-center text-muted">Keine Einträge gefunden.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2 border-b border-border text-sm text-muted">
                <th className="p-3 font-medium">Datum</th>
                <th className="p-3 font-medium">Admin</th>
                <th className="p-3 font-medium">Account ID</th>
                <th className="p-3 font-medium">Item</th>
                <th className="p-3 font-medium text-center">Anzahl</th>
                <th className="p-3 font-medium text-center">Ziel</th>
                <th className="p-3 font-medium">Notiz</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-border/50 hover:bg-surface-2/50 transition-colors text-sm">
                  <td className="p-3 text-muted">{new Date(log.grantedAt).toLocaleString()}</td>
                  <td className="p-3 text-accent font-bold">{log.admin.name}</td>
                  <td className="p-3 text-text">{log.accountId}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {log.itemTemplate?.iconUrl && (
                        <img src={log.itemTemplate.iconUrl} alt="icon" className="w-6 h-6 object-contain" />
                      )}
                      <span className={log.itemTemplate?.grade === 'LEGENDARY' ? 'text-danger font-bold' : 'text-text'}>
                        {log.itemTemplate?.name || "Unknown"}
                      </span>
                    </div>
                  </td>
                  <td className="p-3 text-center font-bold text-primary">{log.count}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${log.destination === 'web' ? 'bg-success/20 text-success border border-success/30' : 'bg-accent/20 text-accent border border-accent/30'}`}>
                      {log.destination.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3 text-muted italic max-w-[200px] truncate" title={log.note || ""}>
                    {log.note || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
