import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cmsDb } from '@/lib/cms-db'
import { z } from 'zod'

const restoreSchema = z.object({
  trashId: z.string(),
  targetSlot: z.number().int().min(0).max(999),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = restoreSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const { trashId, targetSlot } = validation.data
    const accountId = session.user.accountId

    try {
      await cmsDb.$transaction(async (tx) => {
        // Find storage
        const storage = await tx.webStorage.findUnique({
          where: { accountId },
        })
        if (!storage) throw new Error('Lager existiert nicht.')

        const storageId = storage.id

        // Load trash item
        const trashItem = await tx.webStorageTrash.findUnique({
          where: { id: trashId },
        })

        if (!trashItem || trashItem.storageId !== storageId) {
          throw new Error('Gegenstand im Papierkorb nicht gefunden.')
        }

        if (new Date(trashItem.expiresAt) <= new Date()) {
          throw new Error('Dieser Gegenstand ist bereits abgelaufen und kann nicht wiederhergestellt werden.')
        }

        // Verify targetSlot is free
        const occupied = await tx.webStorageItem.findUnique({
          where: {
            storageId_slot: { storageId, slot: targetSlot },
          },
        })

        if (occupied) {
          throw new Error('Der gewählte Slot ist bereits belegt.')
        }

        // Recreate the item in storage
        await tx.webStorageItem.create({
          data: {
            storageId,
            templateId: trashItem.templateId,
            slot: targetSlot,
            count: trashItem.count,
            enchants: trashItem.enchants ?? {},
          },
        })

        // Remove from trash
        await tx.webStorageTrash.delete({
          where: { id: trashId },
        })
      })

      return NextResponse.json({ success: true })
    } catch (dbError: any) {
      console.error('[storage/trash/restore] DB transaction failed', dbError)
      return NextResponse.json({ error: dbError.message || 'Wiederherstellung fehlgeschlagen.' }, { status: 400 })
    }
  } catch (error) {
    console.error('[STORAGE_TRASH_RESTORE_API]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
