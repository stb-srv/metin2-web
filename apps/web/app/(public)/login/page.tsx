"use client"

import { useState, useEffect, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ShieldAlert, Loader2 } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if NextAuth passed an error parameter
    const errorParam = searchParams.get("error")
    if (errorParam) {
      if (errorParam === "CredentialsSignin") {
        setError("Ungültige E-Mail-Adresse oder Passwort.")
      } else {
        setError("Ein Fehler ist während des Logins aufgetreten. Bitte versuche es erneut.")
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        // NextAuth returned an error
        setError(result.error || "Ungültige E-Mail-Adresse oder Passwort.")
        setLoading(false)
      } else if (result?.ok) {
        // Redirection on success
        router.push("/dashboard")
        router.refresh()
      } else {
        setError("Etwas ist schiefgelaufen. Bitte versuche es erneut.")
        setLoading(false)
      }
    } catch (err) {
      setError("Verbindung zum Server fehlgeschlagen.")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-3 bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded text-sm animate-shake">
          <ShieldAlert className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          E-Mail-Adresse
        </label>
        <input
          type="email"
          required
          disabled={loading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="beispiel@domain.de"
          className="w-full bg-surface-2 border border-border/20 rounded px-4 py-3 text-text placeholder-text-muted/30 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">
          Passwort
        </label>
        <input
          type="password"
          required
          disabled={loading}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full bg-surface-2 border border-border/20 rounded px-4 py-3 text-text placeholder-text-muted/30 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-all disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full relative bg-primary hover:bg-primary/80 text-bg py-3.5 px-4 rounded font-display tracking-widest font-bold uppercase transition-all shadow-[0_0_15px_var(--color-glow)] hover:shadow-[0_0_20px_var(--color-primary)] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 overflow-hidden"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Anmelden...</span>
          </>
        ) : (
          <span>Anmelden</span>
        )}
      </button>

      <div className="text-center pt-4 border-t border-border/10">
        <span className="text-sm text-muted">Noch kein Konto? </span>
        <Link
          href="/register"
          className="text-sm text-primary hover:text-primary/80 hover:underline transition-all font-semibold"
        >
          Jetzt registrieren
        </Link>
      </div>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-md bg-surface border border-border/30 rounded-lg p-8 shadow-[0_0_40px_rgba(0,0,0,0.6),_0_0_20px_var(--color-glow)] backdrop-blur-md">
      <div className="text-center mb-6">
        <div className="mx-auto hex-icon w-16 h-16 flex items-center justify-center bg-primary/20 border border-primary/40 mb-4 shadow-[0_0_25px_var(--color-glow)]">
          <span className="text-primary font-display font-bold text-2xl mt-1 select-none">M</span>
        </div>
        <h2 className="text-3xl font-display text-primary tracking-widest uppercase">
          Login
        </h2>
        <p className="text-xs text-muted mt-2 uppercase tracking-widest">
          Metin2 Web Portal
        </p>
      </div>

      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="text-sm text-muted">Lade Login...</span>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
