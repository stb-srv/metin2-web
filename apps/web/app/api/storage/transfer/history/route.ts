import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { cmsDb } from "@/lib/cms-db"

export async function GET(req: NextRequest) {
  try {
    // a) Session prüfen
    const session = await getServerSession(authOptions)
    if (!session?.user?.accountId) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }
    const accountId = session.user.accountId

    // b) WebStorage des Spielers laden
    const storage = await cmsDb.webStorage.findUnique({
      where: { accountId }
    })

    if (!storage) {
      return NextResponse.json([])
    }

    // c) Letzte 50 Transfers holen
    const transfers = await cmsDb.itemTransfer.findMany({
      where: { storageId: storage.id },
      include: {
        itemTemplate: true
      },
      orderBy: {
        requestedAt: "desc"
      },
      take: 50
    })

    return NextResponse.json(transfers)
  } catch (error) {
    console.error("[STORAGE_TRANSFER_HISTORY_GET]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
