import { NextRequest, NextResponse } from "next/server"
import { cmsDb } from "@/lib/cms-db"
import { getServerSession } from "next-auth"
import { z } from "zod"

const newsSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
  excerpt: z.string().optional(),
  published: z.boolean().default(false),
  pinned: z.boolean().default(false),
  category: z.enum(["NEWS", "UPDATE", "EVENT", "MAINTENANCE"]).default("NEWS"),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    const body = await req.json()
    const parsed = newsSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Invalid data", details: parsed.error }, { status: 400 })

    const news = await cmsDb.news.create({
      data: {
        ...parsed.data,
        authorId: session.user?.email || "Admin",
      }
    })

    return NextResponse.json(news)
  } catch (error) {
    console.error("[NEWS_POST]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
