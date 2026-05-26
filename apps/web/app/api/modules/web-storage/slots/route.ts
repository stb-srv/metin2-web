import { NextRequest, NextResponse } from "next/server"
import { cmsDb } from "@/lib/cms-db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.accountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const accountId = session.user.accountId

    const body = await req.json()
    const { draggedItemId, targetSlot } = body

    if (typeof targetSlot !== "number" || targetSlot < 0 || targetSlot >= 1000) {
      return NextResponse.json({ error: "Invalid slot" }, { status: 400 })
    }

    const draggedItem = await cmsDb.webStorageItem.findUnique({
      where: { id: draggedItemId },
      include: { storage: true }
    })

    if (!draggedItem || draggedItem.storage.accountId !== accountId) {
      return NextResponse.json({ error: "Item not found or forbidden" }, { status: 403 })
    }

    const occupyingItem = await cmsDb.webStorageItem.findUnique({
      where: {
        storageId_slot: {
          storageId: draggedItem.storageId,
          slot: targetSlot
        }
      }
    })

    if (!occupyingItem) {
      const updated = await cmsDb.webStorageItem.update({
        where: { id: draggedItem.id },
        data: { slot: targetSlot }
      })
      return NextResponse.json({ success: true, updated })
    }

    // SWAP inside transaction
    await cmsDb.$transaction([
      cmsDb.webStorageItem.update({
        where: { id: draggedItem.id },
        data: { slot: -1 } // temporary slot to avoid unique constraint collision
      }),
      cmsDb.webStorageItem.update({
        where: { id: occupyingItem.id },
        data: { slot: draggedItem.slot }
      }),
      cmsDb.webStorageItem.update({
        where: { id: draggedItem.id },
        data: { slot: targetSlot }
      })
    ])

    return NextResponse.json({ success: true, swapped: true })
  } catch (error) {
    console.error("[STORAGE_SLOTS_PATCH]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
