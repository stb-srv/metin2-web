"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ShoppingCart, Trophy, Newspaper, Users, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  serverName: string
  className?: string
}

const navItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Item-Shop", href: "/itemshop", icon: ShoppingCart },
  { name: "Rankings", href: "/rankings", icon: Trophy },
  { name: "News", href: "/news", icon: Newspaper },
  { name: "Community", href: "/community", icon: Users },
]

export function Sidebar({ serverName, className }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const NavLinks = () => (
    <div className="space-y-2 py-4">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all border-l-2",
              isActive 
                ? "border-primary bg-surface-2 text-primary shadow-[inset_0_0_20px_var(--color-glow)]" 
                : "border-transparent text-text-muted hover:bg-surface hover:text-text"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="font-display tracking-wide">{item.name}</span>
          </Link>
        )
      })}
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-3 left-4 z-50">
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-text hover:text-primary p-1 bg-surface rounded-md border border-border shadow-[0_0_10px_var(--color-glow)]"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Slide-in Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={cn(
          "bg-surface w-[240px] flex flex-col h-screen z-40 transition-transform duration-300 ease-in-out fixed md:relative border-r border-border",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
      >
        <div className="p-6 border-b border-border/50 h-16 flex items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="hex-icon w-8 h-8 flex items-center justify-center bg-primary">
              <span className="text-bg font-display font-bold text-lg mt-0.5">M</span>
            </div>
            <h1 className="font-display font-bold text-primary tracking-widest text-base uppercase truncate">
              {serverName}
            </h1>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2">
          <NavLinks />
        </nav>
      </aside>
    </>
  )
}
