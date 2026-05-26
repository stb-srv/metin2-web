"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { ShieldAlert, ShieldCheck, Loader2 } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()

  const [accountName, setAccountName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Validation States
  const [valErrors, setValErrors] = useState<{
    accountName?: string
    email?: string
    password?: string
    passwordConfirm?: string
  }>({})

  // Password strength computation
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: "Ungültig", color: "bg-border/20" }
    let score = 0
    if (password.length >= 8) score++
    if (/[0-9]/.test(password)) score++
    if (/[A-Z]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (score <= 2) return { score, label: "Schwach", color: "bg-danger" }
    if (score === 3) return { score, label: "Mittel", color: "bg-warning" }
    return { score, label: "Stark", color: "bg-success" }
  }

  const strength = getPasswordStrength()

  // Validate form fields live
  useEffect(() => {
    const errors: typeof valErrors = {}

    if (accountName) {
      if (accountName.length < 4 || accountName.length > 16) {
        errors.accountName = "Name muss zwischen 4 und 16 Zeichen lang sein."
      } else if (!/^[a-zA-Z0-9_]+$/.test(accountName)) {
        errors.accountName = "Nur Buchstaben, Zahlen und Unterstriche erlaubt."
      }
    }

    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = "Bitte gib eine gültige E-Mail-Adresse ein."
      }
    }

    if (password) {
      if (password.length < 8) {
        errors.password = "Mindestens 8 Zeichen erforderlich."
      } else if (!/[0-9]/.test(password)) {
        errors.password = "Muss mindestens eine Zahl enthalten."
      } else if (!/[A-Z]/.test(password)) {
        errors.password = "Muss mindestens einen Großbuchstaben enthalten."
      }
    }

    if (passwordConfirm && password !== passwordConfirm) {
      errors.passwordConfirm = "Die Passwörter stimmen nicht überein."
    }

    setValErrors(errors)
  }, [accountName, email, password, passwordConfirm])

  const isFormValid = 
    accountName && 
    email && 
    password && 
    passwordConfirm && 
    Object.keys(valErrors).length === 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
    setError(null)
    setLoading(true)

    try {
      // 1. Account registrieren
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountName, email, password, passwordConfirm }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Registrierung fehlgeschlagen.")
        setLoading(false)
        return
      }

      // 2. Automatischer Login nach erfolgreicher Registrierung
      const loginResult = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (loginResult?.error) {
        setError("Account erstellt, aber automatischer Login fehlgeschlagen. Bitte melde dich manuell an.")
        setLoading(false)
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("Verbindung zum Server fehlgeschlagen.")
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-surface border border-border/30 rounded-lg p-8 shadow-[0_0_40px_rgba(0,0,0,0.6),_0_0_20px_var(--color-glow)] backdrop-blur-md">
      <div className="text-center mb-6">
        <div className="mx-auto hex-icon w-16 h-16 flex items-center justify-center bg-primary/20 border border-primary/40 mb-4 shadow-[0_0_25px_var(--color-glow)]">
          <span className="text-primary font-display font-bold text-2xl mt-1 select-none">M</span>
        </div>
        <h2 className="text-3xl font-display text-primary tracking-widest uppercase">
          Registrieren
        </h2>
        <p className="text-xs text-muted mt-2 uppercase tracking-widest">
          Erstelle deinen Spiel-Account
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded text-sm mb-4">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account-Name */}
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            Account-Name
          </label>
          <input
            type="text"
            required
            disabled={loading}
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="z.B. Player123"
            maxLength={16}
            className={`w-full bg-surface-2 border rounded px-4 py-2.5 text-text placeholder-text-muted/30 focus:outline-none transition-all disabled:opacity-50 ${
              valErrors.accountName 
                ? "border-danger focus:border-danger focus:ring-1 focus:ring-danger/30" 
                : "border-border/20 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
            }`}
          />
          <p className="text-[10px] text-text-muted mt-1">
            Dieser Name wird dein Ingame-Loginname. (4-16 Zeichen, a-z, A-Z, 0-9, _)
          </p>
          {valErrors.accountName && (
            <p className="text-xs text-danger mt-1">{valErrors.accountName}</p>
          )}
        </div>

        {/* E-Mail */}
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            E-Mail-Adresse
          </label>
          <input
            type="email"
            required
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="beispiel@domain.de"
            className={`w-full bg-surface-2 border rounded px-4 py-2.5 text-text placeholder-text-muted/30 focus:outline-none transition-all disabled:opacity-50 ${
              valErrors.email 
                ? "border-danger focus:border-danger focus:ring-1 focus:ring-danger/30" 
                : "border-border/20 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
            }`}
          />
          {valErrors.email && (
            <p className="text-xs text-danger mt-1">{valErrors.email}</p>
          )}
        </div>

        {/* Passwort */}
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            Passwort
          </label>
          <input
            type="password"
            required
            disabled={loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={`w-full bg-surface-2 border rounded px-4 py-2.5 text-text placeholder-text-muted/30 focus:outline-none transition-all disabled:opacity-50 ${
              valErrors.password 
                ? "border-danger focus:border-danger focus:ring-1 focus:ring-danger/30" 
                : "border-border/20 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
            }`}
          />
          {valErrors.password && (
            <p className="text-xs text-danger mt-1">{valErrors.password}</p>
          )}

          {/* Password strength visual bar */}
          {password && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between items-center text-[10px] text-text-muted">
                <span>Passwort-Stärke:</span>
                <span className={`font-bold ${
                  strength.score <= 2 ? "text-danger" : strength.score === 3 ? "text-warning" : "text-success"
                }`}>
                  {strength.label}
                </span>
              </div>
              <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden border border-border/10">
                <div 
                  className={`h-full transition-all duration-300 ${strength.color}`} 
                  style={{ width: `${(strength.score / 4) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Passwort bestätigen */}
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            Passwort bestätigen
          </label>
          <input
            type="password"
            required
            disabled={loading}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="••••••••"
            className={`w-full bg-surface-2 border rounded px-4 py-2.5 text-text placeholder-text-muted/30 focus:outline-none transition-all disabled:opacity-50 ${
              valErrors.passwordConfirm 
                ? "border-danger focus:border-danger focus:ring-1 focus:ring-danger/30" 
                : "border-border/20 focus:border-primary/60 focus:ring-1 focus:ring-primary/30"
            }`}
          />
          {valErrors.passwordConfirm && (
            <p className="text-xs text-danger mt-1">{valErrors.passwordConfirm}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="w-full relative bg-primary hover:bg-primary/80 text-bg py-3 px-4 rounded font-display tracking-widest font-bold uppercase transition-all shadow-[0_0_15px_var(--color-glow)] hover:shadow-[0_0_20px_var(--color-primary)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 overflow-hidden"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Registriere...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-5 w-5" />
              <span>Account erstellen</span>
            </>
          )}
        </button>

        <div className="text-center pt-4 border-t border-border/10">
          <span className="text-sm text-muted">Bereits registriert? </span>
          <Link
            href="/login"
            className="text-sm text-primary hover:text-primary/80 hover:underline transition-all font-semibold"
          >
            Jetzt einloggen
          </Link>
        </div>
      </form>
    </div>
  )
}
