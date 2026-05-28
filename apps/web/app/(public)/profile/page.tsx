"use client"

import React from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Mail, Shield, Key, LogOut, ArrowRight, Activity } from "lucide-react"

export default function ProfilePage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-text-muted font-display tracking-widest animate-pulse">
        Profil-Details werden geladen...
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-6">
        <div className="hex-icon w-16 h-16 mx-auto flex items-center justify-center bg-surface-2 border border-danger/30 text-danger shadow-[0_0_15px_rgba(224,90,58,0.15)]">
          <Shield className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-display text-danger uppercase tracking-wider">Nicht Angemeldet</h2>
          <p className="text-text-muted text-sm">
            Du musst angemeldet sein, um auf diese Seite zuzugreifen.
          </p>
        </div>
        <div className="flex justify-center gap-4">
          <Link href="/login" className="w-full">
            <Button className="w-full bg-primary text-bg font-display uppercase tracking-wider hover:bg-primary/95">
              Zum Login <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const user = session.user

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl text-primary uppercase tracking-widest">
          Mein Profil
        </h1>
        <p className="text-text-muted text-sm">
          Verwalte deine CMS-Account Details und behalte deinen Spielstatus im Blick.
        </p>
      </div>

      <Card className="bg-surface border-border/30 shadow-[0_0_20px_var(--color-glow)]">
        <CardHeader className="border-b border-border/20 pb-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="hex-icon w-16 h-16 flex items-center justify-center bg-surface-2 border-2 border-primary/50 text-primary font-display font-bold text-2xl shadow-[0_0_12px_var(--color-glow)]">
              {user.name ? user.name.slice(0, 2).toUpperCase() : "US"}
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <CardTitle className="font-display text-2xl text-text tracking-wide">{user.name || "Spieler"}</CardTitle>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <Badge variant={user.role === "ADMIN" ? "danger" : "accent"}>
                  {user.role === "ADMIN" ? "Administrator" : "Spieler"}
                </Badge>
                <Badge variant="default" className="bg-surface-2 border-border/10 text-text-muted">
                  ID: {user.accountId}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-display text-sm text-text-muted uppercase tracking-wider border-b border-border/10 pb-1">
              Account-Daten
            </h3>
            
            {/* Name */}
            <div className="flex justify-between items-center text-sm border-b border-border/10 pb-3">
              <span className="text-text-muted flex items-center">
                <User className="w-4 h-4 mr-2.5 text-primary" /> Name
              </span>
              <span className="font-semibold text-text">{user.name}</span>
            </div>

            {/* Email */}
            <div className="flex justify-between items-center text-sm border-b border-border/10 pb-3">
              <span className="text-text-muted flex items-center">
                <Mail className="w-4 h-4 mr-2.5 text-primary" /> E-Mail-Adresse
              </span>
              <span className="font-semibold text-text">{user.email}</span>
            </div>

            {/* Role */}
            <div className="flex justify-between items-center text-sm border-b border-border/10 pb-3">
              <span className="text-text-muted flex items-center">
                <Shield className="w-4 h-4 mr-2.5 text-primary" /> Systemrolle
              </span>
              <span className="font-semibold text-text">{user.role}</span>
            </div>

            {/* Account ID */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-text-muted flex items-center">
                <Key className="w-4 h-4 mr-2.5 text-primary" /> Ingame Account-ID
              </span>
              <span className="font-mono font-bold text-primary">{user.accountId}</span>
            </div>
          </div>

          <div className="bg-surface-2/45 p-4 rounded-lg border border-border/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
            <div className="space-y-0.5">
              <div className="text-xs text-text-muted uppercase tracking-wider flex items-center gap-1.5 font-display">
                <Activity className="w-3.5 h-3.5 text-success" /> Sicherheitshinweis
              </div>
              <div className="text-xs text-text-muted">
                Gib deine Zugangsdaten oder deinen Löschcode niemals an Dritte weiter.
              </div>
            </div>
            <Button 
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="bg-danger/20 hover:bg-danger/30 text-danger border border-danger/30 font-display text-xs uppercase tracking-wider px-4 py-2 hover:shadow-[0_0_12px_rgba(224,90,58,0.15)] transition-all"
            >
              <LogOut className="w-4 h-4 mr-2" /> Abmelden
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
