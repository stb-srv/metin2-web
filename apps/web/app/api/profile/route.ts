import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cmsDb } from '@/lib/cms-db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.accountId) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const user = await cmsDb.user.findUnique({
      where: { accountId: session.user.accountId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountId: true,
        createdAt: true,
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('[GET_PROFILE_API]', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}
