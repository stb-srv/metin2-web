import { NextResponse } from 'next/server'
import { cmsDb } from '@/lib/cms-db'

export async function GET() {
  try {
    try {
      const categories = await cmsDb.shopCategory.findMany({
        where: { active: true },
        orderBy: { order: 'asc' },
      })
      return NextResponse.json(categories)
    } catch (dbError) {
      console.warn('[itemshop/categories] DB query failed, returning fallback mock categories', dbError)
      return NextResponse.json([
        { id: 'cat1', name: 'Ausrüstung', icon: '⚔️', order: 1, active: true },
        { id: 'cat2', name: 'Tränke & Buffs', icon: '🧪', order: 2, active: true },
        { id: 'cat3', name: 'Kosmetik', icon: '👑', order: 3, active: true },
      ])
    }
  } catch (error) {
    console.error('[ITEMSHOP_CATEGORIES_API]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
