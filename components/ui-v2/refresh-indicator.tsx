"use client"

import { useIsFetching } from "@tanstack/react-query"
import { RefreshCw } from "lucide-react"

export function RefreshIndicator() {
  const isFetching = useIsFetching()

  if (isFetching === 0) return null

  return (
    <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur border border-slate-200 shadow-lg text-xs text-slate-600 font-medium">
        <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
        <span>Syncing...</span>
      </div>
    </div>
  )
}
