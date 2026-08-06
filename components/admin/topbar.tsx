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
  Search, Command,
} from "lucide-react"

interface TopbarProps {
  onMenuClick: () => void
}

function getPageInfo(pathname: string) {
  if (pathname.includes("/dashboard")) 
    return { title: "Dashboard" }
  if (pathname.includes("/employees")) 
    return { title: "Employees" }
  if (pathname.includes("/attendance")) 
    return { title: "Attendance" }
  if (pathname.includes("/leaves")) 
    return { title: "Leaves" }
  if (pathname.includes("/tasks")) 
    return { title: "Tasks" }
  if (pathname.includes("/reports")) 
    return { title: "Reports" }
  if (pathname.includes("/announcements")) 
    return { title: "Announcements" }
  if (pathname.includes("/notifications")) 
    return { title: "Notifications" }
  if (pathname.includes("/settings")) 
    return { title: "Settings" }
  if (pathname.includes("/profile")) 
    return { title: "Profile" }
  return { title: "Startaply" }
}

export default function AdminTopbar({ 
  onMenuClick 
}: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const pageInfo = getPageInfo(pathname)

  return (
    <header className="h-16 bg-white/70 backdrop-blur-xl 
      border-b border-slate-200/70 flex items-center 
      justify-between px-4 lg:px-8 sticky top-0 z-10">
      
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg 
            hover:bg-slate-100 text-slate-600"
        >
          <Menu className="w-4 h-4" />
        </button>
        
        <h1 className="text-[16px] font-semibold 
          text-slate-900 tracking-tight">
          {pageInfo.title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        
        {/* Search */}
        <button className="hidden md:flex items-center gap-2.5 
          h-9 px-3 pr-2 rounded-lg 
          bg-slate-50 border border-slate-200 
          hover:bg-white hover:border-slate-300 
          hover:shadow-sm text-[12.5px] text-slate-500 
          transition-all">
          <Search className="w-3.5 h-3.5" strokeWidth={2} />
          <span>Search anything...</span>
          <div className="flex items-center gap-0.5 ml-8 
            px-1.5 py-0.5 rounded bg-white border 
            border-slate-200">
            <Command className="w-2.5 h-2.5" />
            <span className="text-[10px] font-mono">K</span>
          </div>
        </button>
        
        <NotificationBell />
        
        <div className="w-px h-6 bg-slate-200 mx-1" />
        
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 
            pl-1 pr-2 py-1 rounded-lg 
            hover:bg-slate-100 transition-colors">
            <div className="w-8 h-8 rounded-lg 
              bg-gradient-to-br from-indigo-500 to-blue-600
              flex items-center justify-center 
              shadow-sm shadow-indigo-500/20">
              <span className="text-[11px] font-semibold 
                text-white">
                {getInitials(user?.name || "A")}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-60 bg-white border 
              border-slate-200 shadow-lg 
              shadow-slate-900/5 rounded-xl p-1.5">
            <DropdownMenuLabel className="px-2.5 py-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg 
                  bg-gradient-to-br from-indigo-500 to-blue-600
                  flex items-center justify-center">
                  <span className="text-[12px] 
                    font-semibold text-white">
                    {getInitials(user?.name || "A")}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold 
                    text-slate-900 truncate">
                    {user?.name}
                  </p>
                  <p className="text-[11.5px] text-slate-500 
                    truncate mt-0.5">
                    {user?.email}
                  </p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1.5 
              bg-slate-100" />
            <DropdownMenuItem 
              onClick={() => router.push("/admin/profile")}
              className="text-[13px] px-2 py-1.5 rounded-md 
                cursor-pointer">
              <User className="w-3.5 h-3.5 mr-2.5 
                text-slate-500" />
              Your profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => router.push("/admin/settings")}
              className="text-[13px] px-2 py-1.5 rounded-md 
                cursor-pointer">
              <SettingsIcon className="w-3.5 h-3.5 mr-2.5 
                text-slate-500" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1.5 
              bg-slate-100" />
            <DropdownMenuItem 
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-[13px] px-2 py-1.5 rounded-md 
                cursor-pointer text-red-600 
                focus:text-red-600 focus:bg-red-50">
              <LogOut className="w-3.5 h-3.5 mr-2.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
