import RankingsModule from "@/modules/rankings"

export default function RankingsPage() {
  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl text-primary uppercase tracking-widest">
          Ranglisten
        </h1>
        <p className="text-text-muted text-sm max-w-2xl">
          Hier findest du die erfolgreichsten Krieger, die ruhmreichsten Gilden und die gefürchtetsten Kämpfer unseres Reiches.
        </p>
      </div>
      
      <RankingsModule />
    </main>
  )
}
