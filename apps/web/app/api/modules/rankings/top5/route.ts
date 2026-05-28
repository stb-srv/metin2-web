import { NextResponse } from 'next/server'
import { gameDb } from '@/lib/game-db'

interface TopPlayer {
  name: string
  level: number
  job: number
  account_name: string
}

export async function GET() {
  try {
    const players = await gameDb.$queryRaw<TopPlayer[]>`
      SELECT p.name, p.level, p.job, a.login as account_name
      FROM player p
      JOIN account a ON p.account_id = a.id
      ORDER BY p.level DESC, p.exp DESC
      LIMIT 5
    `
    return NextResponse.json(players)
  } catch {
    console.error('[rankings/top5] gameDb query failed')
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
