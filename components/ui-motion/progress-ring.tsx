"use client"

import React from "react"

interface ProgressRingProps {
  value: number
  size?: number
  strokeWidth?: number
  color?: string
  className?: string
  showLabel?: boolean
}

export function ProgressRing({
  value,
  size = 80,
  strokeWidth = 6,
  color = "#4f46e5", // indigo-600
  className = "",
  showLabel = true,
}: ProgressRingProps) {
  const normalizedValue = Math.min(100, Math.max(0, value))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0" // slate-200
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {showLabel && (
        <span className="absolute text-xs font-bold text-slate-900">
          {Math.round(normalizedValue)}%
        </span>
      )}
    </div>
  )
}
