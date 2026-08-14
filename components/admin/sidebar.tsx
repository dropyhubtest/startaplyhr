"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useAuth } from "@/hooks/use-auth"
import { useQueryClient } from "@tanstack/react-query"
import { cn, getInitials } from "@/lib/utils"
import {
  LayoutDashboard, Users, Clock, Calendar,
  CheckSquare, BarChart3, Megaphone, Bell,
  Settings, LogOut, ChevronsUpDown, Sparkles, Search,
  Briefcase,
} from "lucide-react"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const mainNav = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Employees", href: "/admin/employees", icon: Users },
  { label: "Attendance", href: "/admin/attendance", icon: Clock },
  { label: "Leaves", href: "/admin/leaves", icon: Calendar },
  { label: "Tasks", href: "/admin/tasks", icon: CheckSquare },
]

const recruitmentNav = [
  { label: "Jobs", href: "/admin/recruitment/jobs", icon: Briefcase },
]

const insightsNav = [
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Announcements", href: "/admin/announcements", icon: Megaphone },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
]

const bottomNav = [
  { label: "Settings", href: "/admin/settings", icon: Settings },
]

export default function AdminSidebar({ 
  isOpen, onClose 
}: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const handleMouseEnter = (href: string) => {
    if (href === "/admin/employees") {
      queryClient.prefetchQuery({
        queryKey: ["employees", undefined],
        queryFn: () => fetch("/api/employees").then((r) => r.json()),
        staleTime: 30 * 1000,
      })
    } else if (href === "/admin/dashboard") {
      queryClient.prefetchQuery({
        queryKey: ["dashboard-stats"],
        queryFn: () => fetch("/api/admin/dashboard/stats").then((r) => r.json()),
        staleTime: 15 * 1000,
      })
    } else if (href === "/admin/leaves") {
      queryClient.prefetchQuery({
        queryKey: ["leaves", "pending"],
        queryFn: () => fetch("/api/leaves?status=PENDING&limit=50").then((r) => r.json()),
        staleTime: 15 * 1000,
      })
    } else if (href === "/admin/tasks") {
      queryClient.prefetchQuery({
        queryKey: ["tasks", undefined],
        queryFn: () => fetch("/api/tasks?limit=100").then((r) => r.json()),
        staleTime: 30 * 1000,
      })
    } else if (href === "/admin/attendance") {
      const today = new Date().toISOString().split("T")[0]
      queryClient.prefetchQuery({
        queryKey: ["attendance", "today", today],
        queryFn: () => fetch(`/api/attendance/admin/today?date=${today}`).then((r) => r.json()),
        staleTime: 15 * 1000,
      })
    }
  }

  const handleNavClick = (href: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("nav-start", String(performance.now()))
      sessionStorage.setItem("nav-target", href)
    }
    onClose()
  }

  const NavItem = ({ item }: { item: typeof mainNav[0] }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
    return (
      <Link
        href={item.href}
        prefetch={true}
        onMouseEnter={() => handleMouseEnter(item.href)}
        onClick={() => handleNavClick(item.href)}
        className={cn(
          "relative flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 group cursor-pointer",
          isActive
            ? "text-indigo-700 font-bold"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/80"
        )}
      >
        {isActive && (
          <>
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-indigo-500 to-blue-600" />
            <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-50/80 to-blue-50/40 -z-0" />
          </>
        )}
        <item.icon className={cn(
          "relative z-10 w-[18px] h-[18px] flex-shrink-0 transition-transform group-hover:scale-110",
          isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
        )} strokeWidth={isActive ? 2.5 : 2} />
        <span className="relative z-10">{item.label}</span>
      </Link>
    )
  }

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2 mt-5">
      {children}
    </p>
  )

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 z-20 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside suppressHydrationWarning className={cn(
        "fixed top-0 left-0 h-full w-[260px]",
        "bg-white border-r border-slate-200/80 z-30",
        "flex flex-col shadow-xs",
        "transition-transform duration-200 ease-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        
        {/* LOGO SECTION without icon */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Link href="/admin/dashboard" className="flex flex-col group cursor-pointer">
            <p className="text-[17px] font-extrabold text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
              Startaply
            </p>
            <p className="text-[10px] text-slate-400 mt-1 leading-none font-bold tracking-widest uppercase">
              HR Portal
            </p>
          </Link>
        </div>

        {/* NAV WITH SECTIONS */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-2">
          
          {/* Quick Search Bar trigger */}
          <div className="px-1 mb-3">
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all group cursor-pointer">
              <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-600">
                <Search className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Quick search...</span>
              </div>
            </button>
          </div>

          <div>
            <SectionLabel>Main</SectionLabel>
            <div className="space-y-1">
              {mainNav.map(item => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Recruitment</SectionLabel>
            <div className="space-y-1">
              {recruitmentNav.map(item => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Insights</SectionLabel>
            <div className="space-y-1">
              {insightsNav.map(item => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Workspace</SectionLabel>
            <div className="space-y-1">
              {bottomNav.map(item => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          </div>
        </nav>

        {/* USER PROFILE SECTION */}
        <div className="border-t border-slate-100 p-3 space-y-2 bg-slate-50/40">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white transition-all cursor-pointer group border border-transparent hover:border-slate-200 hover:shadow-xs">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/20">
                {getInitials(user?.name || "A")}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-slate-900 truncate leading-tight">
                {user?.name || "Admin"}
              </p>
              <p className="text-[11px] font-medium text-slate-500 truncate leading-tight mt-0.5">
                Administrator
              </p>
            </div>
            <ChevronsUpDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0" />
          </div>
          
          <button
            suppressHydrationWarning
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors group cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500" strokeWidth={2} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
