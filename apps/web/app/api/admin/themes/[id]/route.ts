import { NextRequest, NextResponse } from "next/server"
import { cmsDb } from "@/lib/cms-db"
import { getServerSession } from "next-auth"

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    const theme = await cmsDb.theme.findUnique({
      where: { id: params.id }
    })

    if (!theme) return new NextResponse("Not found", { status: 404 })
    if (theme.isDefault) {
      return NextResponse.json({ error: "Das aktive Theme kann nicht gelöscht werden" }, { status: 400 })
    }

    await cmsDb.theme.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[THEMES_DELETE]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
