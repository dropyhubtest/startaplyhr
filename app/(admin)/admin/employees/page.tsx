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
import { toast } from "sonner"
import { 
  UserPlus, Search, Eye, Pencil, Power, Users, Filter, Trash2
} from "lucide-react"

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([])
  const [pagination, setPagination] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
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

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search,
        department: departmentFilter,
        status: statusFilter,
        page: String(currentPage),
        limit: "10"
      })
      const res = await fetch(`/api/employees?${params}`)
      const data = await res.json()
      if (res.ok) {
        setEmployees(data.employees)
        setPagination(data.pagination)
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error("Failed to load employees")
    } finally {
      setLoading(false)
    }
  }, [search, departmentFilter, statusFilter, currentPage])

  // Debounced fetch for search
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchEmployees()
    }, 300)
    return () => clearTimeout(delay)
  }, [fetchEmployees])

  const handleToggleStatus = async () => {
    if (!togglingId) return
    const emp = employees.find(e => e.id === togglingId)
    if (!emp) return

    try {
      const res = await fetch(`/api/employees/${togglingId}/toggle-status`, {
        method: "PUT"
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Employee ${data.isActive ? 'activated' : 'deactivated'} successfully`)
        fetchEmployees()
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
        fetchEmployees()
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Employees"
        description="Manage your team members, departments, and roles."
        action={
          <button 
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-[13px] font-medium shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            Add Employee
          </button>
        }
      />

      {/* Filter Card */}
      <div className="bg-white border border-slate-200/70 rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, ID or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9 h-10 border-slate-200 hover:border-slate-300 focus:border-indigo-500 text-[13px]"
          />
        </div>

        <Select value={departmentFilter} onValueChange={(v) => {
          setDepartmentFilter(v as string)
          setCurrentPage(1)
        }}>
          <SelectTrigger className="w-full sm:w-44 h-10 border-slate-200 hover:border-slate-300 focus:border-indigo-500 text-[13px]">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent className="border-slate-200 rounded-lg shadow-lg">
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
          <SelectTrigger className="w-full sm:w-36 h-10 border-slate-200 hover:border-slate-300 focus:border-indigo-500 text-[13px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="border-slate-200 rounded-lg shadow-lg">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200/70 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-blue-50/30">
          <h3 className="text-[15px] font-semibold text-slate-900">Team Directory</h3>
          <p className="text-[12px] text-slate-500 mt-0.5">View and manage all employee records</p>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4"><TableSkeleton cols={7} rows={5} /></div>
          ) : employees.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-[15px] font-medium text-slate-900 mb-1">No employees found</h3>
              <p className="text-[13px] text-slate-500">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="uppercase tracking-wider text-[11px] px-6 py-3">Employee</th>
                  <th className="uppercase tracking-wider text-[11px] px-6 py-3">Employee ID</th>
                  <th className="uppercase tracking-wider text-[11px] px-6 py-3">Department</th>
                  <th className="uppercase tracking-wider text-[11px] px-6 py-3">Job Title</th>
                  <th className="uppercase tracking-wider text-[11px] px-6 py-3">Joining Date</th>
                  <th className="uppercase tracking-wider text-[11px] px-6 py-3">Status</th>
                  <th className="uppercase tracking-wider text-[11px] px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[12px] font-bold text-indigo-700">
                            {getInitials(emp.name)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-[13.5px] leading-snug">{emp.name}</p>
                          <p className="text-[11.5px] text-slate-500 leading-snug mt-0.5">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[12px] font-medium font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {emp.employeeId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[11px] px-2.5 py-1 rounded-md font-bold shadow-sm border",
                        getDepartmentColor(emp.department)
                      )}>
                        {emp.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-slate-700">{emp.jobTitle}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] text-slate-500 font-medium">{formatDate(emp.dateOfJoining)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {emp.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link 
                          href={`/admin/employees/${emp.id}`}
                          className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => setEditingEmployee(emp)}
                          className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
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
                            "w-8 h-8 rounded-md flex items-center justify-center transition-colors",
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
                          className="w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
            <p className="text-[12px] font-medium text-slate-500">
              Showing page <span className="text-slate-900">{pagination.page}</span> of <span className="text-slate-900">{pagination.totalPages}</span>
            </p>
            <div className="flex gap-2">
              <button 
                disabled={!pagination.hasPrev}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none shadow-sm transition-colors"
              >
                Previous
              </button>
              <button 
                disabled={!pagination.hasNext}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none shadow-sm transition-colors"
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
          onSuccess={fetchEmployees}
        />
      )}

      {editingEmployee && (
        <EditEmployeeModal
          open={!!editingEmployee}
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSuccess={fetchEmployees}
        />
      )}

      <ConfirmDialog
        open={showToggleConfirm}
        onClose={() => {
          setShowToggleConfirm(false)
          setTogglingId(null)
        }}
        onConfirm={handleToggleStatus}
        title={employees.find(e => e.id === togglingId)?.isActive ? "Deactivate Employee" : "Activate Employee"}
        description={`Are you sure you want to ${employees.find(e => e.id === togglingId)?.isActive ? 'deactivate' : 'activate'} this employee account? ${employees.find(e => e.id === togglingId)?.isActive ? 'They will no longer be able to log in.' : 'They will regain access to the portal.'}`}
        confirmLabel={employees.find(e => e.id === togglingId)?.isActive ? "Deactivate" : "Activate"}
        variant={employees.find(e => e.id === togglingId)?.isActive ? "destructive" : "default"}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false)
          setDeletingId(null)
        }}
        onConfirm={handleDeleteEmployee}
        title="Delete Employee Permanently"
        description="Are you sure you want to permanently delete this employee? This action cannot be undone and will delete all associated data (tasks, attendance, leaves)."
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  )
}
