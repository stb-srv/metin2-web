import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import ServerStatusModule from '@/modules/server-status'
import StatsModule from '@/modules/stats'
import NewsModule from '@/modules/news'
import RankingsModule from '@/modules/rankings'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <main className="min-h-screen bg-bg px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Begrüßung */}
        <div>
          <h1 className="font-display text-primary text-2xl tracking-widest uppercase">
            Willkommen, {session.user.name}
          </h1>
          <p className="text-muted text-sm mt-1">Übersicht deines Accounts</p>
        </div>

        {/* Live-Stats Leiste */}
        <StatsModule />

        {/* Zweispaltiges Grid: Server-Status + News */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ServerStatusModule />
          <NewsModule />
        </div>

        {/* Top-Ranking */}
        <RankingsModule />

      </div>
    </main>
  )
}
