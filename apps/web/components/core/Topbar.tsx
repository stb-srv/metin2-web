"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { User, LogOut, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"

interface TopbarProps {
  serverName: string
}

const navItems = [
  { name: "Startseite", href: "/" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Rangliste", href: "/rankings" },
  { name: "News", href: "/news" },
  { name: "Item-Shop", href: "/itemshop" },
]

export function Topbar({ serverName }: TopbarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()

  return (
    <header className="h-16 flex items-center justify-between px-6 md:px-8 bg-bg/75 backdrop-blur-md border-b border-primary/20 sticky top-0 z-30 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      
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
                  ? "border-primary text-primary font-bold drop-shadow-[0_0_6px_var(--color-primary)]" 
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
            {/* User Profile Card */}
            <Link 
              href="/profile" 
              className="flex items-center gap-3 pl-4 border-l border-border/20 group hover:opacity-95"
            >
              <div className="flex flex-col items-end text-right">
                <span className="text-xs font-semibold text-text group-hover:text-primary transition-colors truncate max-w-[120px]">
                  {session.user.name || session.user.email}
                </span>
                <span className="text-[10px] text-primary/80 font-display uppercase tracking-widest">
                  {session.user.role === "ADMIN" ? "Admin" : `Acc-ID: ${session.user.accountId}`}
                </span>
              </div>
              <div className="h-9 w-9 rounded-full bg-surface-2 border border-border flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                <User className="h-4.5 w-4.5 text-text-muted group-hover:text-primary transition-colors" />
              </div>
            </Link>

            {/* Logout Button */}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 text-text-muted hover:text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 rounded-md transition-all duration-200"
              title="Abmelden"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link 
              href="/login" 
              className="px-3.5 py-1.5 text-xs uppercase tracking-wider font-display font-medium text-text-muted hover:text-text border border-border/20 rounded hover:bg-surface-2/40 transition-all"
            >
              Login
            </Link>
            <Link 
              href="/register" 
              className="px-4 py-1.5 text-xs uppercase tracking-wider font-display font-bold text-bg bg-primary border border-primary hover:bg-primary/90 hover:shadow-[0_0_10px_var(--color-glow)] rounded transition-all"
            >
              Register
            </Link>
          </div>
        )}
      </div>

    </header>
  )
}
