"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Puzzle, Paintbrush, FileText, Menu, X, LogOut, ArrowLeft, Sword } from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"

interface AdminSidebarProps {
  serverName: string
  className?: string
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Module", href: "/modules", icon: Puzzle },
  { name: "Themes", href: "/themes", icon: Paintbrush },
  { name: "News", href: "/news", icon: FileText },
  { name: "Items", href: "/items", icon: Sword },
]

export function AdminSidebar({ serverName, className }: AdminSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const NavLinks = () => (
    <div className="space-y-1 py-4">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-md mx-2",
              isActive 
                ? "bg-primary text-bg shadow-[0_0_10px_var(--color-glow)]" 
                : "text-text-muted hover:bg-surface-2 hover:text-text"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="font-display tracking-wide uppercase">{item.name}</span>
          </Link>
        )
      })}
    </div>
  )

  return (
    <>
      <div className="md:hidden fixed top-3 left-4 z-50">
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-text hover:text-primary p-1 bg-surface-2 rounded-md border border-border"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-bg/90 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside 
        className={cn(
          "bg-[#090a10] w-[260px] flex flex-col h-screen z-40 transition-transform duration-300 ease-in-out fixed md:relative border-r border-border/30",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
      >
        <div className="p-6 border-b border-border/30 h-20 flex flex-col justify-center shrink-0">
          <div className="text-xs text-primary font-display tracking-widest uppercase mb-1">Admin Panel</div>
          <h1 className="font-display font-bold text-text text-lg truncate">
            {serverName}
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto px-1 mt-4">
          <NavLinks />
        </nav>

        <div className="p-4 border-t border-border/30 space-y-2">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-muted hover:bg-surface-2 hover:text-text rounded-md transition-all">
            <ArrowLeft className="h-5 w-5" />
            Zur Webseite
          </Link>
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-danger hover:bg-danger/10 rounded-md transition-all"
          >
            <LogOut className="h-5 w-5" />
            Abmelden
          </button>
        </div>
      </aside>
    </>
  )
}
