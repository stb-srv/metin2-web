import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { cmsDb } from "@/lib/cms-db"
import { gameDb } from "@/lib/game-db"
import { z } from "zod"

const grantSchema = z.object({
  accountName: z.string(),
  itemTemplateId: z.string(),
  count: z.number().int().positive(),
  destination: z.enum(["ingame", "web"]),
  note: z.string().optional()
})

export async function POST(req: NextRequest) {
  let adminId = "unknown"
  
  try {
    // 1. Session prüfen (NUR ADMIN)
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    adminId = session.user.id

    // 2. Eingabe-Validierung
    const body = await req.json()
    const validation = grantSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: "Ungültige Eingabedaten" }, { status: 400 })
    }

    const { accountName, itemTemplateId, count, destination, note } = validation.data

    // 3. Item-Vorlage suchen
    const template = await cmsDb.itemTemplate.findUnique({
      where: { id: itemTemplateId }
    })
    if (!template) {
      return NextResponse.json({ error: "Item-Vorlage nicht gefunden." }, { status: 404 })
    }

    // 4. Spieler-Account auflösen
    const accounts = await gameDb.$queryRaw<any[]>`
      SELECT id FROM account WHERE login = ${accountName} LIMIT 1
    `
    const account = accounts[0]
    if (!account) {
      return NextResponse.json({ error: "Spieler-Account nicht gefunden." }, { status: 404 })
    }
    const accountId = account.id

    let success = false
    let errorMessage = ""

    // 5. Schenkung ausführen
    try {
      if (destination === "ingame") {
        // Raw insert matching Transfer system schema
        await gameDb.$executeRaw`
          INSERT INTO item_award 
          (account_name, item_vnum, item_count, socket0, socket1, socket2,
           attrtype0, attrvalue0, attrtype1, attrvalue1, attrtype2, attrvalue2,
           attrtype3, attrvalue3, attrtype4, attrvalue4, attrtype5, attrvalue5,
           attrtype6, attrvalue6, attrtype7, attrvalue7, given_time, rewarded)
          VALUES (${accountName}, ${template.vnum}, ${count}, 0, 0, 0,
           0, 0, 0, 0, 0, 0,
           0, 0, 0, 0, 0, 0,
           0, 0, 0, 0, NOW(), 0)
        `
        success = true
      } else {
        // Add to Web Storage with transaction safety
        await cmsDb.$transaction(async (tx) => {
          let storage = await tx.webStorage.findUnique({ where: { accountId } })
          if (!storage) {
            storage = await tx.webStorage.create({ data: { accountId, maxSlots: 1000 } })
          }

          const currentItems = await tx.webStorageItem.findMany({
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

          await tx.webStorageItem.create({
            data: {
              storageId: storage.id,
              templateId: template.id,
              count,
              slot: freeSlot
            }
          })
        })
        success = true
      }
    } catch (execError: any) {
      success = false
      errorMessage = execError.message || "Unbekannter Fehler bei der Ausführung der Schenkung."
    }

    // 6. Audit-Log schreiben (wird IMMER erzeugt)
    await cmsDb.adminItemGrant.create({
      data: {
        adminId,
        accountId,
        itemTemplateId,
        count,
        destination,
        note: success ? note : `FAILED: ${errorMessage}${note ? ` | Note: ${note}` : ""}`
      }
    })

    if (!success) {
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error("[ADMIN_ITEM_GRANT_POST]", error)
    return NextResponse.json(
      { error: error.message || "Interner Serverfehler" },
      { status: 500 }
    )
  }
}
