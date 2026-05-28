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
  .refine((d) => d.password === d.passwordConfirm, {
    message: 'Passwörter stimmen nicht überein',
    path: ['passwordConfirm'],
  })
  .refine((d) => d.deleteCode === d.deleteCodeConfirm, {
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
const strengthColor = {
  weak: 'bg-danger',
  medium: 'bg-warning',
  strong: 'bg-success',
}
const strengthWidth = { weak: 'w-1/3', medium: 'w-2/3', strong: 'w-full' }

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormFields>({
    accountName: '',
    email: '',
    password: '',
    passwordConfirm: '',
    deleteCode: '',
    deleteCodeConfirm: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const set = useCallback(
    (field: keyof FormFields) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
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

      // Auto-Login nach Erfolg
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-lg">
        <h1 className="font-display text-primary text-3xl tracking-widest uppercase text-center mb-8">
          Registrieren
        </h1>

        <div className="bg-surface border border-border rounded-lg shadow-[0_0_20px_var(--color-glow)] p-8">
          {serverError && (
            <div className="mb-6 p-3 rounded bg-danger/10 border border-danger text-danger text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Account-Name */}
            <Field
              id="accountName"
              label="Account-Name"
              hint="Dieser Name wird dein Ingame-Loginname"
              type="text"
              value={form.accountName}
              onChange={set('accountName')}
              error={fieldErrors.accountName}
            />

            {/* E-Mail */}
            <Field
              id="email"
              label="E-Mail"
              type="email"
              value={form.email}
              onChange={set('email')}
              error={fieldErrors.email}
            />

            {/* Passwort */}
            <div>
              <Field
                id="password"
                label="Passwort"
                type="password"
                value={form.password}
                onChange={set('password')}
                error={fieldErrors.password}
              />
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        strengthWidth[passwordStrength]
                      } ${strengthColor[passwordStrength]}`}
                    />
                  </div>
                  <p className="text-xs text-muted mt-1">
                    Stärke:{' '}
                    <span
                      className={
                        passwordStrength === 'strong'
                          ? 'text-success'
                          : passwordStrength === 'medium'
                          ? 'text-warning'
                          : 'text-danger'
                      }
                    >
                      {strengthLabel[passwordStrength]}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Passwort bestätigen */}
            <Field
              id="passwordConfirm"
              label="Passwort bestätigen"
              type="password"
              value={form.passwordConfirm}
              onChange={set('passwordConfirm')}
              error={fieldErrors.passwordConfirm}
            />

            {/* Löschcode */}
            <Field
              id="deleteCode"
              label="Löschcode"
              hint="7-stelliger Code zum Löschen von Items und Charakteren"
              type="password"
              inputMode="numeric"
              maxLength={7}
              value={form.deleteCode}
              onChange={set('deleteCode')}
              onKeyDown={onlyDigits}
              error={fieldErrors.deleteCode}
            />

            {/* Löschcode bestätigen */}
            <Field
              id="deleteCodeConfirm"
              label="Löschcode bestätigen"
              type="password"
              inputMode="numeric"
              maxLength={7}
              value={form.deleteCodeConfirm}
              onChange={set('deleteCodeConfirm')}
              onKeyDown={onlyDigits}
              error={fieldErrors.deleteCodeConfirm}
            />

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
                  Wird registriert…
                </>
              ) : (
                'Account erstellen'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-muted text-sm">
            Bereits registriert?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Wiederverwendbares Feld ───────────────────────────────────────
interface FieldProps {
  id: string
  label: string
  hint?: string
  type?: string
  inputMode?: 'numeric' | 'text' | 'email'
  maxLength?: number
  value: string
  onChange: React.ChangeEventHandler<HTMLInputElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>
  error?: string
}

function Field({
  id,
  label,
  hint,
  type = 'text',
  inputMode,
  maxLength,
  value,
  onChange,
  onKeyDown,
  error,
}: FieldProps) {
  return (
    <div>
      <label className="block text-muted text-sm mb-1" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className={`w-full bg-surface-2 border rounded px-3 py-2 text-text
                    focus:outline-none transition-all
                    ${
                      error
                        ? 'border-danger focus:shadow-[0_0_8px_var(--color-danger)]'
                        : 'border-border focus:border-primary focus:shadow-[0_0_8px_var(--color-glow)]'
                    }`}
      />
      {hint && !error && <p className="text-xs text-muted mt-1">{hint}</p>}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  )
}
