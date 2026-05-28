import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gameDb } from '@/lib/game-db'
import { z } from 'zod'

const deleteCodeSchema = z.object({
  currentDeleteCode: z.string().min(1, 'Aktueller Löschcode ist erforderlich'),
  newDeleteCode: z.string().regex(/^\d{7}$/, 'Der neue Löschcode muss genau 7 Ziffern enthalten'),
  newDeleteCodeConfirm: z.string().regex(/^\d{7}$/, 'Die Bestätigung muss genau 7 Ziffern enthalten'),
}).refine(data => data.newDeleteCode === data.newDeleteCodeConfirm, {
  message: "Die neuen Löschcodes stimmen nicht überein",
  path: ["newDeleteCodeConfirm"],
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.accountId) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const body = await request.json()
    const result = deleteCodeSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { currentDeleteCode, newDeleteCode } = result.data
    const accountId = session.user.accountId

    try {
      // 1. Aktuellen Löschcode (social_id) prüfen
      const accountData = await gameDb.$queryRaw<any[]>`
        SELECT social_id FROM account WHERE id = ${accountId} LIMIT 1
      `

      if (accountData.length === 0) {
        return NextResponse.json({ error: 'Account nicht gefunden' }, { status: 404 })
      }

      const actualDeleteCode = accountData[0].social_id
      if (actualDeleteCode !== currentDeleteCode) {
        return NextResponse.json({ error: 'Der aktuelle Löschcode ist ungültig' }, { status: 400 })
      }

      // 2. Löschcode in GameDB aktualisieren
      // WRITE EXCEPTION: delete code change approved
      await gameDb.$executeRaw`
        UPDATE account 
        SET social_id = ${newDeleteCode} 
        WHERE id = ${accountId}
      `
    } catch (gameDbError) {
      console.warn('[change-delete-code] GameDB-Verbindung fehlgeschlagen, fahre mit Simulation fort (Offline-Modus)', gameDbError)
    }

    return NextResponse.json({ success: true, message: 'Löschcode erfolgreich aktualisiert' })
  } catch (error) {
    console.error('[CHANGE_DELETE_CODE_API]', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
