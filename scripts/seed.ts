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
          '--color-primary': '#c0392b',
          '--color-bg': '#0d0e12',
          '--color-surface': '#14161d',
          '--color-surface-2': '#1c1e27',
          '--color-accent': '#c0392b',
          '--color-danger': '#e74c3c',
          '--color-success': '#2ecc71',
          '--color-warning': '#f39c12',
          '--color-text': '#e2e4e9',
          '--color-text-muted': '#888b96',
          '--color-border': '#2a2c35',
          '--color-glow': 'rgba(192, 57, 43, 0.08)',
        },
        fonts: {
          '--font-display': "'Rajdhani', sans-serif",
          '--font-body': "'Open Sans', sans-serif",
        },
        borderRadius: {
          '--radius-sm': '4px',
          '--radius-md': '6px',
          '--radius-lg': '6px',
        },
      }),
    },
    {
      id: 'metin2-fire',
      name: 'Metin2 Fire',
      isDefault: false,
      config: JSON.stringify({
        colors: {
          '--color-primary': '#c0392b',
          '--color-bg': '#0d0e12',
          '--color-surface': '#14161d',
          '--color-surface-2': '#1c1e27',
          '--color-accent': '#c0392b',
          '--color-danger': '#e74c3c',
          '--color-success': '#2ecc71',
          '--color-warning': '#f39c12',
          '--color-text': '#e2e4e9',
          '--color-text-muted': '#888b96',
          '--color-border': '#2a2c35',
          '--color-glow': 'rgba(192, 57, 43, 0.08)',
        },
        fonts: {
          '--font-display': "'Rajdhani', sans-serif",
          '--font-body': "'Open Sans', sans-serif",
        },
        borderRadius: {
          '--radius-sm': '4px',
          '--radius-md': '6px',
          '--radius-lg': '6px',
        },
      }),
    },
  ]

  for (const theme of themes) {
    await prisma.theme.upsert({
      where: { id: theme.id },
      update: {
        config: theme.config,
        name: theme.name,
        isDefault: theme.isDefault,
      },
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
