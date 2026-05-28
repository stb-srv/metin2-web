import { NextResponse } from 'next/server'
import { cmsDb } from '@/lib/cms-db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit') ?? '3'), 50)

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
  } catch (err) {
    console.warn('[news] DB query failed, returning fallback mock news', err)
    return NextResponse.json([
      { id: '1', title: 'Großes Server-Update v1.0', category: 'UPDATE', excerpt: 'Entdecke neue Maps, Quests und Ausrüstung im großen Server-Update.', createdAt: new Date().toISOString(), pinned: true },
      { id: '2', title: 'Wochenend-Event: 50% mehr EXP', category: 'EVENT', excerpt: 'Dieses Wochenende erhaltet ihr 50% mehr Erfahrungspunkte auf allen Maps.', createdAt: new Date().toISOString(), pinned: false },
      { id: '3', title: 'Serverwartung am Dienstag', category: 'MAINTENANCE', excerpt: 'Am kommenden Dienstag führen wir Routine-Wartungsarbeiten durch.', createdAt: new Date().toISOString(), pinned: false }
    ])
  }
}
