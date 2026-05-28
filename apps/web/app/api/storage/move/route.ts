import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cmsDb } from '@/lib/cms-db'
import { z } from 'zod'

const moveSchema = z.object({
  fromSlot: z.number().int().min(0).max(999),
  toSlot: z.number().int().min(0).max(999),
})

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = moveSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const { fromSlot, toSlot } = validation.data
    const accountId = session.user.accountId

    if (fromSlot === toSlot) {
      return NextResponse.json({ success: true })
    }

    try {
      await cmsDb.$transaction(async (tx) => {
        // Find storage
        const storage = await tx.webStorage.findUnique({
          where: { accountId },
        })
        if (!storage) throw new Error('Lager existiert nicht.')

        const storageId = storage.id

        // Load item in fromSlot
        const fromItem = await tx.webStorageItem.findUnique({
          where: {
            storageId_slot: { storageId, slot: fromSlot },
          },
        })

        if (!fromItem) {
          throw new Error('Kein Gegenstand im Ausgangsslot gefunden.')
        }

        // Load item in toSlot (if present)
        const toItem = await tx.webStorageItem.findUnique({
          where: {
            storageId_slot: { storageId, slot: toSlot },
          },
        })

        if (toItem) {
          // SWAP both items using a temporary negative slot value to bypass unique constraint
          await tx.webStorageItem.update({
            where: { id: fromItem.id },
            data: { slot: -1 },
          })

          await tx.webStorageItem.update({
            where: { id: toItem.id },
            data: { slot: fromSlot },
          })

          await tx.webStorageItem.update({
            where: { id: fromItem.id },
            data: { slot: toSlot },
          })
        } else {
          // Simply move fromItem to toSlot
          await tx.webStorageItem.update({
            where: { id: fromItem.id },
            data: { slot: toSlot },
          })
        }
      })

      return NextResponse.json({ success: true })
    } catch (dbError: any) {
      console.error('[storage/move] DB transaction failed', dbError)
      return NextResponse.json({ error: dbError.message || 'Gegenstand konnte nicht verschoben werden.' }, { status: 400 })
    }
  } catch (error) {
    console.error('[STORAGE_MOVE_API]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
