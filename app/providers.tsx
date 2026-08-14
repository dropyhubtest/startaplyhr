"use client"

import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { Toaster } from "react-hot-toast"
import { useState, useEffect } from "react"
import { NotificationPopupListener } from "@/components/shared/notification-popup-listener"

export function Providers({ children, session }: { children: React.ReactNode; session?: any }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const origError = console.error
      console.error = (...args: any[]) => {
        if (
          typeof args[0] === "string" &&
          (args[0].includes("fdprocessedid") || args[0].includes("Extra attributes from the server"))
        ) {
          return
        }
        origError.apply(console, args)
      }
    }
  }, [])

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  )

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <NotificationPopupListener />
        {children}
        <Toaster position="top-right" />
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </SessionProvider>
  )
}
