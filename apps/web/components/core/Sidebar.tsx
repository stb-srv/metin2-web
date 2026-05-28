"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Trophy, 
  Archive, 
  User, 
  Menu, 
  X 
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  serverName: string
  className?: string
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Rangliste", href: "/rankings", icon: Trophy },
  { name: "Item-Shop", href: "/itemshop", icon: ShoppingCart },
  { name: "Web-Lager", href: "/storage", icon: Archive },
  { name: "Mein Profil", href: "/profile", icon: User },
]

export function Sidebar({ serverName, className }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const NavLinks = () => (
    <div className="space-y-2.5 py-6">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3.5 px-4 py-3.5 text-sm font-medium transition-all border-l-2 duration-300",
              isActive 
                ? "border-primary bg-primary/5 text-primary shadow-[inset_0_0_15px_var(--color-glow)] font-semibold" 
                : "border-transparent text-text-muted hover:bg-surface-2/40 hover:text-text"
            )}
          >
            <Icon className={cn("h-5 w-5 transition-transform duration-300", isActive ? "scale-105" : "group-hover:scale-105")} />
            <span className="font-display tracking-widest uppercase text-xs">{item.name}</span>
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
          className="text-text hover:text-primary p-1.5 bg-surface rounded border border-border/80 shadow-[0_0_10px_var(--color-glow)]"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Slide-in Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-bg/85 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={cn(
          "bg-surface w-[240px] flex flex-col h-screen z-40 transition-transform duration-300 ease-in-out fixed md:relative border-r border-primary/20",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
      >
        {/* Sidebar Header Logo */}
        <div className="p-6 border-b border-primary/20 h-16 flex items-center shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <div className="hex-icon w-8 h-8 flex items-center justify-center bg-primary border-primary">
              <span className="text-bg font-display font-bold text-lg mt-0.5">M</span>
            </div>
            <h1 className="font-display font-bold text-primary tracking-widest text-sm uppercase truncate">
              {serverName}
            </h1>
          </Link>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 overflow-y-auto px-2">
          <NavLinks />
        </nav>
      </aside>
    </>
  )
}
