/**
 * Metin2 Game Datenbank Client (metin2)
 * NUR LESEN — niemals write-Operationen hier!
 * Zugriff auf Spieler-Rankings, Charaktere etc.
 */
import { PrismaClient } from '@prisma/client'

const globalForGame = globalThis as unknown as {
  gameDb: PrismaClient | undefined
}

export const gameDb =
  globalForGame.gameDb ??
  new PrismaClient({
    datasources: {
      db: { url: process.env.GAME_DATABASE_URL },
    },
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForGame.gameDb = gameDb

// Typen für Metin2 Game DB (read-only Queries)
export type GamePlayer = {
  id: number
  name: string
  level: number
  job: number
  empire: number
  playtime: number
}
