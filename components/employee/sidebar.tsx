"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useAuth } from "@/hooks/use-auth"
import { useQueryClient } from "@tanstack/react-query"
import { cn, getInitials } from "@/lib/utils"
import {
  LayoutDashboard, Clock, Calendar,
  CheckSquare, Megaphone, Bell,
  User, LogOut, ChevronsUpDown, Sparkles, Briefcase,
} from "lucide-react"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const mainNav = [
  { label: "Dashboard", href: "/employee/dashboard", icon: LayoutDashboard },
  { label: "Attendance", href: "/employee/attendance", icon: Clock },
  { label: "Leaves", href: "/employee/leaves", icon: Calendar },
  { label: "Tasks", href: "/employee/tasks", icon: CheckSquare },
]

const recruitmentNav = [
  { label: "My Jobs", href: "/employee/recruitment/jobs", icon: Briefcase },
]

const communicationNav = [
  { label: "Announcements", href: "/employee/announcements", icon: Megaphone },
  { label: "Notifications", href: "/employee/notifications", icon: Bell },
]

const accountNav = [
  { label: "Profile", href: "/employee/profile", icon: User },
]

export default function EmployeeSidebar({ 
  isOpen, onClose 
}: SidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const handleMouseEnter = (href: string) => {
    if (href === "/employee/tasks") {
      queryClient.prefetchQuery({
        queryKey: ["tasks", undefined],
        queryFn: () => fetch("/api/tasks?limit=100").then((r) => r.json()),
        staleTime: 30 * 1000,
      })
    } else if (href === "/employee/leaves") {
      queryClient.prefetchQuery({
        queryKey: ["leaves", "balance"],
        queryFn: () => fetch("/api/leaves/balance").then((r) => r.json()),
        staleTime: 60 * 1000,
      })
    } else if (href === "/employee/notifications") {
      queryClient.prefetchQuery({
        queryKey: ["notifications"],
        queryFn: () => fetch("/api/notifications").then((r) => r.json()),
        staleTime: 15 * 1000,
      })
    }
  }

  const NavItem = ({ item }: { item: typeof mainNav[0] }) => {
    const isActive = pathname === item.href || 
      pathname.startsWith(item.href + "/")
    return (
      <Link
        href={item.href}
        prefetch={true}
        onMouseEnter={() => handleMouseEnter(item.href)}
        onClick={onClose}
        className={cn(
          "relative flex items-center gap-2.5 px-3 py-2 " +
          "rounded-lg text-[13px] font-medium " +
          "transition-all duration-150 group",
          isActive
            ? "bg-gradient-to-r from-indigo-50 to-blue-50/50 " +
              "text-indigo-700 shadow-sm"
            : "text-slate-600 hover:bg-slate-50 " +
              "hover:text-slate-900"
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 
            -translate-y-1/2 w-0.5 h-5 rounded-r-full 
            bg-gradient-to-b from-indigo-500 to-blue-600" />
        )}
        <item.icon className={cn(
          "w-[16px] h-[16px] flex-shrink-0 transition-colors",
          isActive ? "text-indigo-600" : 
            "text-slate-400 group-hover:text-slate-600"
        )} strokeWidth={2} />
        <span>{item.label}</span>
      </Link>
    )
  }

  const SectionLabel = ({ children }: { 
    children: React.ReactNode 
  }) => (
    <p className="text-[10.5px] font-semibold text-slate-400 
      uppercase tracking-wider px-3 mb-2 mt-5">
      {children}
    </p>
  )

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 z-20 
            lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full w-[248px]",
        "bg-gradient-to-b from-white via-white to-slate-50/50",
        "border-r border-slate-200/70 z-30",
        "flex flex-col",
        "transition-transform duration-200 ease-out",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Link href="/employee/dashboard" className="flex flex-col group cursor-pointer">
            <p className="text-[17px] font-extrabold text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
              Startaply
            </p>
            <p className="text-[10px] text-slate-400 mt-1 leading-none font-bold tracking-widest uppercase">
              Employee Portal
            </p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5">
          <div className="space-y-0.5">
            {mainNav.map(item => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>

          <SectionLabel>Recruitment</SectionLabel>
          <div className="space-y-0.5">
            {recruitmentNav.map(item => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>

          <SectionLabel>Communication</SectionLabel>
          <div className="space-y-0.5">
            {communicationNav.map(item => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>

          <SectionLabel>Account</SectionLabel>
          <div className="space-y-0.5">
            {accountNav.map(item => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>
        </nav>

        {/* User section */}
        <div className="border-t border-slate-100 p-2.5 
          bg-gradient-to-b from-transparent to-slate-50/30">
          <div className="flex items-center gap-2.5 
            px-2 py-2 rounded-lg hover:bg-white 
            hover:shadow-sm transition-all cursor-pointer 
            group border border-transparent 
            hover:border-slate-200">
            <div className="w-8 h-8 rounded-lg 
              bg-gradient-to-br from-indigo-500 to-blue-600
              flex items-center justify-center flex-shrink-0 
              shadow-sm shadow-indigo-500/20">
              <span className="text-[11px] font-semibold 
                text-white">
                {getInitials(user?.name || "E")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-semibold 
                text-slate-900 truncate leading-tight">
                {user?.name || "Employee"}
              </p>
              <p className="text-[10.5px] text-slate-500 
                truncate leading-tight mt-0.5">
                Team Member
              </p>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 
              text-slate-400 flex-shrink-0" />
          </div>
          
          <button
            suppressHydrationWarning
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-1 w-full flex items-center gap-2.5 
              px-3 py-2 rounded-lg text-[13px] 
              text-slate-600 hover:bg-red-50 
              hover:text-red-600 transition-colors group"
          >
            <LogOut className="w-4 h-4 text-slate-400 
              group-hover:text-red-500" strokeWidth={2} />
            <span className="font-medium">Sign out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
