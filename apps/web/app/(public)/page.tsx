import React from "react"
import Link from "next/link"
import { gameDb } from "@/lib/game-db"
import { Shield, Users, Sword, Trophy, Sparkles } from "lucide-react"

export const revalidate = 60 // Cache page for 60 seconds

async function fetchLiveStats() {
  try {
    const [accountsRes, onlineRes, guildsRes, maxLevelRes] = await Promise.all([
      gameDb.$queryRawUnsafe<any[]>("SELECT COUNT(*) as count FROM account"),
      gameDb.$queryRawUnsafe<any[]>("SELECT COUNT(*) as count FROM player WHERE logoff_time = 0"),
      gameDb.$queryRawUnsafe<any[]>("SELECT COUNT(*) as count FROM guild"),
      gameDb.$queryRawUnsafe<any[]>("SELECT MAX(level) as maxLevel FROM player")
    ])

    return {
      accounts: Number(accountsRes[0]?.count || 0),
      online: Number(onlineRes[0]?.count || 0),
      guilds: Number(guildsRes[0]?.count || 0),
      maxLevel: Number(maxLevelRes[0]?.maxLevel || 99)
    }
  } catch (error) {
    console.warn("Failed to fetch live stats from GameDB, using mock fallbacks:", error)
    return {
      accounts: 12453,
      online: 842,
      guilds: 154,
      maxLevel: 120
    }
  }
}

export default async function HomePage() {
  const stats = await fetchLiveStats()

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex flex-col justify-center items-center overflow-hidden">
      
      {/* Fullscreen Thematic Background with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 scale-105 transition-transform duration-[10s]"
        style={{ 
          backgroundImage: "url('/hero-bg.png')",
        }}
      />
      {/* Dark oiled overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0f] via-[#0a0b0f]/80 to-[#0a0b0f]/70 z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#0a0b0f_85%)] z-10" />

      {/* Hero Content */}
      <div className="relative z-20 max-w-4xl px-6 text-center space-y-12 py-16 flex flex-col items-center">
        
        {/* Decorative Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs uppercase tracking-widest font-display animate-pulse shadow-[0_0_12px_rgba(200,168,75,0.15)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Die Schlacht beginnt</span>
        </div>

        {/* Server Title */}
        <div className="space-y-4">
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-widest text-primary uppercase drop-shadow-[0_0_15px_rgba(200,168,75,0.4)]">
            METIN2 LANDS
          </h1>
          <p className="text-text max-w-lg mx-auto font-body text-lg md:text-xl text-text-muted leading-relaxed">
            Betrete eine Welt voller Dunkelheit, Epischer Schlachten und Uralter Legenden. Wähle dein Reich und kämpfe um den Thron!
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full sm:w-auto">
          <Link 
            href="/register" 
            className="w-full sm:w-48 py-3 text-sm font-display font-bold uppercase tracking-wider text-bg bg-primary border-2 border-primary hover:bg-primary/95 hover:shadow-[0_0_20px_var(--color-primary)] transition-all duration-300 rounded shadow-[0_0_10px_var(--color-glow)] text-center"
          >
            Registrieren
          </Link>
          <Link 
            href="/login" 
            className="w-full sm:w-48 py-3 text-sm font-display font-display font-medium uppercase tracking-wider text-text hover:text-primary hover:bg-surface border-2 border-primary/40 hover:border-primary rounded transition-all duration-300 text-center"
          >
            Einloggen
          </Link>
        </div>

        {/* Live Stats Leiste */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-3xl pt-8 border-t border-primary/20">
          
          {/* Accounts */}
          <div className="bg-[#111318]/90 border border-primary/20 rounded-lg p-4 shadow-[0_0_15px_var(--color-glow)] hover:border-primary/40 transition-all duration-300">
            <div className="text-text-muted text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 mb-1.5 font-display">
              <Users className="w-3.5 h-3.5 text-primary" /> Accounts
            </div>
            <div className="font-display text-lg md:text-2xl font-bold text-text">
              {stats.accounts.toLocaleString()}
            </div>
          </div>

          {/* Online */}
          <div className="bg-[#111318]/90 border border-primary/20 rounded-lg p-4 shadow-[0_0_15px_var(--color-glow)] hover:border-primary/40 transition-all duration-300">
            <div className="text-text-muted text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 mb-1.5 font-display">
              <span className="w-2 h-2 rounded-full bg-success shadow-[0_0_6px_var(--color-success)] animate-pulse" /> Online
            </div>
            <div className="font-display text-lg md:text-2xl font-bold text-success drop-shadow-[0_0_5px_rgba(76,175,80,0.3)]">
              {stats.online.toLocaleString()}
            </div>
          </div>

          {/* Guilds */}
          <div className="bg-[#111318]/90 border border-primary/20 rounded-lg p-4 shadow-[0_0_15px_var(--color-glow)] hover:border-primary/40 transition-all duration-300">
            <div className="text-text-muted text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 mb-1.5 font-display">
              <Shield className="w-3.5 h-3.5 text-accent" /> Gilden
            </div>
            <div className="font-display text-lg md:text-2xl font-bold text-text">
              {stats.guilds.toLocaleString()}
            </div>
          </div>

          {/* Max Level */}
          <div className="bg-[#111318]/90 border border-primary/20 rounded-lg p-4 shadow-[0_0_15px_var(--color-glow)] hover:border-primary/40 transition-all duration-300">
            <div className="text-text-muted text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 mb-1.5 font-display">
              <Trophy className="w-3.5 h-3.5 text-warning" /> Max Level
            </div>
            <div className="font-display text-lg md:text-2xl font-bold text-primary">
              {stats.maxLevel}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
