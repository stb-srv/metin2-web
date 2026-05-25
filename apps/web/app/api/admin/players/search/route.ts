import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"
import { gameDb } from "@/lib/game-db"
import { z } from "zod"

const rateLimitMap = new Map<string, { count: number, resetAt: number }>()

const searchSchema = z.object({
  q: z.string().min(2),
  limit: z.coerce.number().min(1).max(20).default(10)
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const adminId = session.user.id
    const now = Date.now()
    const rateLimit = rateLimitMap.get(adminId)

    if (rateLimit && rateLimit.resetAt > now) {
      if (rateLimit.count >= 30) {
        return NextResponse.json({ error: "Rate limit exceeded. Please wait a minute." }, { status: 429 })
      }
      rateLimit.count++
    } else {
      rateLimitMap.set(adminId, { count: 1, resetAt: now + 60000 })
    }

    const { searchParams } = new URL(req.url)
    const validation = searchSchema.safeParse({
      q: searchParams.get("q"),
      limit: searchParams.get("limit")
    })

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    const { q, limit } = validation.data
    const searchPattern = `%${q}%`

    const accounts = await gameDb.$queryRaw<any[]>`
      SELECT id, login 
      FROM account 
      WHERE login LIKE ${searchPattern} 
      LIMIT ${limit}
    `

    const characters = await gameDb.$queryRaw<any[]>`
      SELECT p.id, p.name, p.level, p.job, p.empire, p.guild_id,
             a.id as account_id, a.login as account_name
      FROM player p
      JOIN account a ON p.account_id = a.id
      WHERE p.name LIKE ${searchPattern}
      LIMIT ${limit}
    `

    const guildIds = [...new Set(characters.map(c => c.guild_id).filter(id => id > 0))]
    let guildsMap = new Map<number, string>()
    if (guildIds.length > 0) {
       for (const gid of guildIds) {
          const g = await gameDb.$queryRaw<any[]>`SELECT name FROM guild WHERE id = ${gid} LIMIT 1`
          if (g.length > 0) guildsMap.set(gid, g[0].name)
       }
    }

    const resultsMap = new Map<number, any>()

    for (const char of characters) {
      if (!resultsMap.has(char.account_id)) {
        resultsMap.set(char.account_id, {
          accountId: char.account_id,
          accountName: char.account_name,
          characters: []
        })
      }
      resultsMap.get(char.account_id).characters.push({
        id: char.id,
        name: char.name,
        level: char.level,
        job: char.job,
        empire: char.empire,
        guildName: guildsMap.get(char.guild_id) || null
      })
    }

    for (const acc of accounts) {
      if (!resultsMap.has(acc.id)) {
        const accChars = await gameDb.$queryRaw<any[]>`
          SELECT id, name, level, job, empire, guild_id
          FROM player
          WHERE account_id = ${acc.id}
        `
        const charsWithGuilds = []
        for (const char of accChars) {
           let gName = null
           if (char.guild_id > 0) {
             const g = await gameDb.$queryRaw<any[]>`SELECT name FROM guild WHERE id = ${char.guild_id} LIMIT 1`
             if (g.length > 0) gName = g[0].name
           }
           charsWithGuilds.push({
             id: char.id,
             name: char.name,
             level: char.level,
             job: char.job,
             empire: char.empire,
             guildName: gName
           })
        }

        resultsMap.set(acc.id, {
          accountId: acc.id,
          accountName: acc.login,
          characters: charsWithGuilds
        })
      }
    }

    return NextResponse.json({ results: Array.from(resultsMap.values()) })

  } catch (error) {
    console.error("[ADMIN_PLAYERS_SEARCH]", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
