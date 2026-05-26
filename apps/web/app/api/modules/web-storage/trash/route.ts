import { NextRequest, NextResponse } from "next/server"
import { cmsDb } from "@/lib/cms-db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.accountId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const storage = await cmsDb.webStorage.findUnique({
      where: { accountId: session.user.accountId },
      include: {
        trash: {
          include: { template: true },
          orderBy: { deletedAt: 'desc' }
        }
      }
    })

    return NextResponse.json(storage?.trash || [])
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.accountId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const storage = await cmsDb.webStorage.findUnique({
      where: { accountId: session.user.accountId }
    })

    if (!storage) return NextResponse.json({ success: true })

    await cmsDb.webStorageTrash.deleteMany({
      where: { storageId: storage.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
