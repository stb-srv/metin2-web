import { NextRequest, NextResponse } from "next/server"
import { cmsDb } from "@/lib/cms-db"

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const result = await cmsDb.webStorageTrash.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    })

    return NextResponse.json({ success: true, deletedCount: result.count })
  } catch (error) {
    console.error("[CRON_CLEANUP_TRASH]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
