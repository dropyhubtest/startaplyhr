"use client"

import { useEffect, useState } from "react"

interface AnimatedNumberProps {
  value: number
  duration?: number
  className?: string
}

export function AnimatedNumber({
  value,
  duration = 1000,
  className = "",
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    const startValue = displayValue
    const endValue = value

    if (startValue === endValue) return

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      const current = Math.floor(progress * (endValue - startValue) + startValue)
      setDisplayValue(current)

      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }

    window.requestAnimationFrame(step)
  }, [value, duration])

  return <span className={className}>{displayValue.toLocaleString()}</span>
}
