import { NextRequest, NextResponse } from "next/server"
import { cmsDb } from "@/lib/cms-db"
import { getServerSession } from "next-auth"
import { z } from "zod"

const itemSchema = z.object({
  vnum: z.number().int().positive().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  iconUrl: z.string().optional(),
  itemType: z.string().min(1).optional(),
  grade: z.enum(["NORMAL", "RARE", "EPIC", "LEGENDARY"]).optional(),
  attributes: z.any().optional(),
  enabled: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session || (session.user as any)?.role !== 'ADMIN') return new NextResponse("Unauthorized", { status: 401 })

    const body = await req.json()
    const parsed = itemSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error }, { status: 400 })
    }

    if (parsed.data.vnum) {
      const existing = await cmsDb.itemTemplate.findFirst({
        where: { vnum: parsed.data.vnum, NOT: { id: params.id } }
      })
      if (existing) {
        return NextResponse.json({ error: "Ein anderes Item mit dieser VNUM existiert bereits." }, { status: 400 })
      }
    }

    const item = await cmsDb.itemTemplate.update({
      where: { id: params.id },
      data: parsed.data
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error("[ITEMS_PATCH]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session || (session.user as any)?.role !== 'ADMIN') return new NextResponse("Unauthorized", { status: 401 })

    const item = await cmsDb.itemTemplate.update({
      where: { id: params.id },
      data: { enabled: false }
    })

    return NextResponse.json({ success: true, item })
  } catch (error) {
    console.error("[ITEMS_DELETE]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
