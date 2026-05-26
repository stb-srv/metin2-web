import { NewsForm } from "../NewsForm"

export default function NewNewsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-primary tracking-widest uppercase">Neuen Beitrag verfassen</h1>
      <NewsForm />
    </div>
  )
}
