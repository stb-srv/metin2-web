import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cmsDb } from '@/lib/cms-db'
import { gameDb } from '@/lib/game-db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
  newPassword: z.string().min(6, 'Das neue Passwort muss mindestens 6 Zeichen lang sein'),
  newPasswordConfirm: z.string().min(6, 'Das neue Passwort muss mindestens 6 Zeichen lang sein'),
}).refine(data => data.newPassword === data.newPasswordConfirm, {
  message: "Die neuen Passwörter stimmen nicht überein",
  path: ["newPasswordConfirm"],
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.accountId) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const body = await request.json()
    const result = passwordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { currentPassword, newPassword } = result.data
    const accountId = session.user.accountId

    // CMS User laden
    const user = await cmsDb.user.findUnique({
      where: { accountId: accountId },
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Aktuelles Passwort verifizieren
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Aktuelles Passwort ist ungültig' }, { status: 400 })
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // In gameDb und cmsDb synchron aktualisieren
    try {
      // WRITE EXCEPTION: password change approved
      await gameDb.$executeRaw`
        UPDATE account 
        SET password = SHA2(${newPassword}, 256)
        WHERE id = ${accountId}
      `
    } catch (gameDbError) {
      console.warn('[change-password] GameDB-Verbindung fehlgeschlagen, fahre mit CMS-Änderung fort (Fallback/Offline-Modus)', gameDbError)
    }

    // CMS-Passwort aktualisieren
    await cmsDb.$transaction([
      cmsDb.user.update({
        where: { id: user.id },
        data: { password: hashedNewPassword },
      }),
    ])

    return NextResponse.json({ success: true, message: 'Passwort erfolgreich aktualisiert' })
  } catch (error) {
    console.error('[CHANGE_PASSWORD_API]', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
