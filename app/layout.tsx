import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from "react-hot-toast"
import { Toaster as SonnerToaster } from "sonner"

export const metadata: Metadata = {
  title: "Startaply HR — Employee Management Portal",
  description:
    "A modern HR management portal for Startaply — manage employees, attendance, leaves, tasks, and more.",
  keywords: ["HR", "management", "attendance", "employees", "Startaply"],
  icons: {
    icon: "/favicon.ico",
  },
}

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  return (
    <html lang="en" suppressHydrationWarning className="font-sans">
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <Providers session={session}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                borderRadius: '0.75rem',
                padding: '12px 16px',
              },
              success: {
                iconTheme: { primary: '#22C55E', secondary: '#fff' }
              },
              error: {
                iconTheme: { primary: '#EF4444', secondary: '#fff' }
              }
            }}
          />
          <SonnerToaster position="top-right" expand={true} />
        </Providers>
      </body>
    </html>
  )
}
