import { ReactNode } from "react"
import { Sidebar } from "@/components/core/Sidebar"
import { Topbar } from "@/components/core/Topbar"
import { cmsDb } from "@/lib/cms-db"

export default async function PublicLayout({ children }: { children: ReactNode }) {
  // Server-Name aus der DB laden (Settings)
  let serverName = "Metin2 Server"
  try {
    const setting = await cmsDb.setting.findUnique({
      where: { key: "SERVER_NAME" }
    })
    if (setting) {
      serverName = setting.value
    }
  } catch (error) {
    console.error("Failed to load server name from DB:", error)
  }

  return (
    <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-[240px_1fr] bg-bg">
      <Sidebar serverName={serverName} />
      
      <div className="flex flex-col h-screen overflow-hidden relative">
        <Topbar serverName={serverName} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
