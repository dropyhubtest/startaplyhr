"use client"

interface SparklineProps {
  data?: number[]
  color?: string
  height?: number
}

export function Sparkline({
  data = [12, 18, 15, 22, 28, 24, 32],
  color = "#6366F1",
  height = 32,
}: SparklineProps) {
  if (!data || data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data) || 1
  const range = max - min || 1

  const width = 100
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width
    const y = height - ((val - min) / range) * (height - 6) - 3
    return `${x},${y}`
  }).join(" ")

  const areaPoints = `0,${height} ${points} ${width},${height}`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
      <defs>
        <linearGradient id={`gradient-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#gradient-${color.replace("#", "")})`} />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}
