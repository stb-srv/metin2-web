import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { cmsDb } from '@/lib/cms-db'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Verboten' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const vnumStr = searchParams.get('vnum')
    if (!vnumStr) {
      return NextResponse.json({ error: 'VNUM erforderlich' }, { status: 400 })
    }

    const vnum = parseInt(vnumStr, 10)
    if (isNaN(vnum)) {
      return NextResponse.json({ error: 'Ungültige VNUM' }, { status: 400 })
    }

    const template = await cmsDb.itemTemplate.findUnique({
      where: { vnum }
    })

    if (!template) {
      return NextResponse.json({ error: 'Item-Vorlage nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('[ADMIN_TEMPLATE_LOOKUP]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
