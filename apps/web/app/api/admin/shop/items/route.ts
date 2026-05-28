import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cmsDb } from '@/lib/cms-db'
import { z } from 'zod'

const shopItemSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  description: z.string().optional().nullable(),
  price: z.number().int().min(0, 'Preis darf nicht negativ sein'),
  currency: z.string().default('DR'),
  imageUrl: z.string().optional().nullable(),
  itemVnum: z.number().int().optional().nullable(),
  enabled: z.boolean().default(true),
  categoryId: z.string().min(1, 'Kategorie ist erforderlich'),
  count: z.number().int().default(1),
  defaultEnchants: z.any().optional().nullable(),
  order: z.number().int().default(0),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Verboten' }, { status: 403 })
    }

    const items = await cmsDb.shopItem.findMany({
      include: {
        category: true,
        itemTemplate: true,
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('[ADMIN_SHOP_ITEMS_GET]', error)
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
    const validation = shopItemSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.errors[0].message }, { status: 400 })
    }

    const data = validation.data
    let itemTemplateId: string | null = null

    // Falls VNUM übergeben, Template suchen
    if (data.itemVnum) {
      const template = await cmsDb.itemTemplate.findUnique({
        where: { vnum: data.itemVnum }
      })
      if (!template) {
        return NextResponse.json({ error: `Keine Item-Vorlage für die VNUM ${data.itemVnum} gefunden. Bitte erstelle diese Vorlage zuerst.` }, { status: 400 })
      }
      itemTemplateId = template.id
    }

    const shopItem = await cmsDb.shopItem.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        currency: data.currency,
        imageUrl: data.imageUrl,
        itemVnum: data.itemVnum,
        itemTemplateId: itemTemplateId,
        enabled: data.enabled,
        categoryId: data.categoryId,
        count: data.count,
        defaultEnchants: data.defaultEnchants || {},
        order: data.order,
      }
    })

    return NextResponse.json(shopItem)
  } catch (error) {
    console.error('[ADMIN_SHOP_ITEMS_POST]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
