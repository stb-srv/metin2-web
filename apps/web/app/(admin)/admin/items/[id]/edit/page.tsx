import { cmsDb } from "@/lib/cms-db"
import { ItemForm } from "../../ItemForm"
import { notFound } from "next/navigation"

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await cmsDb.itemTemplate.findUnique({
    where: { id }
  })

  if (!item) notFound()

  const serialized = {
    id: item.id,
    vnum: item.vnum,
    name: item.name,
    description: item.description || "",
    iconUrl: item.iconUrl || "",
    itemType: item.itemType,
    grade: item.grade as any,
    attributes: item.attributes ? JSON.stringify(item.attributes, null, 2) : "{}",
    enabled: item.enabled
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-primary tracking-widest uppercase">Item Bearbeiten</h1>
      <ItemForm initialData={serialized} />
    </div>
  )
}
