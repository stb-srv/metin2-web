import * as React from "react"
import { Bell, User } from "lucide-react"

interface TopbarProps {
  serverName: string
}

export function Topbar({ serverName }: TopbarProps) {
  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-surface border-b border-border sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-4">
        {/* Mobile Spacer for Sidebar Hamburger */}
        <div className="md:hidden w-8" />
        
        {/* Breadcrumb / Server Name */}
        <div className="text-sm font-medium text-text-muted hidden sm:block">
          {serverName} <span className="mx-2 text-border">/</span> <span className="text-primary font-display tracking-wide">Dashboard</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        <button className="relative text-text-muted hover:text-primary transition-colors focus:outline-none">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-danger"></span>
          </span>
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 pl-6 border-l border-border/50">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-medium text-text">Spieler</span>
            <span className="text-xs text-primary font-display">Lv. 99</span>
          </div>
          <div className="h-9 w-9 rounded-full bg-surface-2 border border-border flex items-center justify-center overflow-hidden">
            <User className="h-5 w-5 text-text-muted" />
          </div>
        </div>
      </div>
    </header>
  )
}
