"use client"

import { useEffect, useState, useRef } from "react"
import { MapPin, Navigation } from "lucide-react"

interface LocationMapProps {
  loginLatitude?: number | null
  loginLongitude?: number | null
  loginAddress?: string | null
  logoutLatitude?: number | null
  logoutLongitude?: number | null
  logoutAddress?: string | null
  locationPings?: Array<{
    latitude: number
    longitude: number
    timestamp: string
  }>
  height?: string
  showRoute?: boolean
}

export default function LocationMap({
  loginLatitude,
  loginLongitude,
  loginAddress,
  logoutLatitude,
  logoutLongitude,
  logoutAddress,
  locationPings = [],
  height = "400px",
  showRoute = true,
}: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [loading, setLoading] = useState(true)

  const hasLogin = loginLatitude != null && loginLongitude != null
  const hasLogout = logoutLatitude != null && logoutLongitude != null

  useEffect(() => {
    if (!hasLogin && !hasLogout) {
      setLoading(false)
      return
    }

    let isMounted = true

    // Dynamically import Leaflet on client side
    import("leaflet").then((L) => {
      if (!isMounted || !containerRef.current) return

      // Fix Leaflet default icon asset paths
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      })

      // Standard Leaflet container cleanup to prevent re-initialization error
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      // Determine initial center
      const center: [number, number] = hasLogin
        ? [loginLatitude!, loginLongitude!]
        : [logoutLatitude!, logoutLongitude!]

      // Create raw Leaflet map instance tied to ref
      const map = L.map(containerRef.current, {
        center,
        zoom: 14,
        scrollWheelZoom: true,
      })

      mapInstanceRef.current = map

      // Add OpenStreetMap tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map)

      // Clock-in marker
      if (hasLogin) {
        const loginIcon = L.divIcon({
          html: `<div style="background:#10b981;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='white' stroke='white' stroke-width='2'><polygon points='5 3 19 12 5 21 5 3'/></svg></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          className: "",
        })

        const marker = L.marker([loginLatitude!, loginLongitude!], { icon: loginIcon }).addTo(map)
        marker.bindPopup(`
          <div style="font-family:sans-serif;font-size:13px;">
            <p style="font-weight:bold;color:#047857;margin:0 0 4px 0;">📍 Clock In</p>
            ${loginAddress ? `<p style="color:#475569;margin:0;">${loginAddress}</p>` : ""}
          </div>
        `)
      }

      // Clock-out marker
      if (hasLogout) {
        const logoutIcon = L.divIcon({
          html: `<div style="background:#ef4444;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='white' stroke='white' stroke-width='2'><rect x='6' y='6' width='12' height='12'/></svg></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          className: "",
        })

        const marker = L.marker([logoutLatitude!, logoutLongitude!], { icon: logoutIcon }).addTo(map)
        marker.bindPopup(`
          <div style="font-family:sans-serif;font-size:13px;">
            <p style="font-weight:bold;color:#b91c1c;margin:0 0 4px 0;">📍 Clock Out</p>
            ${logoutAddress ? `<p style="color:#475569;margin:0;">${logoutAddress}</p>` : ""}
          </div>
        `)
      }

      // Polyline route
      const routePoints: [number, number][] = []
      if (hasLogin) routePoints.push([loginLatitude!, loginLongitude!])
      if (showRoute && locationPings.length > 0) {
        locationPings.forEach((p) => routePoints.push([p.latitude, p.longitude]))
      }
      if (hasLogout) routePoints.push([logoutLatitude!, logoutLongitude!])

      if (showRoute && routePoints.length >= 2) {
        L.polyline(routePoints, {
          color: "#6366f1",
          weight: 3,
          opacity: 0.7,
          dashArray: "8, 4",
        }).addTo(map)

        const bounds = L.latLngBounds(routePoints)
        map.fitBounds(bounds, { padding: [40, 40] })
      }

      setLoading(false)
    })

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [loginLatitude, loginLongitude, logoutLatitude, logoutLongitude, showRoute, locationPings, hasLogin, hasLogout])

  if (!hasLogin && !hasLogout) {
    return (
      <div
        className="flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200"
        style={{ height }}
      >
        <div className="text-slate-400 flex flex-col items-center gap-2">
          <Navigation className="w-8 h-8" />
          <span className="text-sm font-medium">No location data available</span>
        </div>
      </div>
    )
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100 animate-pulse">
          <div className="text-slate-400 flex flex-col items-center gap-2">
            <MapPin className="w-8 h-8" />
            <span className="text-sm font-medium">Loading map...</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
