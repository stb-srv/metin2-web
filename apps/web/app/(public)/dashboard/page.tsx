import ServerStatusModule from "@/modules/server-status"
import RankingsModule from "@/modules/rankings"
import NewsModule from "@/modules/news"
import StatsModule from "@/modules/stats"

export default function DashboardPage() {
  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl text-primary uppercase tracking-widest">
          Dashboard
        </h1>
        <p className="text-text-muted text-sm max-w-2xl">
          Willkommen zurück! Hier findest du aktuelle Statistiken, Neuigkeiten und den Status unseres Servers.
        </p>
      </div>

      {/* Stats Bar */}
      <StatsModule />

      {/* 3 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ServerStatusModule />
        <NewsModule />
        <RankingsModule preview={true} />
      </div>
    </main>
  )
}
