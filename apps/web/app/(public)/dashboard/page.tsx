export default function DashboardPage() {
  return (
    <main className="p-6">
      <h1 className="font-display text-3xl text-primary mb-6 uppercase tracking-widest">
        Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Server Status Modul */}
        <section className="bg-surface border border-border rounded-lg p-4 shadow-[0_0_20px_var(--color-glow)]">
          <h2 className="font-display text-primary text-sm uppercase tracking-wider mb-3">
            Server Status
          </h2>
          <p className="text-muted text-sm">Modul wird geladen...</p>
        </section>

        {/* Rankings Modul */}
        <section className="bg-surface border border-border rounded-lg p-4 shadow-[0_0_20px_var(--color-glow)]">
          <h2 className="font-display text-primary text-sm uppercase tracking-wider mb-3">
            Player Rankings
          </h2>
          <p className="text-muted text-sm">Modul wird geladen...</p>
        </section>

        {/* News Modul */}
        <section className="bg-surface border border-border rounded-lg p-4 shadow-[0_0_20px_var(--color-glow)]">
          <h2 className="font-display text-primary text-sm uppercase tracking-wider mb-3">
            News
          </h2>
          <p className="text-muted text-sm">Modul wird geladen...</p>
        </section>
      </div>
    </main>
  )
}
