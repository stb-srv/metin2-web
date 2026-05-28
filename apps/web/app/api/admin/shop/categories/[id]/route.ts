import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cmsDb } from '@/lib/cms-db'
import { z } from 'zod'

const categorySchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  icon: z.string().optional().nullable(),
  order: z.number().int().default(0),
  active: z.boolean().default(true),
})

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Verboten' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const validation = categorySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 })
    }

    const updated = await cmsDb.shopCategory.update({
      where: { id },
      data: validation.data
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[ADMIN_CATEGORY_PUT]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Verboten' }, { status: 403 })
    }

    const { id } = await params

    // Wir prüfen ob es Items in dieser Kategorie gibt
    const itemsCount = await cmsDb.shopItem.count({
      where: { categoryId: id }
    })

    if (itemsCount > 0) {
      return NextResponse.json({ error: 'Kategorie enthält noch Items und kann nicht gelöscht werden.' }, { status: 400 })
    }

    await cmsDb.shopCategory.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[ADMIN_CATEGORY_DELETE]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
