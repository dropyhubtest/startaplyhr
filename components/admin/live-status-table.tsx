'use client'

import { LiveEmployeeStatus } from '@/types'

interface LiveStatusTableProps {
  employees?: LiveEmployeeStatus[]
}

export function LiveStatusTable({ employees = [] }: LiveStatusTableProps) {
  return (
    <div className="rounded-xl border bg-white">
      <div className="border-b p-4">
        <h3 className="font-semibold">Live Employee Status</h3>
      </div>
      <div className="p-4">
        {employees.length === 0 ? (
          <p className="text-center text-gray-500">No data available</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500">
                <th className="pb-2">Employee</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Hours</th>
              </tr>
            </thead>
            <tbody>
              {/* Table rows will be populated */}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
