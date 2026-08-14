"use client"

import React from "react"
import { Toaster as SonnerToaster } from "sonner"

export function ToastProvider() {
  return (
    <SonnerToaster
      position="top-right"
      toastOptions={{
        className: "border border-slate-200/80 bg-white text-slate-900 shadow-xl rounded-xl font-sans text-xs",
        duration: 4000,
        style: {
          padding: "12px 16px",
        },
      }}
    />
  )
}
