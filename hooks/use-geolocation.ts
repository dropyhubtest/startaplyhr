"use client"

import { useState, useCallback } from "react"

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  error: string | null
  loading: boolean
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
  })

  const requestLocation = useCallback((): Promise<{
    latitude: number
    longitude: number
    accuracy: number
  } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setState((prev) => ({
          ...prev,
          error: "Geolocation is not supported by your browser",
          loading: false,
        }))
        resolve(null)
        return
      }

      setState((prev) => ({ ...prev, loading: true, error: null }))

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }
          setState({
            ...result,
            error: null,
            loading: false,
          })
          resolve(result)
        },
        (error) => {
          let errorMessage = "Failed to get location"
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied"
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable"
              break
            case error.TIMEOUT:
              errorMessage = "Location request timed out"
              break
          }
          setState({
            latitude: null,
            longitude: null,
            accuracy: null,
            error: errorMessage,
            loading: false,
          })
          resolve(null)
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0, // Force fresh location reading
        }
      )
    })
  }, [])

  return {
    ...state,
    requestLocation,
  }
}
