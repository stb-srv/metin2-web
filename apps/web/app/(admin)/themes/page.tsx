import { cmsDb } from "@/lib/cms-db"
import { ThemesList } from "./ThemesList"

export const dynamic = "force-dynamic"

export default async function AdminThemesPage() {
  const themes = await cmsDb.theme.findMany({
    orderBy: { createdAt: 'desc' }
  })

  const serializedThemes = themes.map(t => ({
    id: t.id,
    name: t.name,
    isDefault: t.isDefault,
    config: t.config
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-primary tracking-widest uppercase">Themes</h1>
        <p className="text-text-muted">Verwalte das Erscheinungsbild der Website. Aktiviere bestehende Themes oder importiere neue Metin2 Designs via JSON.</p>
      </div>
      
      <ThemesList initialThemes={serializedThemes} />
    </div>
  )
}
