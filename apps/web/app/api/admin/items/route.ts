import { NextRequest, NextResponse } from "next/server"
import { cmsDb } from "@/lib/cms-db"
import { getServerSession } from "next-auth"
import { z } from "zod"

const itemSchema = z.object({
  vnum: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().optional(),
  iconUrl: z.string().optional(),
  itemType: z.string().min(1),
  grade: z.enum(["NORMAL", "RARE", "EPIC", "LEGENDARY"]).default("NORMAL"),
  attributes: z.any().optional(),
  enabled: z.boolean().default(true),
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || (session.user as any)?.role !== 'ADMIN') return new NextResponse("Unauthorized", { status: 401 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const search = searchParams.get("search") || ""
    const grade = searchParams.get("grade") || ""
    const itemType = searchParams.get("itemType") || ""

    const limit = 20
    const skip = (page - 1) * limit

    const whereClause: any = {}

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
      ]
      if (!isNaN(Number(search))) {
        whereClause.OR.push({ vnum: Number(search) })
      }
    }

    if (grade) {
      whereClause.grade = grade
    }

    if (itemType) {
      whereClause.itemType = itemType
    }

    const [items, total] = await Promise.all([
      cmsDb.itemTemplate.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { vnum: "asc" }
      }),
      cmsDb.itemTemplate.count({ where: whereClause })
    ])

    return NextResponse.json({
      items,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    })
  } catch (error) {
    console.error("[ITEMS_GET]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session || (session.user as any)?.role !== 'ADMIN') return new NextResponse("Unauthorized", { status: 401 })

    const body = await req.json()
    const parsed = itemSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error }, { status: 400 })
    }

    const existing = await cmsDb.itemTemplate.findUnique({
      where: { vnum: parsed.data.vnum }
    })

    if (existing) {
      return NextResponse.json({ error: "Ein Item mit dieser VNUM existiert bereits." }, { status: 400 })
    }

    const item = await cmsDb.itemTemplate.create({
      data: parsed.data
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error("[ITEMS_POST]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
