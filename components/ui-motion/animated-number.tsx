"use client"

import { useEffect, useState, useRef } from "react"

interface AnimatedNumberProps {
  value: number
  duration?: number
  format?: (n: number) => string
  className?: string
}

export function AnimatedNumber({
  value,
  duration = 800,
  format = (n) => Math.round(n).toLocaleString(),
  className = "",
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const startValueRef = useRef(0)

  useEffect(() => {
    startValueRef.current = displayValue
    startTimeRef.current = null

    let animationFrameId: number

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)

      // Ease out quad formula
      const easeProgress = 1 - (1 - progress) * (1 - progress)
      const current = startValueRef.current + (value - startValueRef.current) * easeProgress

      setDisplayValue(current)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      }
    }

    animationFrameId = requestAnimationFrame(step)

    return () => cancelAnimationFrame(animationFrameId)
  }, [value, duration])

  return <span className={className}>{format(displayValue)}</span>
}
