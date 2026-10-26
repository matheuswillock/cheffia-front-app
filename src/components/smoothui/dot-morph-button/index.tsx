"use client"

// Adapted from SmoothUI Dot Morph Button (MIT), using Cheffia's shared Button:
// https://smoothui.dev/docs/components/dot-morph-button
import { motion, useReducedMotion } from "motion/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

interface DotMorphButtonProps {
  className?: string
  label: string
  onClick?: () => void
}

export default function DotMorphButton({ label, className, onClick }: DotMorphButtonProps) {
  const [hovered, setHovered] = useState(false)
  const [hoverDevice, setHoverDevice] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return
    const query = window.matchMedia("(hover: hover) and (pointer: fine)")
    const update = () => setHoverDevice(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  const morph = !reduceMotion && hoverDevice && hovered
  return <Button
    type="button"
    variant="ghost"
    onClick={onClick}
    onMouseEnter={() => { if (hoverDevice) setHovered(true) }}
    onMouseLeave={() => setHovered(false)}
    className={className}
  >
    <motion.span
      aria-hidden="true"
      data-slot="morph-dot"
      className="block shrink-0 bg-primary"
      initial={false}
      animate={{ borderRadius: 999, width: morph ? 7 : 9, height: morph ? 18 : 9 }}
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 600, damping: 22, duration: 0.25 }}
    />
    <span>{label}</span>
  </Button>
}
