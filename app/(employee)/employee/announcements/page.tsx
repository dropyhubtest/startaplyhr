"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { AnnouncementCard } from "@/components/shared/announcement-card"
import { EmptyState } from "@/components/shared/empty-state"
import { toast } from "sonner"
import { Bell, Loader2, Megaphone } from "lucide-react"

export default function EmployeeAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const stored = localStorage.getItem("read-announcements")
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)))
      }
    } catch {
      setReadIds(new Set())
    }
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements")
      const data = await res.json()
      if (res.ok) {
        setAnnouncements(data.announcements)
      }
    } catch (e) {
      toast.error("Failed to load announcements")
    } finally {
      setLoading(false)
    }
  }

  const handleExpand = (id: string) => {
    const newReadIds = new Set(readIds)
    if (!newReadIds.has(id)) {
      newReadIds.add(id)
      setReadIds(newReadIds)
      try {
        localStorage.setItem("read-announcements", JSON.stringify(Array.from(newReadIds)))
      } catch {}
    }
  }

  const unreadCount = announcements.filter(a => !readIds.has(a.id)).length

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Announcements"
        description="Stay updated with company news and important updates"
      />

      {unreadCount > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 mb-6 flex items-center gap-3 shadow-sm animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4 text-indigo-600 animate-pulse" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-indigo-900">
              You have {unreadCount} unread announcement{unreadCount > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-5">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/70 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
              <Megaphone className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-[16px] font-bold text-slate-900 mb-1">No announcements</h3>
            <p className="text-slate-500 text-[13px] font-medium max-w-sm mx-auto">
              There are no announcements to show at this time. Check back later!
            </p>
          </div>
        ) : (
          announcements.map((ann, i) => (
            <div 
              key={ann.id}
              className="cursor-pointer transition-transform active:scale-[0.99] animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
              onClick={() => handleExpand(ann.id)}
            >
              <AnnouncementCard
                announcement={ann}
                isUnread={!readIds.has(ann.id)}
                isAdmin={false}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
