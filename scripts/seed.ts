/**
 * Seed-Script: Legt Standard-Module, Themes und Admin-User an
 * Wird automatisch von install.sh aufgerufen
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.CMS_DATABASE_URL } },
})

async function main() {
  console.log('🌱 Seeding...')

  // Standard-Module anlegen
  const modules = [
    { id: 'server-status', name: 'Server Status', enabled: true, order: 1 },
    { id: 'rankings', name: 'Player Rankings', enabled: true, order: 2 },
    { id: 'itemshop', name: 'Item Shop', enabled: true, order: 3 },
    { id: 'news', name: 'News & Announcements', enabled: true, order: 4 },
    { id: 'community', name: 'Community', enabled: true, order: 5 },
  ]

  for (const mod of modules) {
    await prisma.module.upsert({
      where: { id: mod.id },
      update: {},
      create: mod,
    })
  }
  console.log('  ✅ Module angelegt')

  // Standard-Themes anlegen
  const themes = [
    {
      id: 'metin2-dark',
      name: 'Metin2 Dark',
      isDefault: true,
      config: JSON.stringify({
        colors: {
          '--color-primary': '#c8a84b',
          '--color-bg': '#0d0f1a',
          '--color-surface': '#1a1d2e',
          '--color-surface-2': '#252840',
          '--color-accent': '#2a6dd9',
          '--color-danger': '#e05a3a',
          '--color-success': '#4caf50',
          '--color-warning': '#f59e0b',
          '--color-text': '#e8dcc8',
          '--color-text-muted': '#8b7d6b',
          '--color-border': 'rgba(200,168,75,0.25)',
          '--color-glow': 'rgba(200,168,75,0.15)',
        },
        fonts: {
          '--font-display': "'Cinzel', serif",
          '--font-body': "'Inter', sans-serif",
        },
        borderRadius: {
          '--radius-sm': '4px',
          '--radius-md': '8px',
          '--radius-lg': '12px',
        },
      }),
    },
    {
      id: 'metin2-fire',
      name: 'Metin2 Fire',
      isDefault: false,
      config: JSON.stringify({
        colors: {
          '--color-primary': '#e05a3a',
          '--color-bg': '#0f0a08',
          '--color-surface': '#1a1008',
          '--color-surface-2': '#2a1a0a',
          '--color-accent': '#f59e0b',
          '--color-danger': '#ef4444',
          '--color-success': '#4caf50',
          '--color-warning': '#f59e0b',
          '--color-text': '#f0e0d0',
          '--color-text-muted': '#8b6b5b',
          '--color-border': 'rgba(224,90,58,0.3)',
          '--color-glow': 'rgba(224,90,58,0.15)',
        },
        fonts: {
          '--font-display': "'Cinzel', serif",
          '--font-body': "'Inter', sans-serif",
        },
        borderRadius: {
          '--radius-sm': '4px',
          '--radius-md': '8px',
          '--radius-lg': '12px',
        },
      }),
    },
  ]

  for (const theme of themes) {
    await prisma.theme.upsert({
      where: { id: theme.id },
      update: {},
      create: theme,
    })
  }
  console.log('  ✅ Themes angelegt')

  // Admin-User anlegen
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123_bitte_aendern'
  const hashed = await bcrypt.hash(adminPassword, 12)

  await prisma.user.upsert({
    where: { email: 'admin@metin2.local' },
    update: {},
    create: {
      email: 'admin@metin2.local',
      name: 'Admin',
      password: hashed,
      role: 'ADMIN',
    },
  })
  console.log(`  ✅ Admin-User angelegt`)
  console.log(`     Email: admin@metin2.local`)
  console.log(`     Passwort: ${adminPassword}`)
  console.log(`     ⚠️  Bitte im Admin-Panel ändern!`)

  console.log('🎉 Seed abgeschlossen!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
