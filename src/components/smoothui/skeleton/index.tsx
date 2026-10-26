"use client"

// Adapted from SmoothUI Skeleton (MIT): https://smoothui.dev/docs/primitives/skeleton
import { motion, useReducedMotion } from "motion/react"
import { type ComponentProps, useRef } from "react"
import { cn } from "@/lib/utils"
import { EASE_IN_OUT, LOOP_CLASS, LOOP_REPEAT_DELAY, loopTransition, useLoopInView } from "@/components/smoothui/lib/animation"

type SkeletonProps = ComponentProps<"div"> & { shimmer?: boolean }

export default function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  const shouldReduceMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useLoopInView(ref)
  return <div aria-hidden="true" className={cn("relative overflow-hidden rounded-md bg-foreground-default/10", className)} data-slot="skeleton" ref={ref} {...props}>
    {shimmer && !shouldReduceMotion && inView && <motion.span
      animate={{ transform: ["translateX(-100%)", "translateX(100%)"] }}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-foreground-default/10 to-transparent", LOOP_CLASS)}
      data-slot="skeleton-shimmer"
      initial={{ transform: "translateX(-100%)" }}
      transition={loopTransition({ duration: 1.2, ease: EASE_IN_OUT }, LOOP_REPEAT_DELAY.shimmer)}
    />}
  </div>
}
