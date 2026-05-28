"use client"

import React, { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusDot } from "@/components/ui/status-dot"
import { 
  Shield, 
  Sword, 
  Heart, 
  Zap, 
  Award, 
  Activity, 
  Clock, 
  User, 
  Users, 
  Trophy, 
  Compass,
  ArrowLeft
} from "lucide-react"

type CharacterDetails = {
  id: number
  name: string
  level: number
  job: number
  empire: number
  guild_name: string | null
  playtime: number
  alignment: number
  hp: number
  mp: number
  st: number // stamina
  ht: number // health/con
  dx: number // dexterity
  iq: number // intelligence
  str: number // strength
  exp: number
  gold: number
  status: "online" | "offline"
  rank: number
}

export default function CharacterPage({ params }: { params: Promise<{ name: string }> }) {
  const router = useRouter()
  const { name } = use(params)
  const [character, setCharacter] = useState<CharacterDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/modules/character/${name}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(res.status === 404 ? "Charakter nicht gefunden" : "Serverfehler")
        }
        return res.json()
      })
      .then(d => {
        setCharacter(d.character)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error loading character:", err)
        setError(err.message || "Fehler beim Laden des Charakters")
        setLoading(false)
      })
  }, [name])

  const getJobDetails = (job: number) => {
    const jobs: Record<number, { name: string; gender: string }> = {
      0: { name: "Krieger", gender: "Männlich" },
      4: { name: "Krieger", gender: "Weiblich" },
      1: { name: "Assassine", gender: "Weiblich" },
      5: { name: "Assassine", gender: "Männlich" },
      2: { name: "Sura", gender: "Männlich" },
      6: { name: "Sura", gender: "Weiblich" },
      3: { name: "Schamane", gender: "Weiblich" },
      7: { name: "Schamane", gender: "Männlich" }
    }
    return jobs[job] || { name: "Lykaner", gender: "Unbekannt" }
  }

  const getEmpireDetails = (empire: number) => {
    switch (empire) {
      case 1: return { name: "Shinsoo", color: "text-danger", border: "border-danger/30" }
      case 2: return { name: "Chunjo", color: "text-warning", border: "border-warning/30" }
      case 3: return { name: "Jinno", color: "text-accent", border: "border-accent/30" }
      default: return { name: "Unbekannt", color: "text-text", border: "border-border/30" }
    }
  }

  const getAlignmentDetails = (alignment: number) => {
    if (alignment >= 12000) return { title: "Ritterlich", color: "text-success bg-success/15 border-success/30" }
    if (alignment >= 8000) return { title: "Edel", color: "text-success/90 bg-success/10 border-success/20" }
    if (alignment >= 4000) return { title: "Gut", color: "text-success/80 bg-success/5 border-success/10" }
    if (alignment >= 1000) return { title: "Freundlich", color: "text-success/70 bg-success/5 border-transparent" }
    if (alignment >= 0) return { title: "Neutral", color: "text-text-muted bg-surface-2 border-border/10" }
    if (alignment >= -3999) return { title: "Aggressiv", color: "text-warning bg-warning/10 border-warning/20" }
    if (alignment >= -7999) return { title: "Überheblich", color: "text-warning/90 bg-warning/15 border-warning/30" }
    if (alignment >= -11999) return { title: "Grausam", color: "text-danger bg-danger/10 border-danger/20" }
    return { title: "Bösartig", color: "text-danger bg-danger/15 border-danger/30" }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-text-muted font-display tracking-widest animate-pulse">
        Charakter-Details werden geladen...
      </div>
    )
  }

  if (error || !character) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-display text-danger uppercase tracking-wider">Fehler</h2>
        <p className="text-text-muted">{error || "Charakter konnte nicht geladen werden."}</p>
        <Button onClick={() => router.back()} className="bg-primary text-bg font-display uppercase tracking-wider hover:bg-primary/95">
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
        </Button>
      </div>
    )
  }

  const jobInfo = getJobDetails(character.job)
  const empireInfo = getEmpireDetails(character.empire)
  const alignmentInfo = getAlignmentDetails(character.alignment)
  const playtimeHours = Math.round(character.playtime / 60)

  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="text-text-muted hover:text-text hover:bg-surface-2/40 border border-border/10 font-display text-xs uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
      </Button>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Profile & Empire */}
        <Card className="lg:col-span-1 bg-surface border-border/30 shadow-[0_0_20px_var(--color-glow)] flex flex-col justify-between">
          <CardHeader className="text-center border-b border-border/20 pb-6">
            <div className="mx-auto flex justify-center mb-4">
              <div className="hex-icon w-24 h-24 flex items-center justify-center font-display font-bold text-3xl text-primary bg-surface-2 border-2 border-primary/50 shadow-[0_0_15px_var(--color-glow)]">
                {jobInfo.name.slice(0, 2).toUpperCase()}
              </div>
            </div>
            <CardTitle className="font-display text-2xl text-text tracking-wide mb-1">{character.name}</CardTitle>
            <div className="flex justify-center gap-2 mt-2">
              <Badge variant={character.status === "online" ? "success" : "default"}>
                <StatusDot status={character.status} className="mr-1.5" />
                {character.status === "online" ? "Online" : "Offline"}
              </Badge>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${empireInfo.border} ${empireInfo.color} bg-surface-2/40`}>
                {empireInfo.name}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4 flex-1">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-border/10 pb-2">
                <span className="text-text-muted flex items-center"><User className="w-4 h-4 mr-2 text-primary" /> Klasse</span>
                <span className="font-semibold text-text">{jobInfo.name} ({jobInfo.gender})</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-border/10 pb-2">
                <span className="text-text-muted flex items-center"><Trophy className="w-4 h-4 mr-2 text-primary" /> Level</span>
                <span className="font-display text-primary font-bold text-lg">{character.level}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-border/10 pb-2">
                <span className="text-text-muted flex items-center"><Users className="w-4 h-4 mr-2 text-primary" /> Gilde</span>
                {character.guild_name ? (
                  <Link 
                    href={`/guild/${encodeURIComponent(character.guild_name)}`}
                    className="font-semibold text-primary hover:underline transition-colors"
                  >
                    {character.guild_name}
                  </Link>
                ) : (
                  <span className="text-text-muted italic">Keine Gilde</span>
                )}
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted flex items-center"><Clock className="w-4 h-4 mr-2 text-primary" /> Spielzeit</span>
                <span className="font-semibold text-text">{playtimeHours} Std.</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Middle Card: Stats and Attributes */}
        <Card className="lg:col-span-2 bg-surface border-border/30 shadow-[0_0_20px_var(--color-glow)]">
          <CardHeader className="border-b border-border/20 pb-4">
            <CardTitle className="font-display text-lg text-primary tracking-wider uppercase">Charakter-Attribute</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            
            {/* Top Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-surface-2/65 p-3 rounded-lg border border-border/10 text-center">
                <div className="text-text-muted text-xs uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-danger" /> HP
                </div>
                <div className="font-display text-lg font-bold text-text">{character.hp.toLocaleString()}</div>
              </div>
              <div className="bg-surface-2/65 p-3 rounded-lg border border-border/10 text-center">
                <div className="text-text-muted text-xs uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-accent" /> MP
                </div>
                <div className="font-display text-lg font-bold text-text">{character.mp.toLocaleString()}</div>
              </div>
              <div className="bg-surface-2/65 p-3 rounded-lg border border-border/10 text-center">
                <div className="text-text-muted text-xs uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                  <Sword className="w-3.5 h-3.5 text-warning" /> Alignment
                </div>
                <div className="font-display text-sm font-bold text-text truncate">
                  {character.alignment.toLocaleString()}
                </div>
              </div>
              <div className="bg-surface-2/65 p-3 rounded-lg border border-border/10 text-center">
                <div className="text-text-muted text-xs uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                  <Award className="w-3.5 h-3.5 text-primary" /> Rang
                </div>
                <div className="font-display text-lg font-bold text-primary">#{character.rank}</div>
              </div>
            </div>

            {/* Attributes Bars (VIT, INT, STR, DEX) */}
            <div className="space-y-4">
              <h3 className="font-display text-sm text-text-muted uppercase tracking-wider border-b border-border/10 pb-1">Basis-Statuswerte</h3>
              
              {/* VIT */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-text font-medium">Vitalität (VIT / HT)</span>
                  <span className="font-bold text-primary">{character.ht} / 90</span>
                </div>
                <div className="h-2.5 w-full bg-surface-2 rounded-full overflow-hidden border border-border/10">
                  <div 
                    className="h-full bg-danger shadow-[0_0_8px_var(--color-danger)] transition-all duration-500" 
                    style={{ width: `${Math.min(100, (character.ht / 90) * 100)}%` }}
                  />
                </div>
              </div>

              {/* INT */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-text font-medium">Intelligenz (INT / IQ)</span>
                  <span className="font-bold text-primary">{character.iq} / 90</span>
                </div>
                <div className="h-2.5 w-full bg-surface-2 rounded-full overflow-hidden border border-border/10">
                  <div 
                    className="h-full bg-accent shadow-[0_0_8px_var(--color-accent)] transition-all duration-500" 
                    style={{ width: `${Math.min(100, (character.iq / 90) * 100)}%` }}
                  />
                </div>
              </div>

              {/* STR */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-text font-medium">Stärke (STR)</span>
                  <span className="font-bold text-primary">{character.str} / 90</span>
                </div>
                <div className="h-2.5 w-full bg-surface-2 rounded-full overflow-hidden border border-border/10">
                  <div 
                    className="h-full bg-warning shadow-[0_0_8px_var(--color-warning)] transition-all duration-500" 
                    style={{ width: `${Math.min(100, (character.str / 90) * 100)}%` }}
                  />
                </div>
              </div>

              {/* DEX */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-text font-medium">Geschicklichkeit (DEX / DX)</span>
                  <span className="font-bold text-primary">{character.dx} / 90</span>
                </div>
                <div className="h-2.5 w-full bg-surface-2 rounded-full overflow-hidden border border-border/10">
                  <div 
                    className="h-full bg-success shadow-[0_0_8px_var(--color-success)] transition-all duration-500" 
                    style={{ width: `${Math.min(100, (character.dx / 90) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Secondary info (Alignment & Rank Info) */}
            <div className="bg-surface-2/40 p-4 rounded-lg border border-border/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
              <div className="space-y-1">
                <div className="text-xs text-text-muted uppercase tracking-wider">Gesinnungs-Rang</div>
                <div className="flex items-center gap-2">
                  <span className={`font-display font-semibold text-lg ${alignmentInfo.color.split(' ')[0]}`}>{alignmentInfo.title}</span>
                  <Badge variant="default" className={`text-xs ${alignmentInfo.color}`}>
                    {character.alignment > 0 ? `+${character.alignment}` : character.alignment} Pkt.
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-text-muted max-w-sm">
                Der Gesinnungs-Rang repräsentiert deine Ehre im Reich. Ein positiver Rang zeugt von Heldenmut, während ein negativer Rang auf ein gesetzloses Dasein hinweist.
              </div>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  )
}
