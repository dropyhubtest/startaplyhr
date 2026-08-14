"use client"

import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { useAuth } from "@/hooks/use-auth"
import { getInitials } from "@/lib/utils"
import { NotificationBell } from "@/components/shared/notification-bell"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, 
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Menu, User, Settings as SettingsIcon, LogOut, 
  Search, Command, ChevronRight, Plus
} from "lucide-react"

interface TopbarProps {
  onMenuClick: () => void
}

function getPageInfo(pathname: string) {
  if (pathname.includes("/dashboard")) 
    return { title: "Dashboard", section: "Main" }
  if (pathname.includes("/employees")) 
    return { title: "Employees", section: "Main" }
  if (pathname.includes("/attendance")) 
    return { title: "Attendance", section: "Main" }
  if (pathname.includes("/leaves")) 
    return { title: "Leaves", section: "Main" }
  if (pathname.includes("/tasks")) 
    return { title: "Tasks", section: "Main" }
  if (pathname.includes("/reports")) 
    return { title: "Reports", section: "Insights" }
  if (pathname.includes("/announcements")) 
    return { title: "Announcements", section: "Insights" }
  if (pathname.includes("/notifications")) 
    return { title: "Notifications", section: "Insights" }
  if (pathname.includes("/settings")) 
    return { title: "Settings", section: "Workspace" }
  if (pathname.includes("/profile")) 
    return { title: "Profile", section: "Workspace" }
  return { title: "Startaply", section: "Portal" }
}

export default function AdminTopbar({ 
  onMenuClick 
}: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const pageInfo = getPageInfo(pathname)

  return (
    <header className="h-16 glass border-b border-slate-200/60 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 transition-all">
      
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          suppressHydrationWarning
          className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-600 cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>
        
        <nav className="flex items-center gap-2 text-xs font-semibold">
          <span className="text-slate-400 uppercase tracking-wider">{pageInfo.section}</span>
          <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
          <span className="text-slate-900 font-bold text-sm tracking-tight">
            {pageInfo.title}
          </span>
        </nav>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button 
          suppressHydrationWarning
          className="w-full flex items-center justify-between h-9 px-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:bg-white hover:border-slate-300 hover:shadow-xs text-xs text-slate-500 transition-all group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
            <span>Search employees, tasks, reports...</span>
          </div>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        <NotificationBell />
        
        <div className="w-px h-5 bg-slate-200 mx-0.5" />
        
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer outline-none">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-xs shadow-indigo-600/20">
              <span className="text-xs font-bold text-white">
                {getInitials(user?.name || "A")}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-64 bg-white border border-slate-200 shadow-xl rounded-2xl p-2 animate-scale-in"
          >
            <DropdownMenuLabel className="px-3 py-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center shadow-xs">
                  <span className="text-xs font-bold text-white">
                    {getInitials(user?.name || "A")}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.name || "Administrator"}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                    {user?.email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1.5 bg-slate-100" />
            <DropdownMenuItem 
              onClick={() => router.push("/admin/profile")}
              className="text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-700"
            >
              <User className="w-4 h-4 mr-2.5 text-slate-400" />
              Your Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => router.push("/admin/settings")}
              className="text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-50 text-slate-700"
            >
              <SettingsIcon className="w-4 h-4 mr-2.5 text-slate-400" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1.5 bg-slate-100" />
            <DropdownMenuItem 
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut className="w-4 h-4 mr-2.5" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
