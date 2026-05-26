import { NextResponse } from "next/server"
import { cmsDb } from "@/lib/cms-db"
import { gameDb } from "@/lib/game-db"
import bcrypt from "bcryptjs"
import * as z from "zod"

const registerSchema = z.object({
  accountName: z
    .string()
    .min(4, "Account-Name muss mindestens 4 Zeichen lang sein")
    .max(16, "Account-Name darf maximal 16 Zeichen lang sein")
    .regex(/^[a-zA-Z0-9_]+$/, "Account-Name darf nur Buchstaben, Zahlen und Unterstriche enthalten"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen lang sein"),
  passwordConfirm: z.string()
}).refine(data => data.password === data.passwordConfirm, {
  message: "Passwörter stimmen nicht überein",
  path: ["passwordConfirm"]
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Zod validieren
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validierungsfehler" },
        { status: 400 }
      )
    }

    const { accountName, email, password } = result.data

    // Schritt 1 — Duplikat-Prüfung:
    // a) E-Mail in CMS-DB prüfen
    const existingCmsUser = await cmsDb.user.findFirst({
      where: { email }
    })
    if (existingCmsUser) {
      return NextResponse.json(
        { error: "E-Mail bereits vergeben" },
        { status: 409 }
      )
    }

    // b) Account-Name in Ingame-DB prüfen
    const existingGameAccounts = await gameDb.$queryRaw<any[]>`
      SELECT id FROM account WHERE login = ${accountName} LIMIT 1
    `
    if (existingGameAccounts && existingGameAccounts.length > 0) {
      return NextResponse.json(
        { error: "Account-Name bereits vergeben" },
        { status: 409 }
      )
    }

    // Schritt 2 — Ingame-Account anlegen (gameDb, RAW SQL)
    // WRITE EXCEPTION: account creation approved
    await gameDb.$executeRaw`
      INSERT INTO account (login, password, social_id, email, status, availDt, mPointMeth)
      VALUES (
        ${accountName},
        SHA2(${password}, 256),
        '',
        ${email},
        'OK',
        NOW(),
        0
      )
    `

    // Account ID abfragen
    const lastInsertIdResult = await gameDb.$queryRaw<any[]>`SELECT LAST_INSERT_ID() as id`
    let gameAccountId = Number(lastInsertIdResult[0]?.id)
    if (!gameAccountId) {
      const backupResult = await gameDb.$queryRaw<any[]>`
        SELECT id FROM account WHERE login = ${accountName} LIMIT 1
      `
      gameAccountId = Number(backupResult[0]?.id)
    }

    if (!gameAccountId) {
      return NextResponse.json(
        { error: "Fehler beim Anlegen des Spiel-Accounts" },
        { status: 500 }
      )
    }

    // CMS-DB Operationen in einer Transaktion ausführen
    await cmsDb.$transaction(async (tx) => {
      // Schritt 3 — CMS User anlegen
      await tx.user.create({
        data: {
          email,
          name: accountName,
          password: await bcrypt.hash(password, 12),
          accountId: gameAccountId,
          role: "USER"
        }
      })

      // Schritt 4 — Web-Lager anlegen
      await tx.webStorage.create({
        data: {
          accountId: gameAccountId,
          maxSlots: 1000
        }
      })
    })

    return NextResponse.json(
      { message: "Account erfolgreich erstellt" },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Registrierung fehlgeschlagen:", error)
    return NextResponse.json(
      { error: "Registrierung fehlgeschlagen. Bitte versuche es später noch einmal." },
      { status: 500 }
    )
  }
}
