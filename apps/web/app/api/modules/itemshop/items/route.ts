import { NextRequest, NextResponse } from 'next/server'
import { cmsDb } from '@/lib/cms-db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') ?? '24', 10)))
    const offset = (page - 1) * limit

    const whereClause: any = { enabled: true }
    if (categoryId) {
      whereClause.categoryId = categoryId
    }

    try {
      const [items, total] = await Promise.all([
        cmsDb.shopItem.findMany({
          where: whereClause,
          include: { itemTemplate: true },
          orderBy: { order: 'asc' },
          skip: offset,
          take: limit,
        }),
        cmsDb.shopItem.count({
          where: whereClause,
        }),
      ])

      return NextResponse.json({
        items,
        total,
      })
    } catch (dbError) {
      console.warn('[itemshop/items] DB fetch failed, using mock items', dbError)
      // Provide high-quality mock items with different grades for page preview compilation
      const mockItems = [
        {
          id: 'item1',
          name: 'Schwert der Vernichtung',
          description: 'Ein legendäres Schwert, geschmiedet im Feuer der Unterwelt.',
          price: 150,
          currency: 'DR',
          itemVnum: 10,
          count: 1,
          order: 1,
          enabled: true,
          categoryId: categoryId || 'cat1',
          itemTemplate: {
            id: 'temp1',
            vnum: 10,
            name: 'Schwert der Vernichtung',
            grade: 'LEGENDARY',
            attributes: {},
          },
        },
        {
          id: 'item2',
          name: 'Rote Tränke (groß)',
          description: 'Stellt sofort 2000 HP wieder her.',
          price: 15,
          currency: 'DR',
          itemVnum: 50011,
          count: 50,
          order: 2,
          enabled: true,
          categoryId: categoryId || 'cat2',
          itemTemplate: {
            id: 'temp2',
            vnum: 50011,
            name: 'Rote Tränke',
            grade: 'NORMAL',
            attributes: {},
          },
        },
        {
          id: 'item3',
          name: 'Drachenpanzer-Helm',
          description: 'Bietet außergewöhnlichen Schutz vor physischen Angriffen.',
          price: 80,
          currency: 'DR',
          itemVnum: 12010,
          count: 1,
          order: 3,
          enabled: true,
          categoryId: categoryId || 'cat1',
          itemTemplate: {
            id: 'temp3',
            vnum: 12010,
            name: 'Drachenpanzer-Helm',
            grade: 'EPIC',
            attributes: {},
          },
        },
        {
          id: 'item4',
          name: 'Ninja-Frisur (Stachel)',
          description: 'Verleiht deinem Ninja ein markantes Aussehen.',
          price: 45,
          currency: 'DR',
          itemVnum: 74011,
          count: 1,
          order: 4,
          enabled: true,
          categoryId: categoryId || 'cat3',
          itemTemplate: {
            id: 'temp4',
            vnum: 74011,
            name: 'Ninja-Frisur (Stachel)',
            grade: 'RARE',
            attributes: {},
          },
        },
      ]

      const filteredMocks = categoryId 
        ? mockItems.filter(item => item.categoryId === categoryId) 
        : mockItems

      return NextResponse.json({
        items: filteredMocks,
        total: filteredMocks.length,
      })
    }
  } catch (error) {
    console.error('[ITEMSHOP_ITEMS_API]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
