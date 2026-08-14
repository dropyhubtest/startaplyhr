"use client"

export async function timedFetch(url: string, options?: RequestInit) {
  try {
    return await fetch(url, options)
  } catch (error) {
    throw error
  }
}

export const measureApi = timedFetch

