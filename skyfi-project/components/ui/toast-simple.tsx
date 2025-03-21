"use client"

import { useEffect } from "react"
import { CheckCircle, XCircle } from "lucide-react"

interface ToastSimpleProps {
  message: string
  duration?: number
  visible: boolean
  onClose: () => void
  type?: "success" | "error"
}

export function ToastSimple({ message, duration = 3000, visible, onClose, type = "success" }: ToastSimpleProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [visible, duration, onClose])

  if (!visible) return null

  return (
    <div
      className={`fixed bottom-4 right-4 bg-background border rounded-md shadow-md px-4 py-3 z-50 animate-in fade-in slide-in-from-bottom-5 flex items-center gap-2 ${
        type === "error" ? "border-red-500" : "border-green-500"
      }`}
    >
      {type === "success" ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500" />
      )}
      <span>{message}</span>
    </div>
  )
}

