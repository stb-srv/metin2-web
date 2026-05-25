/**
 * CMS Datenbank Client (metin2_cms)
 * Volle Lese- und Schreibrechte für CMS-Inhalte
 */
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  cmsDb: PrismaClient | undefined
}

export const cmsDb =
  globalForPrisma.cmsDb ??
  new PrismaClient({
    datasources: {
      db: { url: process.env.CMS_DATABASE_URL },
    },
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.cmsDb = cmsDb
