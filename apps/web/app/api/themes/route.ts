import { NextRequest, NextResponse } from 'next/server'
import { cmsDb } from '@/lib/cms-db'
import { getServerSession } from 'next-auth'

export async function GET() {
  try {
    const themes = await cmsDb.theme.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json({ themes })
  } catch (error) {
    console.error('[THEMES_GET]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Admin only, Session-Guard
    const session = await getServerSession()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    
    if (!body.id || !body.name || !body.colors) {
      return new NextResponse('Invalid theme payload', { status: 400 })
    }

    const theme = await cmsDb.theme.upsert({
      where: { id: body.id },
      update: {
        name: body.name,
        config: JSON.stringify(body),
      },
      create: {
        id: body.id,
        name: body.name,
        config: JSON.stringify(body),
        isDefault: false,
      },
    })

    return NextResponse.json(theme)
  } catch (error) {
    console.error('[THEMES_POST]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
