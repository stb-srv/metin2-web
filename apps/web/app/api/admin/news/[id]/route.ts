import { NextRequest, NextResponse } from "next/server"
import { cmsDb } from "@/lib/cms-db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { z } from "zod"

const newsSchema = z.object({
  title: z.string().min(3).optional(),
  content: z.string().min(10).optional(),
  excerpt: z.string().optional(),
  published: z.boolean().optional(),
  pinned: z.boolean().optional(),
  category: z.enum(["NEWS", "UPDATE", "EVENT", "MAINTENANCE"]).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    const body = await req.json()
    const parsed = newsSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 })

    const { id } = await params
    const news = await cmsDb.news.update({
      where: { id },
      data: parsed.data
    })

    return NextResponse.json(news)
  } catch (error) {
    console.error("[NEWS_PATCH]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    const { id } = await params
    await cmsDb.news.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[NEWS_DELETE]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
