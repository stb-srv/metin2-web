import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { cmsDb } from "@/lib/cms-db"
import { gameDb } from "@/lib/game-db"
import { z } from "zod"

// In-Memory Rate-Limiter Map
const rateLimitMap = new Map<number, number[]>()

const transferSchema = z.object({
  storageItemId: z.string(),
  count: z.number().int().positive()
})

export async function POST(req: NextRequest) {
  try {
    // a) Session prüfen
    const session = await getServerSession(authOptions)
    if (!session?.user?.accountId) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 })
    }
    const accountId = session.user.accountId

    // b) Rate-Limit prüfen: max 10 Transfers/Minute pro Account
    const now = Date.now()
    const oneMinuteAgo = now - 60 * 1000
    const timestamps = rateLimitMap.get(accountId) || []
    const activeTimestamps = timestamps.filter(t => t > oneMinuteAgo)
    if (activeTimestamps.length >= 10) {
      return NextResponse.json({ error: "Rate Limit überschritten. Maximal 10 Transfers pro Minute erlaubt." }, { status: 429 })
    }
    activeTimestamps.push(now)
    rateLimitMap.set(accountId, activeTimestamps)

    // c) Zod-Validierung
    const body = await req.json()
    const validation = transferSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: "Ungültige Eingabedaten" }, { status: 400 })
    }
    const { storageItemId, count } = validation.data

    // d) WebStorageItem laden + prüfen ob es dem Spieler gehört
    const item = await cmsDb.webStorageItem.findUnique({
      where: { id: storageItemId },
      include: { storage: true, template: true }
    })
    if (!item || item.storage.accountId !== accountId) {
      return NextResponse.json({ error: "Gegenstand nicht gefunden oder Zugriff verweigert." }, { status: 404 })
    }
    if (item.count < count) {
      return NextResponse.json({ error: "Nicht genügend Stückzahl im Lager vorhanden." }, { status: 400 })
    }

    // e) Account-Name aus gameDb holen
    const accounts = await gameDb.$queryRaw<any[]>`
      SELECT login FROM account WHERE id = ${accountId} LIMIT 1
    `
    const accountName = accounts[0]?.login
    if (!accountName) {
      return NextResponse.json({ error: "Spieler-Account nicht in der Spieldatenbank gefunden." }, { status: 404 })
    }

    // f) TRANSAKTION in cmsDb: ItemTransfer anlegen (PROCESSING) und WebStorageItem anpassen
    const transfer = await cmsDb.$transaction(async (tx) => {
      // ItemTransfer erstellen
      const t = await tx.itemTransfer.create({
        data: {
          storageId: item.storageId,
          itemTemplateId: item.templateId,
          count,
          enchants: item.enchants || {},
          status: "PROCESSING"
        }
      })

      // Count reduzieren oder löschen
      if (item.count === count) {
        await tx.webStorageItem.delete({
          where: { id: item.id }
        })
      } else {
        await tx.webStorageItem.update({
          where: { id: item.id },
          data: { count: item.count - count }
        })
      }

      return t
    })

    // g) INSERT in gameDb.item_award
    try {
      const enchants = (item.enchants as Record<string, any>) || {}
      const vnum = item.template.vnum
      
      const s0 = Number(enchants.socket0 ?? 0)
      const s1 = Number(enchants.socket1 ?? 0)
      const s2 = Number(enchants.socket2 ?? 0)

      const at0 = Number(enchants.attrtype0 ?? 0)
      const av0 = Number(enchants.attrvalue0 ?? 0)
      const at1 = Number(enchants.attrtype1 ?? 0)
      const av1 = Number(enchants.attrvalue1 ?? 0)
      const at2 = Number(enchants.attrtype2 ?? 0)
      const av2 = Number(enchants.attrvalue2 ?? 0)
      const at3 = Number(enchants.attrtype3 ?? 0)
      const av3 = Number(enchants.attrvalue3 ?? 0)
      const at4 = Number(enchants.attrtype4 ?? 0)
      const av4 = Number(enchants.attrvalue4 ?? 0)
      const at5 = Number(enchants.attrtype5 ?? 0)
      const av5 = Number(enchants.attrvalue5 ?? 0)
      const at6 = Number(enchants.attrtype6 ?? 0)
      const av6 = Number(enchants.attrvalue6 ?? 0)
      const at7 = Number(enchants.attrtype7 ?? 0)
      const av7 = Number(enchants.attrvalue7 ?? 0)

      await gameDb.$executeRaw`
        INSERT INTO item_award 
        (account_name, item_vnum, item_count, socket0, socket1, socket2,
         attrtype0, attrvalue0, attrtype1, attrvalue1, attrtype2, attrvalue2,
         attrtype3, attrvalue3, attrtype4, attrvalue4, attrtype5, attrvalue5,
         attrtype6, attrvalue6, attrtype7, attrvalue7, given_time, rewarded)
        VALUES (${accountName}, ${vnum}, ${count}, ${s0}, ${s1}, ${s2},
         ${at0}, ${av0}, ${at1}, ${av1}, ${at2}, ${av2},
         ${at3}, ${av3}, ${at4}, ${av4}, ${at5}, ${av5},
         ${at6}, ${av6}, ${at7}, ${av7}, NOW(), 0)
      `

      // h) Bei Erfolg: ItemTransfer status=SUCCESS, processedAt=NOW()
      await cmsDb.itemTransfer.update({
        where: { id: transfer.id },
        data: {
          status: "SUCCESS",
          processedAt: new Date()
        }
      })

      return NextResponse.json({ success: true })
    } catch (dbError: any) {
      console.error("[TRANSFER_GAME_DB_ERROR] Rollback initiated:", dbError)

      // i) Bei Fehler in Schritt g: WebStorageItem WIEDERHERSTELLEN, ItemTransfer status=FAILED, errorMsg setzen
      await cmsDb.$transaction(async (tx) => {
        // Status auf FAILED setzen
        await tx.itemTransfer.update({
          where: { id: transfer.id },
          data: {
            status: "FAILED",
            errorMsg: dbError.message || "Datenbankfehler beim Schreiben in Game-Datenbank"
          }
        })

        // WebStorageItem wiederherstellen
        const existingItem = await tx.webStorageItem.findUnique({
          where: { id: item.id }
        })

        if (existingItem) {
          await tx.webStorageItem.update({
            where: { id: item.id },
            data: { count: existingItem.count + count }
          })
        } else {
          await tx.webStorageItem.create({
            data: {
              id: item.id,
              storageId: item.storageId,
              templateId: item.templateId,
              slot: item.slot,
              count,
              enchants: item.enchants || {}
            }
          })
        }
      })

      return NextResponse.json(
        { error: "Fehler beim Transfer ins Spiel. Der Gegenstand bleibt in deinem Web-Lager." },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("[STORAGE_TRANSFER_POST]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
