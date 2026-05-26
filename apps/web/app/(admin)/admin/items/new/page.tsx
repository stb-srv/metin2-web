import { ItemForm } from "../ItemForm"

export default function NewItemPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-primary tracking-widest uppercase">Neues Item</h1>
      <ItemForm />
    </div>
  )
}
