"use client"

// SmoothUI Gooey Filter (MIT): https://smoothui.dev/docs/components/gooey-filter
import { type ElementType, type ReactNode, useId } from "react"
import { cn } from "@/lib/utils"

interface GooeyFilterProps {
  as?: ElementType
  children: ReactNode
  className?: string
  contrast?: number
  disabled?: boolean
  intensity?: number
  strength?: number
}

export default function GooeyFilter({ as, children, className, contrast, disabled = false, intensity, strength }: GooeyFilterProps) {
  const filterId = useId()
  const Wrapper = as ?? "div"
  const resolvedStrength = strength ?? intensity ?? 8
  const resolvedContrast = contrast ?? (intensity === undefined ? 18 : intensity * 18 / 8)

  if (disabled) return <Wrapper className={className}>{children}</Wrapper>

  return <>
    <svg aria-hidden="true" className="absolute" style={{ height: 0, overflow: "hidden", width: 0 }}>
      <defs><filter id={filterId}>
        <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation={resolvedStrength} />
        <feColorMatrix in="blur" result="goo" type="matrix" values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${resolvedContrast} ${-resolvedContrast * 0.5}`} />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter></defs>
    </svg>
    <Wrapper className={cn(className)} style={{ filter: `url(#${filterId})` }}>{children}</Wrapper>
  </>
}
