"use client"

import { motion, useReducedMotion } from "motion/react"
import GooeyFilter from "@/components/smoothui/gooey-filter"

/** Decorative merging dots. The parent button carries the accessible loading label. */
export function MergingLoader() {
  const reduceMotion = useReducedMotion()
  return <span aria-hidden="true" data-slot="gooey-loader" className="inline-flex h-6 w-8 shrink-0 items-center justify-center overflow-hidden">
    <GooeyFilter disabled={Boolean(reduceMotion)} strength={2} contrast={16} className="relative h-5 w-7">
      <motion.span
        className="absolute left-1 top-1 size-3 rounded-full bg-current"
        animate={reduceMotion ? undefined : { x: [0, 9, 0] }}
        transition={reduceMotion ? undefined : { duration: 0.95, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.span
        className="absolute right-1 top-1 size-3 rounded-full bg-current"
        animate={reduceMotion ? undefined : { x: [0, -9, 0] }}
        transition={reduceMotion ? undefined : { duration: 0.95, ease: "easeInOut", repeat: Infinity }}
      />
    </GooeyFilter>
  </span>
}
