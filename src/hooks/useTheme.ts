import { useEffect, useState } from "react"

export type Theme = "light" | "dark"

const STORAGE_KEY = "phototrip-theme"

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light"

  const stored = window.localStorage.getItem(STORAGE_KEY)

  if (stored === "light" || stored === "dark") return stored

  // Chưa có lựa chọn trước đó -> theo cấu hình hệ điều hành/trình duyệt

  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")
    .matches

  return prefersDark ? "dark" : "light"
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement

    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }

    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))

  return { theme, toggleTheme, setTheme }
}
