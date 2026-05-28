import { NextResponse } from 'next/server'
import { cmsDb } from '@/lib/cms-db'

export async function GET() {
  try {
    const channels = await cmsDb.serverStatus.findMany({
      orderBy: { channel: 'asc' },
    })
    
    const formatted = channels.map((c) => ({
      channelId: c.channel,
      name: c.channel.toUpperCase(),
      online: c.online,
      playerCount: c.players,
      maxPlayers: c.maxPlayers,
    }))
    
    return NextResponse.json(formatted)
  } catch (err) {
    console.warn('[server-status] DB query failed, returning fallback mock channels', err)
    return NextResponse.json([
      { channelId: 'ch1', name: 'CH 1', online: true, playerCount: 142, maxPlayers: 500 },
      { channelId: 'ch2', name: 'CH 2', online: true, playerCount: 85, maxPlayers: 500 },
      { channelId: 'ch3', name: 'CH 3', online: false, playerCount: 0, maxPlayers: 500 },
    ])
  }
}
