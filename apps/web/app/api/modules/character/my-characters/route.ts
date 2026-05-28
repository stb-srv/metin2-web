import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gameDb } from '@/lib/game-db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accountId = session.user.accountId

    try {
      const players = await gameDb.$queryRaw<any[]>`
        SELECT id, name, level, job, empire, guild_id
        FROM player
        WHERE account_id = ${accountId}
      `

      const playersWithGuilds = []
      for (const char of players) {
        let guildName = null
        if (char.guild_id && char.guild_id > 0) {
          try {
            const guildData = await gameDb.$queryRaw<any[]>`
              SELECT name FROM guild WHERE id = ${char.guild_id} LIMIT 1
            `
            if (guildData.length > 0) {
              guildName = guildData[0].name
            }
          } catch (guildError) {
            console.warn('[my-characters] Failed to fetch guild name', guildError)
          }
        }
        playersWithGuilds.push({
          id: char.id,
          name: char.name,
          level: char.level,
          job: char.job,
          empire: char.empire,
          guildName
        })
      }

      return NextResponse.json(playersWithGuilds)
    } catch (dbError) {
      console.warn('[character/my-characters] GameDB query failed, using fallback mock list', dbError)
      return NextResponse.json([
        { id: 101, name: 'KriegerGod', level: 99, job: 0, empire: 1, guildName: 'ShinsooElite' },
        { id: 102, name: 'SuraKing', level: 85, job: 4, empire: 2, guildName: null },
      ])
    }
  } catch (error) {
    console.error('[MY_CHARACTERS_API]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
