"use client"

import { usePathname } from "next/navigation"
import { ReactNode } from "react"
import { useSession } from "next-auth/react"

interface PublicLayoutWrapperProps {
  children: ReactNode
  sidebar: ReactNode
  topbar: ReactNode
}

export function PublicLayoutWrapper({ children, sidebar, topbar }: PublicLayoutWrapperProps) {
  const pathname = usePathname()
  const { status } = useSession()
  
  const isAuthPage = pathname === "/login" || pathname === "/register"
  const isLandingPage = pathname === "/"

  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full bg-bg flex items-center justify-center p-4">
        {children}
      </div>
    )
  }

  const showSidebar = status === "authenticated"

  if (isLandingPage || !showSidebar) {
    return (
      <div className="flex flex-col min-h-screen bg-bg">
        {topbar}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-[240px_1fr] bg-bg">
      {sidebar}
      
      <div className="flex flex-col h-screen overflow-hidden relative">
        {topbar}
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
