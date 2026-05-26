"use client"

import { useState } from "react"
import { CheckCircle, AlertCircle, Clock, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"

interface TransferHistoryProps {
  transfers: any[]
  loading: boolean
  onRefresh: () => void
}

export function TransferHistory({ transfers, loading, onRefresh }: TransferHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success border border-success/30 shadow-[0_0_8px_rgba(76,175,80,0.1)]">
            <CheckCircle size={12} />
            Erfolgreich
          </span>
        )
      case "PROCESSING":
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/20 text-warning border border-warning/30 shadow-[0_0_8px_rgba(245,158,11,0.1)] animate-pulse">
            <Clock size={12} />
            Verarbeitet...
          </span>
        )
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger/20 text-danger border border-danger/30 shadow-[0_0_8px_rgba(224,90,58,0.1)]">
            <AlertCircle size={12} />
            Fehlgeschlagen
          </span>
        )
      case "ROLLED_BACK":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/20 text-muted border border-border shadow-none">
            <AlertCircle size={12} />
            Rückgängig
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/20 text-muted border border-border">
            {status}
          </span>
        )
    }
  }

  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    return d.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-bg border border-border rounded-md p-4 gap-4">
      <div className="flex justify-between items-center pb-2 border-b border-border/40">
        <h3 className="font-display text-lg text-primary tracking-wider uppercase">Transferverlauf</h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 rounded hover:bg-surface-2 text-muted hover:text-text transition-colors disabled:opacity-50"
          title="Verlauf aktualisieren"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        {loading && transfers.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted">
            Lade Verlauf...
          </div>
        ) : transfers.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted text-sm">
            Keine Transfers in der Historie gefunden.
          </div>
        ) : (
          <div className="min-w-full overflow-hidden rounded-md border border-border/30 bg-surface-2/20">
            <table className="min-w-full divide-y divide-border/20 text-sm">
              <thead className="bg-surface-2/40 text-muted font-display uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Gegenstand</th>
                  <th className="px-4 py-3 text-center">Anzahl</th>
                  <th className="px-4 py-3 text-left">Datum</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {transfers.map((t: any) => {
                  const isFailed = t.status === "FAILED"
                  const isExpanded = expandedId === t.id
                  const template = t.itemTemplate || { name: `Vnum ${t.itemTemplateId}`, iconUrl: null }

                  return (
                    <React.Fragment key={t.id}>
                      <tr 
                        className={`hover:bg-surface-2/30 transition-colors ${isFailed ? "cursor-pointer" : ""}`}
                        onClick={() => isFailed && toggleExpand(t.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="hex-icon w-8 h-8 flex items-center justify-center bg-surface-2 border border-border/50">
                              {template.iconUrl ? (
                                <img src={template.iconUrl} alt={template.name} className="w-6 h-6 object-contain" />
                              ) : (
                                <span className="text-[10px] text-muted font-bold">Item</span>
                              )}
                            </div>
                            <span className="font-medium text-text">{template.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold text-primary">{t.count}</td>
                        <td className="px-4 py-3 text-muted">{formatDate(t.requestedAt)}</td>
                        <td className="px-4 py-3 text-center">{getStatusBadge(t.status)}</td>
                        <td className="px-2 py-3 text-center">
                          {isFailed && (
                            <button className="text-muted hover:text-text transition-colors">
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          )}
                        </td>
                      </tr>

                      {isFailed && isExpanded && (
                        <tr className="bg-danger/5 border-t-0">
                          <td colSpan={5} className="px-4 py-2 border-b border-border/10">
                            <div className="text-xs text-danger/80 py-1.5 pl-11 flex flex-col gap-1">
                              <span className="font-bold uppercase tracking-wider text-[10px] text-danger">Fehlermeldung:</span>
                              <span className="bg-surface-2/70 p-2 rounded border border-danger/20 font-mono text-[11px] block overflow-x-auto">
                                {t.errorMsg || "Unbekannter Fehler während der Datenbanktransaktion."}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// React Import-Helper für Next.js Pages Router bzw. Dynamic Import in React.Fragment
import React from "react"
