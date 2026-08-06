"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"

export function useClockActions(onActionSuccess?: () => void) {
  const [currentStatus, setCurrentStatus] = useState<"NOT_STARTED" | "WORKING" | "ON_BREAK" | "COMPLETED" | "LOADING">("LOADING")
  const [attendanceLog, setAttendanceLog] = useState<any>(null)
  
  const [workSeconds, setWorkSeconds] = useState(0)
  const [breakSeconds, setBreakSeconds] = useState(0)
  
  const [isLoading, setIsLoading] = useState(false)
  const maxBreakMinutes = 60

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

  const handleClockIn = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/attendance/clock-in", { method: "POST" })
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

  const handleClockOut = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/attendance/clock-out", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setCurrentStatus("COMPLETED")
        fetchToday()
        toast.success("Clocked out successfully!")
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

  return {
    currentStatus,
    attendanceLog,
    workSeconds,
    breakSeconds,
    maxBreakMinutes,
    isLoading,
    handleClockIn,
    handleBreakStart,
    handleBreakEnd,
    handleClockOut,
  }
}
