import { NextRequest, NextResponse } from "next/server"
import { cmsDb } from "@/lib/cms-db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    const { id } = await params
    const theme = await cmsDb.theme.findUnique({
      where: { id }
    })

    if (!theme) return new NextResponse("Not found", { status: 404 })
    if (theme.isDefault) {
      return NextResponse.json({ error: "Das aktive Theme kann nicht gelöscht werden" }, { status: 400 })
    }

    await cmsDb.theme.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[THEMES_DELETE]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
