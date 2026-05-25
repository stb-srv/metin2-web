import { NextRequest, NextResponse } from "next/server"
import { cmsDb } from "@/lib/cms-db"
import { getServerSession } from "next-auth"
import { z } from "zod"

const shopItemSchema = z.object({
  categoryId: z.string().min(1),
  price: z.number().int().positive(),
  currency: z.string().default("DR")
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session || (session.user as any)?.role !== 'ADMIN') return new NextResponse("Unauthorized", { status: 401 })

    const body = await req.json()
    const parsed = shopItemSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error }, { status: 400 })
    }

    const itemTemplate = await cmsDb.itemTemplate.findUnique({
      where: { id: params.id }
    })

    if (!itemTemplate) {
      return NextResponse.json({ error: "Item Template not found" }, { status: 404 })
    }

    const existingShopItem = await cmsDb.shopItem.findFirst({
      where: { itemTemplateId: params.id }
    })

    if (existingShopItem) {
      return NextResponse.json({ error: "Dieses Item ist bereits im Shop." }, { status: 400 })
    }

    const shopItem = await cmsDb.shopItem.create({
      data: {
        name: itemTemplate.name,
        description: itemTemplate.description,
        price: parsed.data.price,
        currency: parsed.data.currency,
        imageUrl: itemTemplate.iconUrl,
        itemVnum: itemTemplate.vnum,
        enabled: true,
        categoryId: parsed.data.categoryId,
        itemTemplateId: itemTemplate.id
      }
    })

    return NextResponse.json(shopItem)
  } catch (error) {
    console.error("[ADD_TO_SHOP_POST]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
