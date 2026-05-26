import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { cmsDb } from "@/lib/cms-db"
import { gameDb } from "@/lib/game-db"

export async function GET(req: NextRequest) {
  try {
    // 1. Session-Guard
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // 2. Query-Parameter extrahieren
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const adminQuery = searchParams.get("admin") || ""
    const playerQuery = searchParams.get("player") || ""
    const startDateQuery = searchParams.get("startDate") || ""
    const endDateQuery = searchParams.get("endDate") || ""

    const where: any = {}

    // 3. Admin-Filter aufbauen
    if (adminQuery) {
      const matchingAdmins = await cmsDb.user.findMany({
        where: {
          OR: [
            { name: { contains: adminQuery } },
            { email: { contains: adminQuery } }
          ]
        },
        select: { id: true }
      })
      const adminIds = matchingAdmins.map(a => a.id)
      where.adminId = { in: adminIds }
    }

    // 4. Spieler-Filter aufbauen
    if (playerQuery) {
      const parsedPlayerId = parseInt(playerQuery)
      if (!isNaN(parsedPlayerId) && playerQuery.trim() === parsedPlayerId.toString()) {
        where.accountId = parsedPlayerId
      } else {
        const searchPattern = `%${playerQuery}%`
        const matchingAccounts = await gameDb.$queryRaw<any[]>`
          SELECT id FROM account WHERE login LIKE ${searchPattern}
        `
        const accountIds = matchingAccounts.map(a => a.id)
        where.accountId = { in: accountIds }
      }
    }

    // 5. Datums-Filter aufbauen
    if (startDateQuery || endDateQuery) {
      where.grantedAt = {}
      if (startDateQuery) {
        where.grantedAt.gte = new Date(startDateQuery)
      }
      if (endDateQuery) {
        const end = new Date(endDateQuery)
        if (endDateQuery.length <= 10) { // YYYY-MM-DD
          end.setHours(23, 59, 59, 999)
        }
        where.grantedAt.lte = end
      }
    }

    // 6. Logs abfragen
    const logs = await cmsDb.adminItemGrant.findMany({
      where,
      skip,
      take: limit,
      orderBy: { grantedAt: "desc" },
      include: {
        itemTemplate: true
      }
    })

    const total = await cmsDb.adminItemGrant.count({ where })

    // 7. Admin-Namen auflösen
    const adminIds = Array.from(new Set(logs.map(l => l.adminId)))
    const admins = await cmsDb.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, name: true, email: true }
    })
    const adminMap = new Map(admins.map(a => [a.id, a]))

    // 8. Spieler-Accountnamen auflösen
    const playerAccountIds = Array.from(new Set(logs.map(l => l.accountId)))
    const accountMap = new Map<number, string>()
    if (playerAccountIds.length > 0) {
      try {
        const accountsList = await gameDb.$queryRawUnsafe<any[]>(
          `SELECT id, login FROM account WHERE id IN (${playerAccountIds.map(() => "?").join(",")})`,
          ...playerAccountIds
        )
        accountsList.forEach(a => accountMap.set(a.id, a.login))
      } catch (dbErr) {
        console.error("Error fetching account names for grant logs:", dbErr)
      }
    }

    // 9. Logs anreichern
    const enrichedLogs = logs.map(l => ({
      ...l,
      admin: adminMap.get(l.adminId) || { name: "Unbekannt" },
      accountName: accountMap.get(l.accountId) || `ID: ${l.accountId}`
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
    console.error("[ADMIN_ITEM_GRANT_LOG_GET]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
