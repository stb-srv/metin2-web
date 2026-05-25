import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"
import { cmsDb } from "@/lib/cms-db"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const logs = await cmsDb.adminItemGrant.findMany({
      skip,
      take: limit,
      orderBy: { grantedAt: "desc" },
      include: {
        itemTemplate: true
      }
    })

    const adminIds = [...new Set(logs.map(l => l.adminId))]
    const admins = await cmsDb.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, name: true, email: true }
    })
    const adminMap = new Map(admins.map(a => [a.id, a]))

    const total = await cmsDb.adminItemGrant.count()

    const enrichedLogs = logs.map(l => ({
      ...l,
      admin: adminMap.get(l.adminId) || { name: "Unknown" }
    }))

    return NextResponse.json({
      data: enrichedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("[ADMIN_ITEM_GRANT_LOG]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
