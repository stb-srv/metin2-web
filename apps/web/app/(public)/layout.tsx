import { ReactNode } from "react"
import { Sidebar } from "@/components/core/Sidebar"
import { Topbar } from "@/components/core/Topbar"
import { cmsDb } from "@/lib/cms-db"
import { PublicLayoutWrapper } from "./PublicLayoutWrapper"

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
    <PublicLayoutWrapper
      sidebar={<Sidebar serverName={serverName} />}
      topbar={<Topbar serverName={serverName} />}
    >
      {children}
    </PublicLayoutWrapper>
  )
}
