import { NextRequest, NextResponse } from "next/server"
import { cmsDb } from "@/lib/cms-db"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../../auth/[...nextauth]/route"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.accountId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const trashItem = await cmsDb.webStorageTrash.findUnique({
      where: { id: params.id },
      include: { storage: true }
    })

    if (!trashItem || trashItem.storage.accountId !== session.user.accountId) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 403 })
    }

    if (new Date() > new Date(trashItem.expiresAt)) {
      return NextResponse.json({ error: "Dieses Item ist bereits abgelaufen und kann nicht wiederhergestellt werden." }, { status: 400 })
    }

    const currentItems = await cmsDb.webStorageItem.findMany({
      where: { storageId: trashItem.storageId },
      select: { slot: true }
    })

    if (currentItems.length >= trashItem.storage.maxSlots) {
      return NextResponse.json({ error: "Lager ist voll." }, { status: 400 })
    }

    const occupiedSlots = new Set(currentItems.map(i => i.slot))
    let freeSlot = 0
    while (occupiedSlots.has(freeSlot)) {
      freeSlot++
    }

    await cmsDb.$transaction([
      cmsDb.webStorageTrash.delete({
        where: { id: trashItem.id }
      }),
      cmsDb.webStorageItem.create({
        data: {
          storageId: trashItem.storageId,
          templateId: trashItem.templateId,
          count: trashItem.count,
          enchants: trashItem.enchants || {},
          slot: freeSlot
        }
      })
    ])

    return NextResponse.json({ success: true, slot: freeSlot })
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
