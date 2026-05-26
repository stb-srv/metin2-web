import { redirect } from 'next/navigation'

// Root redirect → Dashboard
export default function RootPage() {
  redirect('/dashboard')
}
