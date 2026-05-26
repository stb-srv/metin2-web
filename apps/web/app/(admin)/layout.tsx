import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { cmsDb } from "@/lib/cms-db"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  
  // Strict Session Guard
  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== 'ADMIN') {
    redirect("/dashboard")
  }

  let serverName = "Metin2 Admin"
  try {
    const setting = await cmsDb.setting.findUnique({
      where: { key: "SERVER_NAME" }
    })
    if (setting) {
      serverName = setting.value
    }
  } catch (error) {
    console.error("Failed to load server name:", error)
  }

  return (
    <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-[260px_1fr] bg-bg text-text selection:bg-primary/30">
      <AdminSidebar serverName={serverName} />
      
      <div className="flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 flex items-center px-8 border-b border-border/30 bg-surface/50 backdrop-blur-md sticky top-0 z-30 shrink-0">
          <div className="md:hidden w-8" />
          <h2 className="text-xl font-display text-text-muted">Willkommen zurück, <span className="text-primary font-bold">{session.user?.name || "Admin"}</span></h2>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
