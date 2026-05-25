import { NextRequest, NextResponse } from "next/server"
import { cmsDb } from "@/lib/cms-db"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../auth/[...nextauth]/route"

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.accountId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const accountId = session.user.accountId

    const item = await cmsDb.webStorageItem.findUnique({
      where: { id: params.id },
      include: { storage: true }
    })

    if (!item || item.storage.accountId !== accountId) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 403 })
    }

    const trashCount = await cmsDb.webStorageTrash.count({
      where: { storageId: item.storageId }
    })

    if (trashCount >= 128) {
      return NextResponse.json({ error: "Papierkorb ist voll (Max 128 Items)." }, { status: 400 })
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await cmsDb.$transaction([
      cmsDb.webStorageItem.delete({
        where: { id: item.id }
      }),
      cmsDb.webStorageTrash.create({
        data: {
          storageId: item.storageId,
          templateId: item.templateId,
          count: item.count,
          enchants: item.enchants || {},
          expiresAt
        }
      })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[STORAGE_ITEMS_DELETE]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
