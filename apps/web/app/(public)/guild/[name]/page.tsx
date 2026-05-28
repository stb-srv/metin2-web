"use client"

import React, { useEffect, useState, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Shield, 
  User, 
  Users, 
  Award, 
  Trophy, 
  ArrowLeft,
  Crown
} from "lucide-react"

type GuildMember = {
  name: string
  level: number
  job: number
  empire: number
}

type GuildDetails = {
  id: number
  name: string
  level: number
  exp: number
  master_name: string
  members: GuildMember[]
}

export default function GuildPage({ params }: { params: Promise<{ name: string }> }) {
  const router = useRouter()
  const { name } = use(params)
  const [guild, setGuild] = useState<GuildDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/modules/guild/${name}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(res.status === 404 ? "Gilde nicht gefunden" : "Serverfehler")
        }
        return res.json()
      })
      .then(d => {
        setGuild(d.guild)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error loading guild:", err)
        setError(err.message || "Fehler beim Laden der Gilde")
        setLoading(false)
      })
  }, [name])

  const getJobName = (job: number) => {
    if (job === 0 || job === 4) return "Krieger"
    if (job === 1 || job === 5) return "Assassine"
    if (job === 2 || job === 6) return "Sura"
    if (job === 3 || job === 7) return "Schamane"
    return "Lykaner"
  }

  const getJobAbbreviation = (job: number) => {
    if (job === 0 || job === 4) return "KR"
    if (job === 1 || job === 5) return "AS"
    if (job === 2 || job === 6) return "SU"
    if (job === 3 || job === 7) return "SH"
    return "LY"
  }

  const getEmpireDetails = (empire: number) => {
    switch (empire) {
      case 1: return { name: "Shinsoo", color: "text-danger" }
      case 2: return { name: "Chunjo", color: "text-warning" }
      case 3: return { name: "Jinno", color: "text-accent" }
      default: return { name: "Unbekannt", color: "text-text" }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-text-muted font-display tracking-widest animate-pulse">
        Gilden-Details werden geladen...
      </div>
    )
  }

  if (error || !guild) {
    return (
      <div className="text-center py-20 space-y-4">
        <h2 className="text-2xl font-display text-danger uppercase tracking-wider">Fehler</h2>
        <p className="text-text-muted">{error || "Gilde konnte nicht geladen werden."}</p>
        <Button onClick={() => router.back()} className="bg-primary text-bg font-display uppercase tracking-wider hover:bg-primary/95">
          <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
        </Button>
      </div>
    )
  }

  // Find guild leader's empire from the first member as heuristic if needed, or default
  const leaderEmpire = guild.members.find(m => m.name === guild.master_name)?.empire || 3
  const empireDetails = getEmpireDetails(leaderEmpire)

  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="text-text-muted hover:text-text hover:bg-surface-2/40 border border-border/10 font-display text-xs uppercase tracking-wider"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Zurück
      </Button>

      {/* Guild Header Summary */}
      <Card className="bg-surface border-border/30 shadow-[0_0_20px_var(--color-glow)]">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="hex-icon w-16 h-16 flex items-center justify-center bg-surface-2 border-2 border-primary/50 text-primary font-display font-bold text-2xl shadow-[0_0_12px_var(--color-glow)]">
                GD
              </div>
              <div className="space-y-1 text-center md:text-left">
                <h1 className="font-display text-3xl text-text tracking-wide">{guild.name}</h1>
                <div className="text-sm text-text-muted">
                  Gildenleiter:{" "}
                  <Link 
                    href={`/character/${encodeURIComponent(guild.master_name)}`}
                    className="text-primary hover:underline font-semibold"
                  >
                    {guild.master_name}
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 text-center">
              <div className="px-4">
                <div className="text-text-muted text-xs uppercase tracking-wider flex items-center justify-center gap-1 mb-1">
                  <Trophy className="w-3.5 h-3.5 text-primary" /> Level
                </div>
                <div className="font-display text-2xl font-bold text-primary">{guild.level}</div>
              </div>
              <div className="px-4 border-x border-border/10">
                <div className="text-text-muted text-xs uppercase tracking-wider flex items-center justify-center gap-1 mb-1">
                  <Users className="w-3.5 h-3.5 text-accent" /> Mitglieder
                </div>
                <div className="font-display text-2xl font-bold text-text">{guild.members.length}</div>
              </div>
              <div className="px-4">
                <div className="text-text-muted text-xs uppercase tracking-wider flex items-center justify-center gap-1 mb-1">
                  <Award className="w-3.5 h-3.5 text-warning" /> EXP
                </div>
                <div className="font-display text-lg font-bold text-text truncate max-w-[120px]">
                  {guild.exp.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Guild Members Table */}
      <Card className="bg-surface border-border/30 shadow-[0_0_20px_var(--color-glow)]">
        <CardHeader className="border-b border-border/20 pb-4">
          <CardTitle className="font-display text-lg text-primary tracking-wider uppercase flex items-center gap-2">
            <Shield className="w-5 h-5" /> Mitgliederliste
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs text-text-muted uppercase font-display tracking-widest border-b border-border/20">
                  <th className="p-4 w-16 text-center">#</th>
                  <th className="p-4 w-20 text-center">Klasse</th>
                  <th className="p-4">Name</th>
                  <th className="p-4 text-center">Level</th>
                  <th className="p-4 text-center">Reich</th>
                  <th className="p-4 w-24 text-center">Rolle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/5">
                {guild.members.map((member, index) => {
                  const empInfo = getEmpireDetails(member.empire)
                  const isLeader = member.name === guild.master_name

                  return (
                    <tr 
                      key={member.name} 
                      className={`transition-colors border border-transparent ${isLeader ? "bg-primary/5 hover:bg-primary/10 border-primary/20" : "hover:bg-surface-2/40"}`}
                    >
                      <td className="p-4 text-center font-display font-medium text-text-muted">
                        {index + 1}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <div className={`hex-icon w-10 h-10 flex items-center justify-center font-display font-bold text-xs ${isLeader ? "text-bg bg-primary border-primary" : "text-text-muted border-border/30 bg-surface-2"}`}>
                            {getJobAbbreviation(member.job)}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Link 
                            href={`/character/${encodeURIComponent(member.name)}`}
                            className="font-medium text-text hover:text-primary transition-colors cursor-pointer font-display tracking-wide hover:underline decoration-primary/40 decoration-dotted text-base"
                          >
                            {member.name}
                          </Link>
                          {isLeader && (
                            <span title="Gildenleiter">
                              <Crown className="w-4 h-4 text-primary fill-primary" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-text-muted mt-0.5">{getJobName(member.job)}</div>
                      </td>
                      <td className="p-4 text-center font-display text-primary font-bold text-lg">
                        {member.level}
                      </td>
                      <td className={`p-4 text-center font-bold font-display text-sm tracking-wide ${empInfo.color}`}>
                        {empInfo.name}
                      </td>
                      <td className="p-4 text-center">
                        {isLeader ? (
                          <Badge className="bg-primary/20 text-primary border-primary/30">Leader</Badge>
                        ) : (
                          <Badge variant="default" className="bg-surface-2/80 text-text-muted border-transparent">Mitglied</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
