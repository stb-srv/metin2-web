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
    if (!session?.user?.accountId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const trashItem = await cmsDb.webStorageTrash.findUnique({
      where: { id: params.id },
      include: { storage: true }
    })

    if (!trashItem || trashItem.storage.accountId !== session.user.accountId) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 403 })
    }

    await cmsDb.webStorageTrash.delete({
      where: { id: trashItem.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
