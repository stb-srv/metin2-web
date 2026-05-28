import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { cmsDb } from '@/lib/cms-db'
import { gameDb } from '@/lib/game-db'

const registerSchema = z
  .object({
    accountName: z
      .string()
      .min(4)
      .max(16)
      .regex(/^[a-zA-Z0-9_]+$/, 'Nur Buchstaben, Zahlen und _ erlaubt'),
    email: z.string().email('Ungültige E-Mail'),
    password: z
      .string()
      .min(8, 'Mindestens 8 Zeichen')
      .regex(/[0-9]/, 'Mindestens eine Zahl erforderlich')
      .regex(/[A-Z]/, 'Mindestens ein Großbuchstabe erforderlich'),
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

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger Request-Body' }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? 'Validierungsfehler' },
      { status: 422 }
    )
  }

  const { accountName, email, password, deleteCode } = parsed.data

  // ── Schritt 1: Duplikat-Prüfung ──────────────────────────────────
  const existingCmsUser = await cmsDb.user.findFirst({ where: { email } })
  if (existingCmsUser) {
    return NextResponse.json({ error: 'E-Mail bereits vergeben' }, { status: 409 })
  }

  const existingGameAccount = await gameDb.$queryRaw<{ id: number }[]>`
    SELECT id FROM account WHERE login = ${accountName} LIMIT 1
  `
  if (existingGameAccount.length > 0) {
    return NextResponse.json({ error: 'Account-Name bereits vergeben' }, { status: 409 })
  }

  // ── Schritt 2 + 3 + 4: Alles in einer CMS-Transaktion ────────────
  // WRITE EXCEPTION: account creation approved
  await gameDb.$executeRaw`
    INSERT INTO account (login, password, social_id, email, status, availDt, mPointMeth)
    VALUES (
      ${accountName},
      SHA2(${password}, 256),
      ${deleteCode},
      ${email},
      'OK',
      NOW(),
      0
    )
  `

  const newGameAccount = await gameDb.$queryRaw<{ id: number }[]>`
    SELECT LAST_INSERT_ID() as id
  `
  const gameAccountId = newGameAccount[0]?.id
  if (!gameAccountId) {
    return NextResponse.json({ error: 'Fehler beim Anlegen des Ingame-Accounts' }, { status: 500 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await cmsDb.$transaction([
    cmsDb.user.create({
      data: {
        email,
        name: accountName,
        password: hashedPassword,
        accountId: gameAccountId,
        role: 'USER',
      },
    }),
    cmsDb.webStorage.create({
      data: {
        accountId: gameAccountId,
        maxSlots: 1000,
      },
    }),
  ])

  return NextResponse.json({ message: 'Account erfolgreich erstellt' }, { status: 201 })
}
