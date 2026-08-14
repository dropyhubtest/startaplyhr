"use client"

import { useState, useEffect } from "react"
import { PageHeader } from "@/components/shared/page-header"
import { AnnouncementCard } from "@/components/shared/announcement-card"
import { EmptyState } from "@/components/shared/empty-state"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Send, Loader2, Megaphone } from "lucide-react"

import { useQuery, useQueryClient } from "@tanstack/react-query"

export default function AdminAnnouncementsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isUrgent, setIsUrgent] = useState(false)
  const [preview, setPreview] = useState(false)

  const { data: annQueryData, isLoading: loading } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const res = await fetch("/api/announcements")
      if (!res.ok) throw new Error("Failed to load announcements")
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const announcements = annQueryData?.announcements || []

  const queryClient = useQueryClient()

  const handlePost = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, isUrgent })
      })
      const data = await res.json()
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["announcements"] })
        setTitle("")
        setContent("")
        setIsUrgent(false)
        toast.success("Announcement posted!")
      } else {
        toast.error(data.error || "Failed to post")
      }
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
  }

  const confirmDelete = async () => {
    if (!deletingId) return
    try {
      const res = await fetch(`/api/announcements/${deletingId}`, {
        method: "DELETE"
      })
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["announcements"] })
        toast.success("Announcement deleted")
      } else {
        toast.error("Failed to delete")
      }
    } catch (e) {
      toast.error("An error occurred")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in-fade">
      <PageHeader
        title="Announcements"
        description="Post updates and news to your team"
      />

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="w-full lg:w-2/5 bg-white rounded-xl border border-slate-200/70 shadow-sm p-6 sticky top-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center border border-indigo-100 flex-shrink-0">
              <Megaphone className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-slate-900 leading-tight">New Announcement</h3>
              <p className="text-[12px] text-slate-500 mt-0.5">Broadcast a message to everyone</p>
            </div>
          </div>
          
          <div className="space-y-1.5 mb-5">
            <div className="flex justify-between items-center">
              <label className="text-[13px] font-semibold text-slate-700">Title <span className="text-rose-500">*</span></label>
              <span className="text-[11px] font-medium text-slate-400">{title.length}/100</span>
            </div>
            <Input
              placeholder="E.g., Q3 Townhall Meeting"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              className={`h-10 text-[13px] shadow-sm ${isUrgent ? "border-rose-300 bg-rose-50/30 focus-visible:ring-rose-500" : "border-slate-200 focus-visible:ring-indigo-500 bg-slate-50/50"}`}
            />
          </div>
          
          <div className="space-y-1.5 mb-5">
            <div className="flex justify-between items-center">
              <label className="text-[13px] font-semibold text-slate-700">Content <span className="text-rose-500">*</span></label>
              <span className="text-[11px] font-medium text-slate-400">{content.length} chars</span>
            </div>
            <Textarea
              placeholder="Write your announcement here. Markdown is supported."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className={`resize-none text-[13px] shadow-sm ${isUrgent ? "border-rose-300 bg-rose-50/30 focus-visible:ring-rose-500" : "border-slate-200 focus-visible:ring-indigo-500 bg-slate-50/50"}`}
            />
          </div>
          
          <div className={`flex items-center justify-between p-4 rounded-xl border mb-5 shadow-sm transition-colors ${isUrgent ? "bg-rose-50/50 border-rose-200" : "bg-slate-50 border-slate-200/60"}`}>
            <div>
              <p className={`text-[13px] font-semibold ${isUrgent ? "text-rose-900" : "text-slate-900"}`}>Mark as Urgent</p>
              <p className={`text-[11px] mt-0.5 font-medium ${isUrgent ? "text-rose-600" : "text-slate-500"}`}>Highlights in red and alerts employees</p>
            </div>
            <Switch 
              checked={isUrgent} 
              onCheckedChange={setIsUrgent} 
              className={isUrgent ? "data-[state=checked]:bg-rose-600" : "data-[state=checked]:bg-indigo-600"}
            />
          </div>
          
          <div className="flex items-center gap-2 mb-6 p-2 rounded-lg bg-slate-50/50 border border-slate-100 w-fit">
            <Switch checked={preview} onCheckedChange={setPreview} id="preview-mode" className="scale-75 data-[state=checked]:bg-indigo-600" />
            <label htmlFor="preview-mode" className="cursor-pointer text-[12px] font-medium text-slate-600 select-none">Show Preview</label>
          </div>
          
          {preview && (title || content) && (
            <div className="mb-6 animate-fade-in">
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">Live Preview</p>
              <div className="pointer-events-none ring-2 ring-indigo-500/20 rounded-xl">
                <AnnouncementCard 
                  announcement={{
                    id: "preview",
                    title: title || "Untitled Announcement",
                    content: content || "No content provided yet.",
                    isUrgent,
                    createdAt: new Date(),
                    createdBy: { name: "You" }
                  }}
                  isAdmin={false}
                />
              </div>
            </div>
          )}
          
          <button 
            className="w-full inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-[13px] font-medium shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            onClick={handlePost}
            disabled={!title || !content || title.length < 3 || content.length < 10 || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Publish Announcement
          </button>
          <p className="text-[11px] font-medium text-slate-400 text-center mt-3">
            This will be immediately visible to all employees
          </p>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full lg:w-3/5 space-y-4">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : announcements.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="No announcements"
              description="You haven't posted any announcements yet."
            />
          ) : (
            <div className="space-y-4 animate-fade-in">
              {announcements.map((ann: any) => (
                <AnnouncementCard 
                  key={ann.id} 
                  announcement={ann}
                  onDelete={handleDelete}
                  isAdmin={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={confirmDelete}
        title="Delete Announcement"
        description="Are you sure you want to delete this announcement? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  )
}
