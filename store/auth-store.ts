import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AuthState {
  user: {
    id: string
    name: string
    email: string
    role: string
    employeeId: string
    department: string
    jobTitle: string
    profilePhoto?: string
  } | null
  isLoading: boolean
  setUser: (user: AuthState["user"]) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: "startaply-auth",
    }
  )
)
