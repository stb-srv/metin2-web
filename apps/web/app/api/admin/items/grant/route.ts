import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"
import { cmsDb } from "@/lib/cms-db"
import { gameDb } from "@/lib/game-db"
import { z } from "zod"

const grantSchema = z.object({
  accountName: z.string(),
  accountId: z.number(),
  itemTemplateId: z.string(),
  count: z.number().min(1),
  destination: z.enum(["ingame", "web"]),
  note: z.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const adminId = session.user.id
    const body = await req.json()
    const validation = grantSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    const { accountName, accountId, itemTemplateId, count, destination, note } = validation.data

    const template = await cmsDb.itemTemplate.findUnique({
      where: { id: itemTemplateId }
    })

    if (!template) {
      return NextResponse.json({ error: "Item Template not found" }, { status: 404 })
    }

    let success = false
    let errorMessage = ""

    try {
      if (destination === "ingame") {
        await gameDb.$executeRaw`
          INSERT INTO item_award (login, vnum, count, given_time, mall)
          VALUES (${accountName}, ${template.vnum}, ${count}, NOW(), 1)
        `
        success = true
      } else {
        let storage = await cmsDb.webStorage.findUnique({ where: { accountId } })
        if (!storage) {
          storage = await cmsDb.webStorage.create({ data: { accountId, maxSlots: 1000 } })
        }

        const currentItems = await cmsDb.webStorageItem.findMany({
          where: { storageId: storage.id },
          select: { slot: true }
        })

        if (currentItems.length >= storage.maxSlots) {
          throw new Error("Das Web-Lager des Spielers ist voll.")
        }

        const occupiedSlots = new Set(currentItems.map(i => i.slot))
        let freeSlot = 0
        while (occupiedSlots.has(freeSlot)) {
          freeSlot++
        }

        await cmsDb.webStorageItem.create({
          data: {
            storageId: storage.id,
            templateId: template.id,
            count,
            slot: freeSlot
          }
        })
        success = true
      }
    } catch (e: any) {
      success = false
      errorMessage = e.message || "Unknown error during grant execution."
    }

    await cmsDb.adminItemGrant.create({
      data: {
        adminId,
        accountId,
        itemTemplateId,
        count,
        destination,
        note: success ? note : `FAILED: ${errorMessage} | ${note || ""}`
      }
    })

    if (!success) {
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("[ADMIN_ITEM_GRANT]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
