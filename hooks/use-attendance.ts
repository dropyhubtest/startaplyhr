'use client'

import { useState, useCallback } from 'react'
import axios from 'axios'
import { AttendanceLog, EmployeeWorkStatus } from '@/types'
import toast from 'react-hot-toast'

export function useAttendance() {
  const [status, setStatus] = useState<EmployeeWorkStatus>('NOT_STARTED')
  const [todayLog, setTodayLog] = useState<AttendanceLog | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchTodayAttendance = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await axios.get('/api/attendance/today')
      if (data.data) {
        setTodayLog(data.data)
        // Determine current status from the log
        // This logic will be expanded in Part 3
      }
    } catch (error) {
      console.error('Failed to fetch today attendance:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const clockIn = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await axios.post('/api/attendance/login')
      if (data.success) {
        setStatus('WORKING')
        setTodayLog(data.data)
        toast.success('Clocked in successfully!')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to clock in')
    } finally {
      setLoading(false)
    }
  }, [])

  const clockOut = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await axios.post('/api/attendance/logout')
      if (data.success) {
        setStatus('COMPLETED')
        setTodayLog(data.data)
        toast.success('Clocked out successfully!')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to clock out')
    } finally {
      setLoading(false)
    }
  }, [])

  const startBreak = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await axios.post('/api/attendance/break-start')
      if (data.success) {
        setStatus('ON_BREAK')
        toast.success('Break started')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start break')
    } finally {
      setLoading(false)
    }
  }, [])

  const endBreak = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await axios.post('/api/attendance/break-end')
      if (data.success) {
        setStatus('WORKING')
        toast.success('Break ended')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to end break')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    status,
    todayLog,
    loading,
    fetchTodayAttendance,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
  }
}
