'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signIn('credentials', {
      redirect: false,
      identifier,
      password,
    })

    setLoading(false)

    if (result?.error) {
      setError('Ungültiger Benutzername/E-Mail oder Passwort')
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        {/* Logo / Titel */}
        <h1 className="font-display text-primary text-3xl tracking-widest uppercase text-center mb-8">
          Anmelden
        </h1>

        <div className="bg-surface border border-border rounded-lg shadow-[0_0_20px_var(--color-glow)] p-8">
          {error && (
            <div className="mb-6 p-3 rounded bg-danger/10 border border-danger text-danger text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-muted text-sm mb-1" htmlFor="identifier">
                Benutzername oder E-Mail
              </label>
              <input
                id="identifier"
                type="text"
                required
                autoComplete="username"
                placeholder="dein-name oder name@beispiel.de"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-text
                           focus:outline-none focus:border-primary focus:shadow-[0_0_8px_var(--color-glow)]
                           transition-all"
              />
            </div>

            <div>
              <label className="block text-muted text-sm mb-1" htmlFor="password">
                Passwort
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-text
                           focus:outline-none focus:border-primary focus:shadow-[0_0_8px_var(--color-glow)]
                           transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded bg-primary text-bg font-display tracking-widest uppercase
                         hover:shadow-[0_0_16px_var(--color-glow)] transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-bg border-t-transparent animate-spin" />
                  Wird angemeldet…
                </>
              ) : (
                'Anmelden'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-muted text-sm">
            Noch kein Account?{' '}
            <Link href="/register" className="text-primary hover:underline">
              Jetzt registrieren
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
