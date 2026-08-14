"use client"

export async function timedFetch(url: string, options?: RequestInit) {
  const start = performance.now()
  const label = url.replace("/api/", "")

  try {
    const response = await fetch(url, options)
    const duration = performance.now() - start

    const color =
      duration < 200
        ? "color: #10b981; font-weight: bold"
        : duration < 500
          ? "color: #f59e0b; font-weight: bold"
          : "color: #ef4444; font-weight: bold"

    console.log(
      `%c⚡ API [${label}] ${duration.toFixed(0)}ms`,
      color
    )

    return response
  } catch (error) {
    const duration = performance.now() - start
    console.log(
      `%c❌ API [${label}] FAILED after ${duration.toFixed(0)}ms`,
      "color: #ef4444; font-weight: bold"
    )
    throw error
  }
}

export const measureApi = timedFetch
