import { ItemsList } from "./ItemsList"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default function AdminItemsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary tracking-widest uppercase">Items</h1>
          <p className="text-text-muted mt-1">Verwalte Items, die als Vorlagen für den Shop oder für Spieler-Geschenke dienen.</p>
        </div>
        <Link href="/items/new">
          <Button><Plus className="w-4 h-4 mr-2"/> Neues Item anlegen</Button>
        </Link>
      </div>

      <ItemsList />
    </div>
  )
}
