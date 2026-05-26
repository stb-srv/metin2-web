import { NextRequest, NextResponse } from 'next/server'
import { cmsDb } from '@/lib/cms-db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Admin only, Session-Guard
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { id } = await params

    const theme = await cmsDb.theme.findUnique({
      where: { id }
    })

    if (!theme) {
      return new NextResponse('Theme not found', { status: 404 })
    }

    // Setze alle anderen Themes auf isDefault=false, und das aktuelle auf isDefault=true
    await cmsDb.$transaction([
      cmsDb.theme.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      }),
      cmsDb.theme.update({
        where: { id },
        data: { isDefault: true },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[THEME_ACTIVATE]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
