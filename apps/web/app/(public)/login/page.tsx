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

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#0f1014',
    border: '1px solid var(--color-border)',
    borderRadius: 4, padding: '12px 14px',
    color: 'var(--color-text)', fontFamily: 'var(--font-body)',
    fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.15s',
    boxSizing: 'border-box',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)', padding: '0 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo / Server-Name */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem',
            color: 'var(--color-primary)', textTransform: 'uppercase',
            letterSpacing: '0.1em', margin: 0,
          }}>
            Metin2 Web
          </h1>
          {/* Rote Trennlinie */}
          <div style={{
            width: 48, height: 2, background: 'var(--color-primary)',
            margin: '12px auto 0', borderRadius: 1,
          }} />
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 6, padding: '32px 28px',
        }}>
          {error && (
            <div style={{
              marginBottom: 20, padding: '10px 14px', borderRadius: 4,
              background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.35)',
              color: 'var(--color-danger)', fontFamily: 'var(--font-display)', fontSize: '0.82rem',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Identifier */}
            <div>
              <label htmlFor="identifier" style={{
                display: 'block', marginBottom: 7,
                fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700,
                color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Benutzername oder E-Mail
              </label>
              <input
                id="identifier"
                type="text"
                required
                autoComplete="username"
                placeholder="dein-name oder name@beispiel.de"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
              />
            </div>

            {/* Passwort */}
            <div>
              <label htmlFor="password" style={{
                display: 'block', marginBottom: 7,
                fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700,
                color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Passwort
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={e => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: 48, marginTop: 4,
                background: loading ? 'var(--color-surface-2)' : 'var(--color-primary)',
                border: 'none', borderRadius: 4, color: '#fff',
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem',
                textTransform: 'uppercase', letterSpacing: '0.1em',
                cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#a93226' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--color-primary)' }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                    display: 'inline-block', animation: 'spin 0.7s linear infinite',
                  }} />
                  Wird angemeldet…
                </>
              ) : 'Anmelden'}
            </button>
          </form>

          <p style={{
            marginTop: 20, textAlign: 'center',
            fontFamily: 'var(--font-body)', fontSize: '0.85rem',
            color: 'var(--color-text-muted)',
          }}>
            Noch kein Account?{' '}
            <Link href="/register" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
              Jetzt registrieren →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
