import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { cn, timeAgo, getInitials } from "@/lib/utils"

interface Announcement {
  id: string
  title: string
  content: string
  isUrgent: boolean
  createdAt: string | Date
  createdBy: {
    name: string
  }
}

interface AnnouncementCardProps {
  announcement: Announcement
  onDelete?: (id: string) => void
  isAdmin?: boolean
  isUnread?: boolean
}

export function AnnouncementCard({
  announcement,
  onDelete,
  isAdmin,
  isUnread = false
}: AnnouncementCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-xl border shadow-sm p-5",
      "hover:shadow-md transition-shadow",
      announcement.isUrgent 
        ? "border-l-4 border-l-red-500" 
        : "border-l-4 border-l-indigo-400",
      isUnread && "bg-blue-50/30"
    )}>
      
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {announcement.isUrgent && (
            <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold animate-pulse">
              🔴 URGENT
            </span>
          )}
          {isUnread && (
            <span className="w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {timeAgo(announcement.createdAt)}
          </span>
          {isAdmin && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(announcement.id)
              }}
              className="text-gray-400 hover:text-red-500 h-7 w-7 p-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      
      <h4 className="font-semibold text-gray-900 mb-2 text-base">
        {announcement.title}
      </h4>
      
      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
        {announcement.content}
      </p>
      
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
          <span className="text-xs font-bold text-indigo-700">
            {getInitials(announcement.createdBy?.name || "Unknown")}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          Posted by {announcement.createdBy?.name || "Unknown"}
        </span>
        <span className="text-xs text-gray-300">•</span>
        <span className="text-xs text-gray-400">
          {new Date(announcement.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric"
          })}
        </span>
      </div>
    </div>
  )
}
