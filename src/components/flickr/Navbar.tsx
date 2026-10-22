import { useState, useRef, useEffect } from "react"
import type { User } from "../../types"
import type { FlickrNavTab } from "../../types"
import { formatTotalSize } from "../../utils"
import Avatar from "../Avatar"

interface NavbarProps {
  user: User | null
  activeTab?: FlickrNavTab
  onSelectTab?: (tab: FlickrNavTab) => void
  onLogout: () => void
  onGoHome: () => void
  searchQuery: string
  onSearchChange: (q: string) => void
  showSearch?: boolean
  theme: "light" | "dark"
  onToggleTheme: () => void
  usedBytes: number
  limitBytes: number
  onOpenUpload?: () => void
  onOpenProfile: () => void
  onOpenSettings: () => void
  onOpenHelp?: () => void
  onOpenUpgrade: () => void
}

export default function Navbar({
  user,
  activeTab = "explore",
  onSelectTab,
  onLogout,
  onGoHome,
  searchQuery,
  onSearchChange,
  showSearch = true,
  theme,
  onToggleTheme,
  usedBytes,
  limitBytes,
  onOpenUpload,
  onOpenProfile,
  onOpenSettings,
  onOpenHelp,
  onOpenUpgrade,
}: NavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const usedPercent = Math.min(100, Math.round((usedBytes / limitBytes) * 100))

  // Phím tắt bàn phím '/' để nhảy vào ô search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Đóng profile popover khi click ngoài
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const navTabs: { id: FlickrNavTab; label: string }[] = [
    { id: "explore", label: "Explore" },
    { id: "photostream", label: "Photostream" },
    { id: "albums", label: "Albums" },
    { id: "trips", label: "Trips" },
  ]

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0b0b0c]/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 transition-colors">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* TRÁI: Logo Flickr Style + Tabs */}
        <div className="flex items-center gap-6 sm:gap-8">
          <button
            onClick={onGoHome}
            className="flex items-center gap-1.5 focus:outline-none group text-left cursor-pointer"
            title="TravelPhoto"
          >
            <span className="font-black text-lg sm:text-xl tracking-tight text-neutral-900 dark:text-white flex items-center gap-1">
              TravelPhoto
              <span className="inline-flex items-center gap-0.5 ml-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0063dc] group-hover:scale-110 transition-transform" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff0084] group-hover:scale-110 transition-transform" />
              </span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab?.(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                    isActive
                      ? "text-[#0063dc] dark:text-white font-semibold bg-neutral-100 dark:bg-neutral-800"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/60 dark:hover:bg-neutral-800/50"
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* GIỮA: Ô tìm kiếm Pill-shaped */}
        {showSearch && (
          <div className="flex-1 max-w-md mx-2 sm:mx-4">
            <div className="relative group">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500 pointer-events-none group-focus-within:text-[#0063dc] transition-colors"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm kiếm ảnh, địa điểm, chuyến đi…"
                className="w-full h-9 sm:h-10 pl-10 pr-9 bg-neutral-100 dark:bg-[#18181b] border border-transparent dark:border-neutral-800 rounded-full text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-[#0063dc] focus:bg-white dark:focus:bg-[#0b0b0c] focus:ring-2 focus:ring-[#0063dc]/20 transition-all"
              />
              {searchQuery ? (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-sm cursor-pointer"
                >
                  ✕
                </button>
              ) : (
                <span className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 pointer-events-none">
                  /
                </span>
              )}
            </div>
          </div>
        )}

        {/* PHẢI: Actions, Dark/Light, Upload, User */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Toggle Dark / Light Theme */}
          <button
            onClick={onToggleTheme}
            aria-label="Đổi giao diện sáng/tối"
            className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {theme === "dark" ? (
              <svg
                className="w-4 h-4 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="5" fill="currentColor" />
                <path
                  d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-neutral-700"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>

          {/* Nút Upload Flickr Pink Signature */}
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 text-sm font-semibold rounded-full bg-[#ff0084] hover:bg-[#e00074] text-white shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="hidden sm:inline">Upload</span>
            </button>
          )}

          {/* User Profile Popover */}
          {user ? (
            <div className="relative" ref={dropRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-[#0063dc]/40 transition-all focus:outline-none cursor-pointer"
              >
                <Avatar
                  src={user.avatar}
                  name={user.name}
                  className="w-8 h-8 rounded-full"
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl border border-neutral-100 dark:border-neutral-800 p-2 z-50 text-neutral-800 dark:text-neutral-200">
                  <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                    <p className="font-semibold text-sm truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {user.email}
                    </p>

                    {/* Hạn mức dung lượng lưu trữ */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] text-neutral-500 mb-1">
                        <span>Lưu trữ ({usedPercent}%)</span>
                        <span>
                          {formatTotalSize(usedBytes)} /{" "}
                          {formatTotalSize(limitBytes)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            usedPercent > 90 ? "bg-red-500" : "bg-[#0063dc]"
                          }`}
                          style={{ width: `${usedPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="py-1 text-sm">
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        onOpenProfile()
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Hồ sơ cá nhân</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        onOpenUpgrade()
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between text-[#0063dc] font-medium cursor-pointer"
                    >
                      <span>Nâng cấp dung lượng (VNPay)</span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#0063dc]/10 text-[#0063dc] rounded-full font-bold">
                        PRO
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        onOpenSettings()
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Cài đặt</span>
                    </button>
                    {onOpenHelp && (
                      <button
                        onClick={() => {
                          setProfileOpen(false)
                          onOpenHelp()
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                      >
                        <span>Trợ giúp & Hướng dẫn</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        onLogout()
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-sm flex items-center gap-2 cursor-pointer"
                    >
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 cursor-pointer"
            aria-label="Menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 px-4 py-3 bg-white dark:bg-[#0b0b0c] flex flex-col gap-1.5 text-sm font-medium">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onSelectTab?.(tab.id)
                setMobileMenuOpen(false)
              }}
              className={`text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-neutral-100 dark:bg-neutral-800 text-[#0063dc] font-semibold"
                  : "text-neutral-600 dark:text-neutral-400"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </header>
  )
}
