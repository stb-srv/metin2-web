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

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Verboten' }, { status: 403 })
    }

    const categories = await cmsDb.shopCategory.findMany({
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('[ADMIN_CATEGORIES_GET]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Verboten' }, { status: 403 })
    }

    const body = await request.json()
    const validation = categorySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 })
    }

    const category = await cmsDb.shopCategory.create({
      data: validation.data
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('[ADMIN_CATEGORIES_POST]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
