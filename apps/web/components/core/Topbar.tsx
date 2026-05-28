"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

interface TopbarProps {
  serverName: string
}

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Rankings", href: "/rankings" },
  { name: "Item Shop", href: "/itemshop" },
  { name: "Web-Lager", href: "/storage" },
]

export function Topbar({ serverName }: TopbarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <header className="h-16 flex items-center justify-between px-6 md:px-8 bg-[#0a0b0f]/95 backdrop-blur-[12px] border-b border-[var(--color-border)] sticky top-0 z-30 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      
      {/* Left: Logo / Mobile Spacer */}
      <div className="flex items-center gap-4">
        {/* Mobile Spacer for Sidebar Hamburger */}
        <div className="md:hidden w-8" />
        
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="hex-icon w-8 h-8 flex items-center justify-center bg-primary border-primary">
            <span className="text-bg font-display font-bold text-base mt-0.5">M</span>
          </div>
          <span className="font-display font-bold text-primary tracking-widest text-sm md:text-base uppercase hidden sm:block">
            {serverName}
          </span>
        </Link>
      </div>

      {/* Middle: Public Navigation */}
      <nav className="hidden md:flex items-center gap-6 lg:gap-8 h-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "h-full flex items-center px-1 border-b-2 font-display text-xs lg:text-sm tracking-widest uppercase transition-all duration-300",
                isActive 
                  ? "border-primary text-primary font-bold shadow-[0_2px_8px_var(--color-glow)] drop-shadow-[0_0_6px_var(--color-primary)]" 
                  : "border-transparent text-text-muted hover:text-text"
              )}
            >
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Right: Account / Login Actions */}
      <div className="flex items-center gap-4">
        {session?.user ? (
          <div className="flex items-center gap-4">
            {/* User Profile Info */}
            <span className="text-xs font-semibold text-text truncate max-w-[120px] font-display">
              {session.user.name || session.user.email}
            </span>
            
            {/* Logout Button */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="px-3.5 py-1.5 text-xs uppercase tracking-wider font-display font-medium text-text-muted hover:text-text border border-border/20 rounded hover:bg-surface-2/40 transition-all"
            >
              Abmelden
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="px-4 py-1.5 text-xs uppercase tracking-wider font-display font-bold text-bg bg-primary border border-primary hover:bg-primary/90 hover:shadow-[0_0_10px_var(--color-glow)] rounded transition-all"
            >
              Anmelden
            </Link>
          </div>
        )}
      </div>

    </header>
  )
}
