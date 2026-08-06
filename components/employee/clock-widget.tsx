'use client'

import { useState } from 'react'

export function ClockWidget() {
  const [status, setStatus] = useState<'NOT_STARTED' | 'WORKING' | 'ON_BREAK' | 'COMPLETED'>('NOT_STARTED')

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold">Time Tracker</h3>
      <div className="mt-4 text-center">
        <p className="text-3xl font-bold">00:00:00</p>
        <p className="mt-2 text-sm text-gray-500">Status: {status}</p>
      </div>
      <div className="mt-4 flex gap-2">
        {/* Clock in/out buttons will be added */}
      </div>
    </div>
  )
}
