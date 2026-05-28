"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sword, ExternalLink, ShieldAlert } from "lucide-react"

interface Character {
  id: number
  name: string
  level: number
  job: number
  empire: number
  guildName: string | null
}

const getClassName = (job: number) => {
  switch (job) {
    case 0: return "Krieger (M)"
    case 1: return "Ninja (W)"
    case 2: return "Sura (M)"
    case 3: return "Schamane (W)"
    case 4: return "Krieger (W)"
    case 5: return "Ninja (M)"
    case 6: return "Sura (W)"
    case 7: return "Schamane (M)"
    default: return "Krieger"
  }
}

const getEmpireName = (empire: number) => {
  switch (empire) {
    case 1: return "Shinsoo"
    case 2: return "Chunjo"
    case 3: return "Jinno"
    default: return "Keins"
  }
}

const getEmpireBadgeClass = (empire: number) => {
  switch (empire) {
    case 1: return "bg-red-500/20 text-red-400 border-red-500/30"
    case 2: return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
    case 3: return "bg-blue-500/20 text-blue-400 border-blue-500/30"
    default: return "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
  }
}

const getClassIcon = (job: number) => {
  switch (job) {
    case 0:
    case 4:
      return "⚔️" // Warrior
    case 1:
    case 5:
      return "🏹" // Ninja
    case 2:
    case 6:
      return "🛡️" // Sura
    case 3:
    case 7:
      return "🔮" // Shaman
    default:
      return "👤"
  }
}

export default function CharacterList() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadCharacters() {
      try {
        const res = await fetch("/api/modules/character/my-characters")
        if (!res.ok) {
          throw new Error("Fehler beim Laden der Charaktere")
        }
        const data = await res.json()
        setCharacters(data)
      } catch (err) {
        setError("Charaktere konnten nicht geladen werden.")
      } finally {
        setLoading(false)
      }
    }

    loadCharacters()
  }, [])

  if (loading) {
    return (
      <Card className="bg-surface border-border/30 shadow-[0_0_20px_var(--color-glow)]">
        <CardHeader>
          <CardTitle className="font-display text-lg text-primary uppercase tracking-wider">Meine Charaktere</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 w-full bg-surface-2/60 border border-border/10 rounded animate-pulse" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="bg-surface border-border/30 shadow-[0_0_20px_var(--color-glow)]">
        <CardHeader>
          <CardTitle className="font-display text-lg text-primary uppercase tracking-wider">Meine Charaktere</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6 text-danger text-sm">
          <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-danger opacity-70" />
          {error}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-surface border-border/30 shadow-[0_0_20px_var(--color-glow)]">
      <CardHeader className="border-b border-border/20 pb-4">
        <CardTitle className="font-display text-lg text-primary uppercase tracking-wider flex items-center gap-2">
          <Sword className="w-5 h-5" /> Meine Charaktere
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {characters.length === 0 ? (
          <div className="text-center py-8 text-sm text-text-muted">
            Keine Charaktere auf diesem Account gefunden.
          </div>
        ) : (
          <div className="space-y-3">
            {characters.map((char) => (
              <div 
                key={char.id} 
                className="flex items-center justify-between p-3.5 bg-surface-2/60 hover:bg-surface-2 border border-border/10 rounded-lg transition-all group hover:border-primary/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface/80 border border-border/20 flex items-center justify-center text-lg shadow-inner">
                    {getClassIcon(char.job)}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-text group-hover:text-primary transition-colors flex items-center gap-2">
                      {char.name}
                      <span className="text-xs text-text-muted font-normal">Level {char.level}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-text-muted">{getClassName(char.job)}</span>
                      <span className="text-xs text-text-muted">•</span>
                      <Badge className={`text-[10px] px-1.5 py-0 border ${getEmpireBadgeClass(char.empire)}`}>
                        {getEmpireName(char.empire)}
                      </Badge>
                      {char.guildName && (
                        <>
                          <span className="text-xs text-text-muted">•</span>
                          <span className="text-xs font-semibold text-primary">{char.guildName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Link 
                  href={`/character/${encodeURIComponent(char.name)}`}
                  className="p-1.5 text-text-muted hover:text-primary bg-surface/50 border border-border/10 hover:border-primary/30 rounded transition-all"
                  title="Öffentliches Profil ansehen"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
