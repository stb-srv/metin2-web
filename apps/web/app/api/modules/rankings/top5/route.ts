import { NextResponse } from 'next/server'
import { gameDb } from '@/lib/game-db'

interface TopPlayer {
  name: string
  level: number
  job: number
  empire: number
  account_name: string
}

export async function GET() {
  try {
    const players = await gameDb.$queryRaw<TopPlayer[]>`
      SELECT p.name, p.level, p.job, p.empire, a.login as account_name
      FROM player p
      JOIN account a ON p.account_id = a.id
      ORDER BY p.level DESC, p.exp DESC
      LIMIT 5
    `
    return NextResponse.json(players)
  } catch (err) {
    console.warn('[rankings/top5] gameDb query failed, returning fallback mock top 5 players', err)
    return NextResponse.json([
      { name: 'KriegerGod', level: 99, job: 0, empire: 1, account_name: 'acc1' },
      { name: 'NinjaQueen', level: 98, job: 3, empire: 2, account_name: 'acc2' },
      { name: 'SuraKing', level: 97, job: 4, empire: 3, account_name: 'acc3' },
      { name: 'SchamiBuff', level: 95, job: 7, empire: 1, account_name: 'acc4' },
      { name: 'PvPMeister', level: 94, job: 2, empire: 2, account_name: 'acc5' }
    ])
  }
}
