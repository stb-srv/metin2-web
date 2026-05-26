import { cmsDb } from "@/lib/cms-db"
import { ModulesList } from "./ModulesList"

export const dynamic = "force-dynamic"

export default async function AdminModulesPage() {
  const modules = await cmsDb.module.findMany({
    orderBy: { order: 'asc' }
  })

  // Prisma return types mapen für Client Component
  const serializedModules = modules.map(m => ({
    id: m.id,
    name: m.name,
    enabled: m.enabled,
    order: m.order
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-display font-bold text-primary tracking-widest uppercase">Module Verwaltung</h1>
        <p className="text-text-muted">Aktiviere oder deaktiviere installierte Systeme. Änderungen sind sofort für Benutzer wirksam.</p>
      </div>
      
      <ModulesList initialModules={serializedModules} />
    </div>
  )
}
