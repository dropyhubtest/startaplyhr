import { create } from "zustand"

type WorkStatus = "NOT_STARTED" | "WORKING" | "ON_BREAK" | "COMPLETED"

interface AttendanceState {
  currentStatus: WorkStatus
  loginTime: Date | null
  breakStartTime: Date | null
  currentAttendanceLogId: string | null
  currentBreakLogId: string | null
  todayWorkSeconds: number
  todayBreakSeconds: number
  isLoading: boolean
  setStatus: (status: WorkStatus) => void
  setLoginTime: (time: Date) => void
  setBreakStart: (time: Date) => void
  setAttendanceLogId: (id: string) => void
  setBreakLogId: (id: string) => void
  incrementWorkSeconds: () => void
  incrementBreakSeconds: () => void
  resetDay: () => void
  loadFromServer: (data: Partial<AttendanceState>) => void
}

export const useAttendanceStore = create<AttendanceState>()(
  (set) => ({
    currentStatus: "NOT_STARTED",
    loginTime: null,
    breakStartTime: null,
    currentAttendanceLogId: null,
    currentBreakLogId: null,
    todayWorkSeconds: 0,
    todayBreakSeconds: 0,
    isLoading: false,

    setStatus: (status) => set({ currentStatus: status }),
    setLoginTime: (time) => set({ loginTime: time }),
    setBreakStart: (time) => set({ breakStartTime: time }),
    setAttendanceLogId: (id) => set({ currentAttendanceLogId: id }),
    setBreakLogId: (id) => set({ currentBreakLogId: id }),
    
    incrementWorkSeconds: () => set((s) => ({ todayWorkSeconds: s.todayWorkSeconds + 1 })),
    incrementBreakSeconds: () => set((s) => ({ todayBreakSeconds: s.todayBreakSeconds + 1 })),
    
    resetDay: () => set({
      currentStatus: "NOT_STARTED",
      loginTime: null,
      breakStartTime: null,
      currentAttendanceLogId: null,
      currentBreakLogId: null,
      todayWorkSeconds: 0,
      todayBreakSeconds: 0,
    }),
    
    loadFromServer: (data) => set(data),
  })
)
