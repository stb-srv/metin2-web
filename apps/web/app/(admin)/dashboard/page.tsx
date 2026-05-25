import { Card, CardContent } from "@/components/ui/card"
import { cmsDb } from "@/lib/cms-db"
import { Puzzle, Paintbrush, FileText, ShoppingCart } from "lucide-react"

export default async function AdminDashboardPage() {
  const [modulesCount, activeModulesCount, themesCount, newsCount, shopItemsCount] = await Promise.all([
    cmsDb.module.count(),
    cmsDb.module.count({ where: { enabled: true } }),
    cmsDb.theme.count(),
    cmsDb.news.count(),
    cmsDb.shopItem.count()
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-primary tracking-widest uppercase">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-surface/80 border-border/50">
          <CardContent className="p-6 flex items-center gap-4 pt-6">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
              <Puzzle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-sm text-text-muted font-medium">Aktive Module</div>
              <div className="text-2xl font-bold font-display">{activeModulesCount} <span className="text-sm text-text-muted font-sans font-normal">/ {modulesCount}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface/80 border-border/50">
          <CardContent className="p-6 flex items-center gap-4 pt-6">
            <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30 shrink-0">
              <Paintbrush className="h-6 w-6 text-accent" />
            </div>
            <div>
              <div className="text-sm text-text-muted font-medium">Themes</div>
              <div className="text-2xl font-bold font-display">{themesCount}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface/80 border-border/50">
          <CardContent className="p-6 flex items-center gap-4 pt-6">
            <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center border border-success/30 shrink-0">
              <FileText className="h-6 w-6 text-success" />
            </div>
            <div>
              <div className="text-sm text-text-muted font-medium">News Einträge</div>
              <div className="text-2xl font-bold font-display">{newsCount}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface/80 border-border/50">
          <CardContent className="p-6 flex items-center gap-4 pt-6">
            <div className="h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center border border-warning/30 shrink-0">
              <ShoppingCart className="h-6 w-6 text-warning" />
            </div>
            <div>
              <div className="text-sm text-text-muted font-medium">Shop Items</div>
              <div className="text-2xl font-bold font-display">{shopItemsCount}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
