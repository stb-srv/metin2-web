import { NextResponse } from 'next/server'
import { cmsDb } from '@/lib/cms-db'

export const revalidate = 30

export async function GET() {
  try {
    const statusData = await cmsDb.serverStatus.findMany({
      orderBy: { channel: 'asc' }
    })
    
    return NextResponse.json({ status: statusData })
  } catch (error) {
    console.error('[SERVER_STATUS_API]', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
