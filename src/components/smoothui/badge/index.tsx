import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"

// Adapted from SmoothUI Badge (MIT): https://smoothui.dev/docs/primitives/badge
type BadgeVariant = "default" | "secondary" | "outline" | "destructive" | "success" | "warning"
type BadgeSize = "sm" | "md"

interface BadgeProps extends Omit<ComponentProps<"span">, "children"> {
  children?: ReactNode
  size?: BadgeSize
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "border-foreground-default/25 bg-transparent text-foreground-default",
  destructive: "border-transparent bg-destructive text-destructive-foreground",
  success: "border-transparent bg-primary/15 text-primary",
  warning: "border-transparent bg-background-card text-foreground-default",
}

export default function Badge({ children, className, size = "md", variant = "default", ...props }: BadgeProps) {
  return <span
    className={cn(
      "inline-flex w-fit shrink-0 items-center justify-center rounded-full border font-medium transition-colors duration-200",
      size === "md" ? "min-h-5 gap-1 px-2 text-xs" : "min-h-4 gap-0.5 px-1.5 text-xs",
      variantClasses[variant],
      className,
    )}
    data-slot="badge"
    data-variant={variant}
    {...props}
  >{children}</span>
}
