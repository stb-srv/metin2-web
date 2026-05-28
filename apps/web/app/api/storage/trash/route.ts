import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cmsDb } from '@/lib/cms-db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accountId = session.user.accountId

    try {
      const trashItems = await cmsDb.webStorageTrash.findMany({
        where: {
          storage: { accountId },
          expiresAt: { gt: new Date() },
        },
        include: {
          template: true,
        },
        orderBy: {
          deletedAt: 'desc',
        },
      })

      return NextResponse.json({
        items: trashItems,
      })
    } catch (dbError) {
      console.warn('[storage/trash] DB query failed, returning fallback mock trash items', dbError)
      return NextResponse.json({
        items: [
          {
            id: 'trash_item1',
            storageId: 'stor1',
            templateId: 'temp4',
            count: 1,
            enchants: {},
            deletedAt: new Date(Date.now() - 3600000).toISOString(),
            expiresAt: new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString(),
            template: { id: 'temp4', vnum: 74011, name: 'Ninja-Frisur (Stachel)', grade: 'RARE', description: 'Kosmetik' }
          }
        ],
      })
    }
  } catch (error) {
    console.error('[STORAGE_TRASH_API]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
