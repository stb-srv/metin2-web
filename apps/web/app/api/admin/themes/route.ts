import { NextRequest, NextResponse } from "next/server"
import { cmsDb } from "@/lib/cms-db"
import { getServerSession } from "next-auth"
import { z } from "zod"

const themeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  colors: z.record(z.string()),
  fonts: z.record(z.string()).optional(),
  borderRadius: z.record(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) return new NextResponse("Unauthorized", { status: 401 })

    const body = await req.json()
    const parsed = themeSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid theme JSON structure" }, { status: 400 })
    }

    const themeData = parsed.data

    // Validierung der zwingend erforderlichen CSS Variablen
    const requiredColors = [
      "--color-primary", "--color-bg", "--color-surface", 
      "--color-surface-2", "--color-accent", "--color-danger",
      "--color-success", "--color-warning", "--color-text",
      "--color-text-muted", "--color-border", "--color-glow"
    ]
    
    for (const color of requiredColors) {
      if (!themeData.colors[color]) {
        return NextResponse.json({ error: `Missing required color variable: ${color}` }, { status: 400 })
      }
    }

    const theme = await cmsDb.theme.create({
      data: {
        id: themeData.id,
        name: themeData.name,
        config: JSON.stringify(themeData),
        isDefault: false
      }
    })

    return NextResponse.json(theme)
  } catch (error: any) {
    console.error("[THEMES_POST]", error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Theme ID existiert bereits" }, { status: 400 })
    }
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
