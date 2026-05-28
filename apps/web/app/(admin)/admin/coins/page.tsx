"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Coins, ArrowRight, History, ShieldAlert, Award, FileText } from "lucide-react"

interface PlayerSearchResult {
  accountId: number
  accountName: string
  characters: {
    id: number
    name: string
    level: number
    job: number
    empire: number
    guildName: string | null
  }[]
}

interface Transaction {
  id: string
  accountId: number
  accountName: string
  email: string | null
  type: "DR" | "DM"
  amount: number
  reason: string
  description: string | null
  createdAt: string
}

export default function AdminCoinsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  
  const [selectedAccount, setSelectedAccount] = useState<{ id: number; name: string } | null>(null)
  const [coinType, setCoinType] = useState<"DR" | "DM">("DR")
  const [action, setAction] = useState<"GRANT" | "DEDUCT">("GRANT")
  const [amount, setAmount] = useState<string>("")
  const [description, setDescription] = useState("")
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/admin/coins/transactions?page=1&limit=30")
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
      }
    } catch (err) {
      console.error("Failed to load transactions", err)
    } finally {
      setLoadingTransactions(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    setError(null)
    setSelectedAccount(null)

    try {
      const res = await fetch(`/api/admin/players/search?q=${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.results || [])
      } else {
        setError("Fehler beim Suchen nach Spielern.")
      }
    } catch (err) {
      setError("Verbindung zum Server fehlgeschlagen.")
    } finally {
      setSearching(false)
    }
  }

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccount) {
      setError("Bitte wähle zuerst einen Account aus.")
      return
    }

    const intAmount = parseInt(amount, 10)
    if (isNaN(intAmount) || intAmount <= 0) {
      setError("Bitte gib einen Betrag größer als 0 ein.")
      return
    }

    if (!description.trim()) {
      setError("Die Beschreibung ist ein Pflichtfeld.")
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const finalAmount = action === "GRANT" ? intAmount : -intAmount

    try {
      const res = await fetch("/api/admin/coins/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccount.id,
          type: coinType,
          amount: finalAmount,
          description,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSuccess(
          `Erfolgreich ${Math.abs(finalAmount)} ${coinType} dem Account '${selectedAccount.name}' ${
            action === "GRANT" ? "gutgeschrieben" : "abgezogen"
          }.`
        )
        setAmount("")
        setDescription("")
        setSelectedAccount(null)
        setSearchResults([])
        setSearchQuery("")
        fetchTransactions()
      } else {
        setError(data.error || "Fehler beim Ausführen der Transaktion.")
      }
    } catch (err) {
      setError("Verbindung zum Server fehlgeschlagen.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-primary tracking-widest uppercase">
          Coins verwalten
        </h1>
        <p className="text-text-muted">
          Hier kannst du Spielern manuell Premium-Währung (Dragon Coins) oder Dark Matter gutschreiben oder abziehen.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Middle Column: Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Step 1: Search player */}
          <Card className="bg-surface border-border/30 shadow-[0_0_20px_var(--color-glow)]">
            <CardHeader>
              <CardTitle className="font-display text-lg text-primary uppercase tracking-wider flex items-center gap-2">
                <Search className="w-5 h-5" /> 1. Spieler/Account suchen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Charakter- oder Account-Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-2 border border-border/25 rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50 transition-colors"
                />
                <Button
                  type="submit"
                  disabled={searching}
                  className="bg-primary hover:bg-primary/95 text-bg font-display uppercase tracking-wider text-xs px-6 py-2 transition-all hover:shadow-[0_0_12px_var(--color-glow)]"
                >
                  {searching ? "Suche..." : "Suchen"}
                </Button>
              </form>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="mt-4 border border-border/10 rounded overflow-hidden divide-y divide-border/10">
                  {searchResults.map((result) => (
                    <div
                      key={result.accountId}
                      className="flex items-center justify-between p-3 hover:bg-surface-2/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedAccount({ id: result.accountId, name: result.accountName })}
                    >
                      <div>
                        <div className="font-bold text-sm text-text">{result.accountName}</div>
                        <div className="text-xs text-text-muted mt-0.5">
                          ID: {result.accountId} • Charaktere:{" "}
                          {result.characters.length > 0
                            ? result.characters.map((c) => `${c.name} (Lv.${c.level})`).join(", ")
                            : "Keine"}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="font-display text-xs tracking-wider uppercase h-7 px-3"
                      >
                        Auswählen <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.length === 0 && searchQuery && !searching && (
                <p className="text-xs text-text-muted mt-2">Keine Accounts gefunden.</p>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Manage Coins Form */}
          {selectedAccount && (
            <Card className="bg-surface border-border/30 shadow-[0_0_20px_var(--color-glow)] animate-in fade-in duration-200">
              <CardHeader>
                <CardTitle className="font-display text-lg text-primary uppercase tracking-wider flex items-center gap-2">
                  <Coins className="w-5 h-5" /> 2. Transaktion für &apos;{selectedAccount.name}&apos; ausführen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTransactionSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-danger/10 border border-danger/30 text-danger text-xs p-3 rounded">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="bg-success/10 border border-success/30 text-success text-xs p-3 rounded">
                      {success}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {/* Währung */}
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted font-display uppercase tracking-wider">Währung</label>
                      <select
                        value={coinType}
                        onChange={(e) => setCoinType(e.target.value as "DR" | "DM")}
                        className="w-full bg-surface-2 border border-border/25 rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
                      >
                        <option value="DR">Dragon Coins (DR) 💰</option>
                        <option value="DM">Dark Matter (DM) 💎</option>
                      </select>
                    </div>

                    {/* Aktion */}
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted font-display uppercase tracking-wider">Aktion</label>
                      <select
                        value={action}
                        onChange={(e) => setAction(e.target.value as "GRANT" | "DEDUCT")}
                        className="w-full bg-surface-2 border border-border/25 rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
                      >
                        <option value="GRANT">Gutschreiben (+)</option>
                        <option value="DEDUCT">Abziehen (-)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Betrag */}
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted font-display uppercase tracking-wider">Betrag</label>
                      <input
                        type="number"
                        min={1}
                        placeholder="z.B. 100"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-surface-2 border border-border/25 rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
                        required
                      />
                    </div>

                    {/* Beschreibung */}
                    <div className="space-y-1">
                      <label className="text-xs text-text-muted font-display uppercase tracking-wider">Grund / Beschreibung (Pflichtfeld)</label>
                      <input
                        type="text"
                        placeholder="z.B. Admin-Gutschrift wegen Eventgewinn"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-surface-2 border border-border/25 rounded px-3 py-2 text-sm text-text focus:outline-none focus:border-primary/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setSelectedAccount(null)}
                      className="border-border/40 hover:bg-surface-2/40 text-xs font-display uppercase"
                    >
                      Abbrechen
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="bg-primary hover:bg-primary/95 text-bg font-display uppercase tracking-wider text-xs px-6 transition-all hover:shadow-[0_0_12px_var(--color-glow)]"
                    >
                      {submitting ? "Ausführen..." : "Transaktion bestätigen"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

        </div>

        {/* Right Column: Transaction History */}
        <div className="space-y-6">
          <Card className="bg-surface border-border/30 shadow-[0_0_20px_var(--color-glow)] h-[600px] flex flex-col">
            <CardHeader className="border-b border-border/20 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg text-primary uppercase tracking-wider flex items-center gap-2">
                <History className="w-5 h-5" /> Letzte Aktivitäten
              </CardTitle>
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchTransactions}
                className="h-7 text-[10px] uppercase font-display px-2 border-border/30"
              >
                Aktualisieren
              </Button>
            </CardHeader>
            <CardContent className="pt-4 flex-1 overflow-y-auto space-y-3.5 pr-2">
              {loadingTransactions ? (
                <div className="flex items-center justify-center h-full text-xs text-text-muted font-display tracking-widest animate-pulse">
                  Lade Transaktionen...
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-20 text-xs text-text-muted">
                  Keine Transaktionsdaten vorhanden.
                </div>
              ) : (
                transactions.map((tx) => {
                  const isPositive = tx.amount >= 0
                  return (
                    <div
                      key={tx.id}
                      className="p-3 bg-surface-2/40 border border-border/10 rounded flex flex-col gap-1.5 text-xs hover:border-primary/10 transition-all"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-text truncate max-w-[120px]">{tx.accountName}</span>
                        <span
                          className={`font-display font-bold ${
                            isPositive ? "text-success" : "text-danger"
                          }`}
                        >
                          {isPositive ? "+" : ""}
                          {tx.amount} {tx.type === "DR" ? "DR 💰" : "DM 💎"}
                        </span>
                      </div>
                      <div className="text-text-muted flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-primary opacity-60" />
                        <span className="truncate">{tx.description || "Transaktion"}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-text-muted/70 mt-0.5">
                        <Badge variant="default" className="text-[9px] px-1 py-0 bg-surface/50 border border-border/20 text-text-muted">
                          {tx.reason}
                        </Badge>
                        <span>{new Date(tx.createdAt).toLocaleDateString("de-DE")}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
