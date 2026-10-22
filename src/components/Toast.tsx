import React from "react"

import type { ToastItem } from "../types"

interface Props {
  toasts: ToastItem[]

  onRemove: (id: string) => void
}

const styles: Record<ToastItem["type"], string> = {
  success:
    "bg-white dark:bg-gray-900 border-green-500 text-gray-900 dark:text-white",

  error:
    "bg-white dark:bg-gray-900 border-red-500 text-gray-900 dark:text-white",

  warning:
    "bg-white dark:bg-gray-900 border-yellow-500 text-gray-900 dark:text-white",

  info: "bg-white dark:bg-gray-900 border-blue-500 text-gray-900 dark:text-white",
}

const icons: Record<ToastItem["type"], React.ReactElement> = {
  success: (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40 text-green-600 text-xs font-bold flex-shrink-0">
      ✓
    </span>
  ),

  error: (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold flex-shrink-0">
      ✕
    </span>
  ),

  warning: (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-950/40 text-yellow-600 text-xs font-bold flex-shrink-0">
      !
    </span>
  ),

  info: (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex-shrink-0">
      i
    </span>
  ),
}

export default function Toast({ toasts, onRemove }: Props) {
  if (!toasts.length) return null

  return (
    <div
      className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2"
      style={{ maxWidth: 360 }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast-in flex items-start gap-3 px-4 py-3 rounded-2xl border-l-4 shadow-xl ${styles[t.type]}`}
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }}
        >
          {icons[t.type]}
          <p className="text-sm font-medium flex-1 leading-5 pt-0.5">
            {t.message}
          </p>
          <button
            onClick={() => onRemove(t.id)}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0 pt-0.5 leading-none text-base"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
