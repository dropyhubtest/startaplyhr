"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { DEPARTMENTS } from "@/lib/constants"
import { getInitials, formatDate, cn } from "@/lib/utils"
import { PageHeader } from "@/components/shared/page-header"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { TableSkeleton } from "@/components/shared/loading-skeleton"
import { Input } from "@/components/ui/input"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import { CreateEmployeeModal } from "@/components/admin/create-employee-modal"
import { EditEmployeeModal } from "@/components/admin/edit-employee-modal"
import { AnimatedNumber } from "@/components/ui-motion/animated-number"
import { HoverCard } from "@/components/ui-motion/hover-card"
import { toast } from "sonner"
import { 
  UserPlus, Search, Eye, Pencil, Power, Users, Filter, Trash2, X, UserCheck, Building2, UserCheck2
} from "lucide-react"

import { useQuery, useQueryClient } from "@tanstack/react-query"

export default function EmployeesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [showToggleConfirm, setShowToggleConfirm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Construct queryKey matching cascade prefetch default ["employees", { page: 1, limit: 10 }]
  const isDefaultQuery = currentPage === 1 && !search && !departmentFilter && !statusFilter
  const queryKey = isDefaultQuery
    ? ["employees", { page: 1, limit: 10 }]
    : ["employees", { page: currentPage, limit: 10, search, department: departmentFilter, status: statusFilter }]

  const { data: employeesQueryData, isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        department: departmentFilter,
        status: statusFilter,
        page: String(currentPage),
        limit: "10"
      })
      const res = await fetch(`/api/employees?${params}`)
      if (!res.ok) throw new Error("Failed to load employees")
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  const employees = employeesQueryData?.employees || []
  const pagination = employeesQueryData?.pagination

  const handleToggleStatus = async () => {
    if (!togglingId) return

    try {
      const res = await fetch(`/api/employees/${togglingId}/toggle-status`, {
        method: "PUT"
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Employee ${data.isActive ? 'activated' : 'deactivated'} successfully`)
        queryClient.invalidateQueries({ queryKey: ["employees"] })
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("Failed to toggle status")
    } finally {
      setShowToggleConfirm(false)
      setTogglingId(null)
    }
  }

  const handleDeleteEmployee = async () => {
    if (!deletingId) return
    
    try {
      const res = await fetch(`/api/employees/${deletingId}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("Employee and related data deleted successfully")
        queryClient.invalidateQueries({ queryKey: ["employees"] })
      } else {
        toast.error(data.error || "Failed to delete employee")
      }
    } catch (error) {
      toast.error("An unexpected error occurred while deleting")
    } finally {
      setShowDeleteConfirm(false)
      setDeletingId(null)
    }
  }

  const getDepartmentColor = (dept: string) => {
    const colors: Record<string, string> = {
      Engineering: "bg-blue-50 text-blue-700 border-blue-200",
      Design: "bg-purple-50 text-purple-700 border-purple-200",
      Marketing: "bg-orange-50 text-orange-700 border-orange-200",
      Sales: "bg-emerald-50 text-emerald-700 border-emerald-200",
      HR: "bg-rose-50 text-rose-700 border-rose-200",
      Operations: "bg-slate-50 text-slate-700 border-slate-200",
      Finance: "bg-indigo-50 text-indigo-700 border-indigo-200",
    }
    return colors[dept] || "bg-slate-50 text-slate-700 border-slate-200"
  }

  // Summary counts
  const totalCount = pagination?.total || employees.length
  const activeCount = employees.filter((e: any) => e.isActive).length

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in-fade">
      <PageHeader
        title="Employees"
        description="Manage your team members, departments, and roles."
        action={
          <button 
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-[13px] font-bold shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add Employee
          </button>
        }
      />

      {/* 4 Animated Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <HoverCard className="stagger-1 border-indigo-100">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Team</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            <AnimatedNumber value={totalCount} />
          </p>
        </HoverCard>

        <HoverCard className="stagger-2 border-emerald-100">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">
            <AnimatedNumber value={activeCount} />
          </p>
        </HoverCard>

        <HoverCard className="stagger-3 border-blue-100">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Departments</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-600 mt-2">
            <AnimatedNumber value={DEPARTMENTS.length} />
          </p>
        </HoverCard>

        <HoverCard className="stagger-4 border-purple-100">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Page</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <UserCheck2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600 mt-2">
            {pagination?.page || 1} / {pagination?.totalPages || 1}
          </p>
        </HoverCard>
      </div>

      {/* Filter Card with Debounced Clearable Search */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, ID or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9 pr-9 h-10 border-slate-200 focus-ring text-xs rounded-xl"
          />
          {search && (
            <button 
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Select value={departmentFilter} onValueChange={(v) => {
          setDepartmentFilter(v as string)
          setCurrentPage(1)
        }}>
          <SelectTrigger className="w-full sm:w-48 h-10 border-slate-200 text-xs rounded-xl">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent className="border-slate-200 rounded-xl shadow-lg">
            <SelectItem value="all">All Departments</SelectItem>
            {DEPARTMENTS.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(v) => {
          setStatusFilter(v as string)
          setCurrentPage(1)
        }}>
          <SelectTrigger className="w-full sm:w-36 h-10 border-slate-200 text-xs rounded-xl">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="border-slate-200 rounded-xl shadow-lg">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Directory Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Team Directory</h3>
            <p className="text-xs text-slate-500">View and manage employee profiles and status</p>
          </div>
          <span className="text-xs font-bold text-slate-400">{totalCount} Records</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6"><TableSkeleton cols={7} rows={5} /></div>
          ) : employees.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3">
                <Users className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">No employees found</h3>
              <p className="text-xs text-slate-500">Try adjusting your search query or filter parameters.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Employee</th>
                  <th className="px-6 py-3">Employee ID</th>
                  <th className="px-6 py-3">Department</th>
                  <th className="px-6 py-3">Job Title</th>
                  <th className="px-6 py-3">Joining Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp: any) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-xs hover-scale flex-shrink-0">
                          {getInitials(emp.name)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{emp.name}</p>
                          <p className="text-[11px] text-slate-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-600 font-medium">
                      {emp.employeeId}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={cn(
                        "text-[11px] px-2.5 py-1 rounded-md font-bold border",
                        getDepartmentColor(emp.department)
                      )}>
                        {emp.department}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-700">
                      {emp.jobTitle}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 font-medium">
                      {formatDate(emp.dateOfJoining)}
                    </td>
                    <td className="px-6 py-3.5">
                      {emp.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link 
                          href={`/admin/employees/${emp.id}`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => setEditingEmployee(emp)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Employee"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setTogglingId(emp.id)
                            setShowToggleConfirm(true)
                          }}
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer",
                            emp.isActive 
                              ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          )}
                          title={emp.isActive ? "Deactivate" : "Activate"}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setDeletingId(emp.id)
                            setShowDeleteConfirm(true)
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Employee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">
              Page <span className="text-slate-900 font-bold">{pagination.page}</span> of <span className="text-slate-900 font-bold">{pagination.totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button 
                disabled={!pagination.hasPrev}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none shadow-xs transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button 
                disabled={!pagination.hasNext}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none shadow-xs transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateEmployeeModal 
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["employees"] })}
        />
      )}

      {editingEmployee && (
        <EditEmployeeModal
          open={!!editingEmployee}
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["employees"] })}
        />
      )}

      <ConfirmDialog
        open={showToggleConfirm}
        onClose={() => {
          setShowToggleConfirm(false)
          setTogglingId(null)
        }}
        onConfirm={handleToggleStatus}
        title={employees.find((e: any) => e.id === togglingId)?.isActive ? "Deactivate Employee" : "Activate Employee"}
        description={`Are you sure you want to ${employees.find((e: any) => e.id === togglingId)?.isActive ? 'deactivate' : 'activate'} this employee account?`}
        confirmLabel={employees.find((e: any) => e.id === togglingId)?.isActive ? "Deactivate" : "Activate"}
        variant={employees.find((e: any) => e.id === togglingId)?.isActive ? "destructive" : "default"}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setDeletingId(null)
        }}
        onConfirm={handleDeleteEmployee}
        title="Delete Employee Permanently"
        description="Are you sure you want to permanently delete this employee? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  )
}
