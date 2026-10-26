"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { MergingLoader } from "@/components/smoothui/gooey-filter/merging-loader"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-[color,background-color,border-color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "bg-background-default border border-input shadow-sm hover:bg-primary hover:text-primary-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-9 px-6 text-base md:h-10 xl:h-[52px] xl:px-10 xl:text-xl",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingLabel?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, loadingLabel = "Carregando...", children, disabled, onClick, onClickCapture, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const loadingContent = <><MergingLoader />{loadingLabel}</>
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        aria-busy={loading || undefined}
        aria-disabled={asChild && (disabled || loading) || undefined}
        disabled={asChild ? undefined : disabled || loading}
        {...props}
        onClickCapture={(event: React.MouseEvent<HTMLButtonElement>) => {
          if (asChild && (loading || disabled)) event.preventDefault()
          else onClickCapture?.(event)
        }}
        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
          if (asChild && (loading || disabled)) event.preventDefault()
          else onClick?.(event)
        }}
      >{asChild && loading && React.isValidElement<{ children?: React.ReactNode }>(children)
        ? React.cloneElement(children, undefined, loadingContent)
        : loading ? loadingContent : children}</Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
