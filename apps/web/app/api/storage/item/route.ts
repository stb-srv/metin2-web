import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cmsDb } from '@/lib/cms-db'
import { z } from 'zod'

const deleteSchema = z.object({
  slot: z.number().int().min(0).max(999),
})

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = deleteSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const { slot } = validation.data
    const accountId = session.user.accountId

    try {
      await cmsDb.$transaction(async (tx) => {
        // Find storage
        const storage = await tx.webStorage.findUnique({
          where: { accountId },
        })
        if (!storage) throw new Error('Lager existiert nicht.')

        const storageId = storage.id

        // Load item
        const item = await tx.webStorageItem.findUnique({
          where: {
            storageId_slot: { storageId, slot },
          },
        })

        if (!item) {
          throw new Error('Gegenstand nicht gefunden.')
        }

        // Delete from active storage items
        await tx.webStorageItem.delete({
          where: { id: item.id },
        })

        // Check if trash is full (max 128 items)
        const trashCount = await tx.webStorageTrash.count({
          where: { storageId },
        })

        if (trashCount >= 128) {
          // Prune the oldest deleted item in trash
          const oldest = await tx.webStorageTrash.findFirst({
            where: { storageId },
            orderBy: { deletedAt: 'asc' },
          })
          if (oldest) {
            await tx.webStorageTrash.delete({
              where: { id: oldest.id },
            })
          }
        }

        // Create trash record (expires in 7 days)
        await tx.webStorageTrash.create({
          data: {
            storageId,
            templateId: item.templateId,
            count: item.count,
            enchants: item.enchants ?? {},
            deletedAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        })
      })

      return NextResponse.json({ success: true })
    } catch (dbError: any) {
      console.error('[storage/item] DB deletion failed', dbError)
      return NextResponse.json({ error: dbError.message || 'Gegenstand konnte nicht gelöscht werden.' }, { status: 400 })
    }
  } catch (error) {
    console.error('[STORAGE_ITEM_DELETE_API]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
