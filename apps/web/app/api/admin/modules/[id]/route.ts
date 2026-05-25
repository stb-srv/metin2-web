import { NextRequest, NextResponse } from "next/server"
import { cmsDb } from "@/lib/cms-db"
import { getServerSession } from "next-auth"
import { z } from "zod"

const patchSchema = z.object({
  enabled: z.boolean()
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return new NextResponse("Invalid payload", { status: 400 })
    }

    const { id } = params

    const updated = await cmsDb.module.update({
      where: { id },
      data: { enabled: parsed.data.enabled }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[MODULE_PATCH]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
