import { NextRequest, NextResponse } from "next/server"
import { cmsDb } from "@/lib/cms-db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.accountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const accountId = session.user.accountId

    let storage = await cmsDb.webStorage.findUnique({
      where: { accountId },
      include: {
        items: {
          include: {
            template: true
          }
        }
      }
    })

    if (!storage) {
      storage = await cmsDb.webStorage.create({
        data: {
          accountId,
          maxSlots: 1000
        },
        include: {
          items: {
            include: { template: true }
          }
        }
      })
    }

    return NextResponse.json(storage)
  } catch (error) {
    console.error("[STORAGE_GET]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
