import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-surface-2 text-text",
        success: "border-transparent bg-success/20 text-success shadow-[0_0_8px_var(--color-success)] opacity-90",
        warning: "border-transparent bg-warning/20 text-warning shadow-[0_0_8px_var(--color-warning)] opacity-90",
        danger: "border-transparent bg-danger/20 text-danger shadow-[0_0_8px_var(--color-danger)] opacity-90",
        accent: "border-transparent bg-accent/20 text-accent shadow-[0_0_8px_var(--color-accent)] opacity-90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
