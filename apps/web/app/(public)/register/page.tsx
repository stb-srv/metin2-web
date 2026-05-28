'use client'

import { useState, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'

// ── Zod Schema (Frontend-Validierung) ────────────────────────────
const registerSchema = z
  .object({
    accountName: z
      .string()
      .min(4, 'Mindestens 4 Zeichen')
      .max(16, 'Maximal 16 Zeichen')
      .regex(/^[a-zA-Z0-9_]+$/, 'Nur Buchstaben, Zahlen und _ erlaubt'),
    email: z.string().email('Ungültige E-Mail'),
    password: z
      .string()
      .min(8, 'Mindestens 8 Zeichen')
      .regex(/[0-9]/, 'Mindestens eine Zahl')
      .regex(/[A-Z]/, 'Mindestens ein Großbuchstabe'),
    passwordConfirm: z.string(),
    deleteCode: z.string().regex(/^[0-9]{7}$/, 'Genau 7 Ziffern erforderlich'),
    deleteCodeConfirm: z.string(),
  })
  .refine(d => d.password === d.passwordConfirm, {
    message: 'Passwörter stimmen nicht überein',
    path: ['passwordConfirm'],
  })
  .refine(d => d.deleteCode === d.deleteCodeConfirm, {
    message: 'Löschcodes stimmen nicht überein',
    path: ['deleteCodeConfirm'],
  })

type FormFields = z.infer<typeof registerSchema>
type FieldErrors = Partial<Record<keyof FormFields, string>>

function getPasswordStrength(pw: string): 'weak' | 'medium' | 'strong' {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  if (score <= 1) return 'weak'
  if (score === 2) return 'medium'
  return 'strong'
}

const strengthLabel = { weak: 'Schwach', medium: 'Mittel', strong: 'Stark' }
const strengthColor = { weak: 'var(--color-danger)', medium: 'var(--color-warning)', strong: 'var(--color-success)' }
const strengthWidth = { weak: '33%', medium: '66%', strong: '100%' }

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormFields>({
    accountName: '', email: '', password: '',
    passwordConfirm: '', deleteCode: '', deleteCodeConfirm: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = useCallback(
    (field: keyof FormFields) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }))
      setFieldErrors(prev => ({ ...prev, [field]: undefined }))
    },
    []
  )

  const onlyDigits = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight']
    if (!allowed.includes(e.key) && !/^[0-9]$/.test(e.key)) e.preventDefault()
  }

  const passwordStrength = getPasswordStrength(form.password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)

    const parsed = registerSchema.safeParse(form)
    if (!parsed.success) {
      const errs: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormFields
        if (key) errs[key] = issue.message
      }
      setFieldErrors(errs)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })

      const data: { error?: string; message?: string } = await res.json()

      if (!res.ok) {
        setServerError(data.error ?? 'Registrierung fehlgeschlagen')
        setLoading(false)
        return
      }

      await signIn('credentials', {
        redirect: false,
        email: parsed.data.email,
        password: parsed.data.password,
      })
      router.push('/dashboard')
    } catch {
      setServerError('Netzwerkfehler — bitte erneut versuchen')
      setLoading(false)
    }
  }

  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%', background: '#0f1014',
    border: `1px solid ${hasError ? 'var(--color-danger)' : 'var(--color-border)'}`,
    borderRadius: 4, padding: '11px 14px',
    color: 'var(--color-text)', fontFamily: 'var(--font-body)',
    fontSize: '0.875rem', outline: 'none', transition: 'border-color 0.15s',
    boxSizing: 'border-box' as const,
  })

  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: 6,
    fontFamily: 'var(--font-display)', fontSize: '0.7rem', fontWeight: 700,
    color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)', padding: '32px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem',
            color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0,
          }}>
            Registrieren
          </h1>
          <div style={{ width: 48, height: 2, background: 'var(--color-primary)', margin: '12px auto 0', borderRadius: 1 }} />
        </div>

        <div style={{
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 6, padding: '32px 28px',
        }}>
          {serverError && (
            <div style={{
              marginBottom: 20, padding: '10px 14px', borderRadius: 4,
              background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.35)',
              color: 'var(--color-danger)', fontFamily: 'var(--font-display)', fontSize: '0.82rem',
            }}>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
            {/* Account-Name */}
            <div>
              <label style={labelStyle}>Account-Name</label>
              <input
                id="accountName" type="text" value={form.accountName}
                onChange={set('accountName')} style={inputStyle(!!fieldErrors.accountName)}
                onFocus={e => { if (!fieldErrors.accountName) e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { if (!fieldErrors.accountName) e.currentTarget.style.borderColor = 'var(--color-border)' }}
              />
              {fieldErrors.accountName && <p style={{ color: 'var(--color-danger)', fontSize: '0.72rem', marginTop: 4, fontFamily: 'var(--font-display)' }}>{fieldErrors.accountName}</p>}
              {!fieldErrors.accountName && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem', marginTop: 4, fontFamily: 'var(--font-body)' }}>Dein Ingame-Loginname</p>}
            </div>

            {/* E-Mail */}
            <div>
              <label style={labelStyle}>E-Mail</label>
              <input
                id="email" type="email" value={form.email} onChange={set('email')}
                style={inputStyle(!!fieldErrors.email)}
                onFocus={e => { if (!fieldErrors.email) e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { if (!fieldErrors.email) e.currentTarget.style.borderColor = 'var(--color-border)' }}
              />
              {fieldErrors.email && <p style={{ color: 'var(--color-danger)', fontSize: '0.72rem', marginTop: 4, fontFamily: 'var(--font-display)' }}>{fieldErrors.email}</p>}
            </div>

            {/* Passwort + Stärke */}
            <div>
              <label style={labelStyle}>Passwort</label>
              <input
                id="password" type="password" value={form.password} onChange={set('password')}
                style={inputStyle(!!fieldErrors.password)}
                onFocus={e => { if (!fieldErrors.password) e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { if (!fieldErrors.password) e.currentTarget.style.borderColor = 'var(--color-border)' }}
              />
              {form.password.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ height: 4, background: 'var(--color-surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2, transition: 'all 0.3s',
                      width: strengthWidth[passwordStrength],
                      background: strengthColor[passwordStrength],
                    }} />
                  </div>
                  <p style={{ fontSize: '0.7rem', marginTop: 4, fontFamily: 'var(--font-display)', color: strengthColor[passwordStrength] }}>
                    Stärke: {strengthLabel[passwordStrength]}
                  </p>
                </div>
              )}
              {fieldErrors.password && <p style={{ color: 'var(--color-danger)', fontSize: '0.72rem', marginTop: 4, fontFamily: 'var(--font-display)' }}>{fieldErrors.password}</p>}
            </div>

            {/* Passwort bestätigen */}
            <div>
              <label style={labelStyle}>Passwort bestätigen</label>
              <input
                id="passwordConfirm" type="password" value={form.passwordConfirm} onChange={set('passwordConfirm')}
                style={inputStyle(!!fieldErrors.passwordConfirm)}
                onFocus={e => { if (!fieldErrors.passwordConfirm) e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { if (!fieldErrors.passwordConfirm) e.currentTarget.style.borderColor = 'var(--color-border)' }}
              />
              {fieldErrors.passwordConfirm && <p style={{ color: 'var(--color-danger)', fontSize: '0.72rem', marginTop: 4, fontFamily: 'var(--font-display)' }}>{fieldErrors.passwordConfirm}</p>}
            </div>

            {/* Löschcode */}
            <div>
              <label style={labelStyle}>Löschcode</label>
              <input
                id="deleteCode" type="password" inputMode="numeric" maxLength={7}
                value={form.deleteCode} onChange={set('deleteCode')} onKeyDown={onlyDigits}
                style={inputStyle(!!fieldErrors.deleteCode)}
                onFocus={e => { if (!fieldErrors.deleteCode) e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { if (!fieldErrors.deleteCode) e.currentTarget.style.borderColor = 'var(--color-border)' }}
              />
              {fieldErrors.deleteCode
                ? <p style={{ color: 'var(--color-danger)', fontSize: '0.72rem', marginTop: 4, fontFamily: 'var(--font-display)' }}>{fieldErrors.deleteCode}</p>
                : <p style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem', marginTop: 4, fontFamily: 'var(--font-body)' }}>7-stellige Zahl — zum Löschen von Charakteren</p>
              }
            </div>

            {/* Löschcode bestätigen */}
            <div>
              <label style={labelStyle}>Löschcode bestätigen</label>
              <input
                id="deleteCodeConfirm" type="password" inputMode="numeric" maxLength={7}
                value={form.deleteCodeConfirm} onChange={set('deleteCodeConfirm')} onKeyDown={onlyDigits}
                style={inputStyle(!!fieldErrors.deleteCodeConfirm)}
                onFocus={e => { if (!fieldErrors.deleteCodeConfirm) e.currentTarget.style.borderColor = 'var(--color-primary)' }}
                onBlur={e => { if (!fieldErrors.deleteCodeConfirm) e.currentTarget.style.borderColor = 'var(--color-border)' }}
              />
              {fieldErrors.deleteCodeConfirm && <p style={{ color: 'var(--color-danger)', fontSize: '0.72rem', marginTop: 4, fontFamily: 'var(--font-display)' }}>{fieldErrors.deleteCodeConfirm}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: 48, marginTop: 8,
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
                  Wird registriert…
                </>
              ) : 'Account erstellen'}
            </button>
          </form>

          <p style={{
            marginTop: 20, textAlign: 'center',
            fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--color-text-muted)',
          }}>
            Bereits registriert?{' '}
            <Link href="/login" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>
              Anmelden →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
