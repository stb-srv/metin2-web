import { NextResponse } from 'next/server'
import { cmsDb } from '@/lib/cms-db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit') ?? '10'), 50)

  try {
    const news = await cmsDb.news.findMany({
      where: { published: true },
      orderBy: [
        { pinned: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      select: {
        id: true,
        title: true,
        excerpt: true,
        category: true,
        pinned: true,
        createdAt: true,
      },
    })
    return NextResponse.json(news)
  } catch {
    console.error('[news] DB query failed')
    return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 })
  }
}
