import { NextResponse } from 'next/server'
import { cmsDb } from '@/lib/cms-db'

export async function GET() {
  try {
    const channels = await cmsDb.serverStatus.findMany({
      orderBy: { channel: 'asc' },
    })
    return NextResponse.json(channels)
  } catch {
    console.error('[server-status] DB query failed')
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
