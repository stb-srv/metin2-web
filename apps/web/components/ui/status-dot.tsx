import * as React from "react"
import { cn } from "@/lib/utils"

interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "online" | "warning" | "offline"
}

export function StatusDot({ status, className, ...props }: StatusDotProps) {
  const statusColors = {
    online: "bg-success shadow-[0_0_6px_var(--color-success)]",
    warning: "bg-warning shadow-[0_0_6px_var(--color-warning)]",
    offline: "bg-danger shadow-[0_0_6px_var(--color-danger)]",
  }

  return (
    <span className={cn("relative flex h-2 w-2", className)} {...props}>
      <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", statusColors[status])}></span>
      <span className={cn("relative inline-flex rounded-full h-2 w-2", statusColors[status])}></span>
    </span>
  )
}
