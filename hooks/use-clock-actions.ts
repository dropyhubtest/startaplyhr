"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useGeolocation } from "./use-geolocation"

export function useClockActions(onActionSuccess?: () => void) {
  const [currentStatus, setCurrentStatus] = useState<"NOT_STARTED" | "WORKING" | "ON_BREAK" | "COMPLETED" | "LOADING">("LOADING")
  const [attendanceLog, setAttendanceLog] = useState<any>(null)
  
  const [workSeconds, setWorkSeconds] = useState(0)
  const [breakSeconds, setBreakSeconds] = useState(0)
  
  const [isLoading, setIsLoading] = useState(false)
  const maxBreakMinutes = 60

  // Location state
  const { requestLocation } = useGeolocation()
  const [showLocationConsent, setShowLocationConsent] = useState(false)
  const [pendingAction, setPendingAction] = useState<"clock-in" | "clock-out" | null>(null)
  const [locationLoading, setLocationLoading] = useState(false)

  const fetchToday = useCallback(async () => {
    try {
      const res = await fetch("/api/attendance/today")
      const data = await res.json()
      if (res.ok) {
        setAttendanceLog(data.attendanceLog)
        setCurrentStatus(data.currentStatus)

        // Init timers
        if (data.attendanceLog) {
          if (data.currentStatus === "WORKING" && data.attendanceLog.loginTime) {
            const loginTime = new Date(data.attendanceLog.loginTime)
            const elapsed = Math.floor((Date.now() - loginTime.getTime()) / 1000)
            setWorkSeconds(Math.max(0, elapsed - ((data.attendanceLog.totalBreakMinutes || 0) * 60)))
          } else if (data.currentStatus === "ON_BREAK") {
            const openBreak = data.attendanceLog.breaks.find((b: any) => !b.breakEnd)
            if (openBreak) {
              const breakStart = new Date(openBreak.breakStart)
              const elapsedBreak = Math.floor((Date.now() - breakStart.getTime()) / 1000)
              setBreakSeconds(elapsedBreak)
            }
            if (data.attendanceLog.loginTime) {
              const loginTime = new Date(data.attendanceLog.loginTime)
              const elapsedWork = Math.floor((Date.now() - loginTime.getTime()) / 1000)
              const prevBreaks = data.attendanceLog.totalBreakMinutes || 0
              setWorkSeconds(Math.max(0, elapsedWork - (prevBreaks * 60) - breakSeconds))
            }
          }
        } else {
          setCurrentStatus("NOT_STARTED")
        }
      }
    } catch (error) {
      console.error(error)
    }
  }, [breakSeconds])

  useEffect(() => {
    fetchToday()
  }, [fetchToday])

  // Timers
  useEffect(() => {
    if (currentStatus === "WORKING") {
      const interval = setInterval(() => setWorkSeconds(prev => prev + 1), 1000)
      return () => clearInterval(interval)
    }
  }, [currentStatus])

  useEffect(() => {
    if (currentStatus === "ON_BREAK") {
      const interval = setInterval(() => setBreakSeconds(prev => prev + 1), 1000)
      return () => clearInterval(interval)
    }
  }, [currentStatus])

  // Check if user has consented to location tracking
  const hasLocationConsent = useCallback(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem("locationTrackingConsent") === "true"
  }, [])

  // Initiate clock-in with location
  const handleClockIn = async () => {
    if (!hasLocationConsent()) {
      setPendingAction("clock-in")
      setShowLocationConsent(true)
      return
    }
    await performClockIn(true)
  }

  // Perform actual clock-in with optional location
  const performClockIn = async (withLocation: boolean) => {
    setIsLoading(true)
    try {
      let locationData: any = {}

      if (withLocation) {
        setLocationLoading(true)
        const loc = await requestLocation()
        setLocationLoading(false)
        if (loc) {
          locationData = {
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.accuracy,
          }
        }
      }

      const res = await fetch("/api/attendance/clock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(locationData),
      })
      const data = await res.json()
      if (res.ok) {
        setAttendanceLog(data.attendanceLog)
        setCurrentStatus("WORKING")
        setWorkSeconds(0)
        toast(data.message, { style: data.isLate ? { background: '#FFF7ED', color: '#C2410C' } : undefined })
        onActionSuccess?.()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBreakStart = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/attendance/break-start", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setCurrentStatus("ON_BREAK")
        setBreakSeconds(0)
        fetchToday()
        toast.success("Break started")
        onActionSuccess?.()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBreakEnd = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/attendance/break-end", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setCurrentStatus("WORKING")
        setBreakSeconds(0)
        fetchToday()
        toast.success(data.message)
        if (data.exceededLimit) {
          toast.error("Break limit exceeded!")
        }
        onActionSuccess?.()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Initiate clock-out with location
  const handleClockOut = async () => {
    await performClockOut(hasLocationConsent())
  }

  // Perform actual clock-out with optional location
  const performClockOut = async (withLocation: boolean) => {
    setIsLoading(true)
    try {
      let locationData: any = {}

      if (withLocation) {
        const loc = await requestLocation()
        if (loc) {
          locationData = {
            latitude: loc.latitude,
            longitude: loc.longitude,
          }
        }
      }

      const res = await fetch("/api/attendance/clock-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(locationData),
      })
      const data = await res.json()
      if (res.ok) {
        setCurrentStatus("COMPLETED")
        fetchToday()
        const msg = data.summary?.logoutCity
          ? `Clocked out from ${data.summary.logoutCity}${data.summary.totalDistanceKm > 0 ? ` (${data.summary.totalDistanceKm}km traveled)` : ""}`
          : "Clocked out successfully!"
        toast.success(msg)
        onActionSuccess?.()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle location consent response
  const handleLocationConsent = async () => {
    localStorage.setItem("locationTrackingConsent", "true")
    setShowLocationConsent(false)
    if (pendingAction === "clock-in") {
      await performClockIn(true)
    } else if (pendingAction === "clock-out") {
      await performClockOut(true)
    }
    setPendingAction(null)
  }

  const handleLocationDeny = async () => {
    localStorage.setItem("locationTrackingConsent", "false")
    setShowLocationConsent(false)
    if (pendingAction === "clock-in") {
      await performClockIn(false)
    } else if (pendingAction === "clock-out") {
      await performClockOut(false)
    }
    setPendingAction(null)
  }

  return {
    currentStatus,
    attendanceLog,
    workSeconds,
    breakSeconds,
    maxBreakMinutes,
    isLoading,
    locationLoading,
    showLocationConsent,
    handleClockIn,
    handleBreakStart,
    handleBreakEnd,
    handleClockOut,
    handleLocationConsent,
    handleLocationDeny,
    setShowLocationConsent,
  }
}
