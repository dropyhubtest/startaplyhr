"use client"

export function logNavigation(pageName: string) {
  if (typeof window === "undefined") return

  // Console explanation banner
  console.log(
    "%c💡 NOTE: Fast Refresh = Dev server recompilation (Dev only) | Page Load = What real users experience",
    "color: #6366f1; font-weight: bold; font-size: 11px; background: #e0e7ff; padding: 4px 8px; border-radius: 4px;"
  )

  // Navigation Timing
  setTimeout(() => {
    const navStart = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
    if (navStart) {
      console.group(`📊 Real Page Performance: ${pageName}`)
      console.log(`🌐 DNS Lookup: ${(navStart.domainLookupEnd - navStart.domainLookupStart).toFixed(0)}ms`)
      console.log(`🔌 Connection: ${(navStart.connectEnd - navStart.connectStart).toFixed(0)}ms`)
      console.log(`⚡ TTFB (Request/Response): ${navStart.responseStart.toFixed(0)}ms`)
      console.log(`📄 DOM Interactive: ${navStart.domInteractive.toFixed(0)}ms`)
      console.log(`✅ DOM Complete / Fully Loaded: ${navStart.loadEventEnd.toFixed(0)}ms`)
      console.groupEnd()
    }
  }, 100)

  // Client Navigation timing from sidebar clicks
  const startTime = sessionStorage.getItem("nav-start")
  const target = sessionStorage.getItem("nav-target")

  if (startTime && (target === window.location.pathname || window.location.pathname.startsWith(target || ""))) {
    const duration = performance.now() - Number(startTime)
    const color =
      duration < 300
        ? "color: #10b981; font-weight: bold"
        : duration < 700
          ? "color: #f59e0b; font-weight: bold"
          : "color: #ef4444; font-weight: bold"

    console.log(
      `%c🚀 Client Navigation to [${target}] loaded in ${duration.toFixed(0)}ms`,
      color
    )
    sessionStorage.removeItem("nav-start")
    sessionStorage.removeItem("nav-target")
  }
}
