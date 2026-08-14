"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { useParams, useRouter } from "next/navigation"
import { PageHeader } from "@/components/shared/page-header"
import { StatusBadge } from "@/components/shared/status-badge"
import { ArrowLeft, MapPin, Clock, Navigation, Route, Loader2 } from "lucide-react"
import { formatDate, formatTime, formatDuration } from "@/lib/utils"

const LocationMap = dynamic(() => import("@/components/maps/location-map"), { ssr: false })

export default function AdminLocationPage() {
  const params = useParams()
  const router = useRouter()
  const attendanceLogId = params.attendanceLogId as string

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/attendance/location/${attendanceLogId}`)
        if (!res.ok) {
          const err = await res.json()
          setError(err.error || "Failed to fetch location data")
          return
        }
        setData(await res.json())
      } catch (e) {
        setError("Failed to fetch location data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [attendanceLogId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-[13px] font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Attendance
        </button>
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Navigation className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">{error || "No location data found"}</p>
        </div>
      </div>
    )
  }

  const { attendanceLog: log, employee, locationPings } = data
  const hasLogin = log.loginLatitude != null && log.loginLongitude != null
  const hasLogout = log.logoutLatitude != null && log.logoutLongitude != null

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-[13px] font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Attendance
      </button>

      <PageHeader
        title={`Location: ${employee.name}`}
        description={`${employee.department} • ${employee.employeeId} • ${formatDate(new Date(log.date))}`}
      />

      {/* Map */}
      <LocationMap
        loginLatitude={log.loginLatitude}
        loginLongitude={log.loginLongitude}
        loginAddress={log.loginAddress}
        logoutLatitude={log.logoutLatitude}
        logoutLongitude={log.logoutLongitude}
        logoutAddress={log.logoutAddress}
        locationPings={locationPings}
        height="450px"
        showRoute={true}
      />

      {/* Details Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Clock In Card */}
        <div className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full" />
            <h4 className="text-[13px] font-bold text-emerald-800">Clock In</h4>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[12px] font-medium text-slate-500">Time</span>
              <span className="text-[13px] font-bold text-slate-900">
                {log.loginTime ? formatTime(log.loginTime) : "—"}
              </span>
            </div>
            {hasLogin && (
              <>
                <div className="flex justify-between items-start">
                  <span className="text-[12px] font-medium text-slate-500">Address</span>
                  <span className="text-[12px] font-medium text-slate-700 text-right max-w-[200px]">
                    {log.loginAddress || "Address unavailable"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-medium text-slate-500">City</span>
                  <span className="text-[12px] font-bold text-emerald-700">
                    {log.loginCity || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-medium text-slate-500">Coordinates</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {log.loginLatitude?.toFixed(5)}, {log.loginLongitude?.toFixed(5)}
                  </span>
                </div>
              </>
            )}
            {!hasLogin && (
              <p className="text-[12px] text-slate-400 italic">No location captured</p>
            )}
          </div>
        </div>

        {/* Clock Out Card */}
        <div className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-rose-50 border-b border-rose-100 flex items-center gap-2">
            <div className="w-3 h-3 bg-rose-500 rounded-full" />
            <h4 className="text-[13px] font-bold text-rose-800">Clock Out</h4>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[12px] font-medium text-slate-500">Time</span>
              <span className="text-[13px] font-bold text-slate-900">
                {log.logoutTime ? formatTime(log.logoutTime) : "—"}
              </span>
            </div>
            {hasLogout && (
              <>
                <div className="flex justify-between items-start">
                  <span className="text-[12px] font-medium text-slate-500">Address</span>
                  <span className="text-[12px] font-medium text-slate-700 text-right max-w-[200px]">
                    {log.logoutAddress || "Address unavailable"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-medium text-slate-500">City</span>
                  <span className="text-[12px] font-bold text-rose-700">
                    {log.logoutCity || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-medium text-slate-500">Coordinates</span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {log.logoutLatitude?.toFixed(5)}, {log.logoutLongitude?.toFixed(5)}
                  </span>
                </div>
              </>
            )}
            {!hasLogout && (
              <p className="text-[12px] text-slate-400 italic">Not yet clocked out or no location captured</p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</span>
            <StatusBadge status={log.status} size="sm" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Net Work</span>
            <span className="text-[14px] font-bold text-slate-900">{formatDuration(log.netWorkMinutes || 0)}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Duration</span>
            <span className="text-[14px] font-bold text-slate-900">{formatDuration(log.totalWorkMinutes || 0)}</span>
          </div>
        </div>

        {log.totalDistanceKm > 0 && (
          <div className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-lg border border-indigo-100">
            <Route className="w-4 h-4 text-indigo-600" />
            <span className="text-[13px] font-bold text-indigo-700">
              {log.totalDistanceKm} km traveled
            </span>
          </div>
        )}
      </div>

      {/* Location Pings Timeline */}
      {locationPings && locationPings.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30">
            <h4 className="text-[13px] font-semibold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-500" />
              Location Pings ({locationPings.length})
            </h4>
          </div>
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {locationPings.map((ping: any, i: number) => (
              <div key={ping.id} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-400 w-6">#{i + 1}</span>
                  <div>
                    <span className="text-[12px] font-semibold text-slate-800">
                      {new Date(ping.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    {ping.address && (
                      <span className="text-[11px] text-slate-400 ml-2">{ping.address}</span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {ping.latitude.toFixed(5)}, {ping.longitude.toFixed(5)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
