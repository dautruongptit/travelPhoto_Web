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
  usedBytes: number
  limitBytes: number
  onOpenProfile: () => void
  onOpenSettings: () => void
  onOpenHelp?: () => void
  onOpenUpgrade: () => void
}

export default function Navbar({
  user,
  activeTab = "albums",
  onSelectTab,
  onLogout,
  onGoHome,
  searchQuery,
  onSearchChange,
  showSearch = true,
  usedBytes,
  limitBytes,
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
    { id: "photos", label: "Photo" },
    { id: "albums", label: "Albums" },
  ]

  return (
    <header data-glass="navbar" className="sticky top-0 z-40 w-full transition-colors">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* TRÁI: Logo Flickr Style + Tabs */}
        <div className="flex items-center gap-6 sm:gap-8">
          <button
            onClick={onGoHome}
            className="flex items-center gap-1.5 focus:outline-none group text-left cursor-pointer"
            title="TravelPhoto"
          >
            <span className="font-black text-lg sm:text-xl tracking-tight text-white flex items-center gap-1">
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
                  data-glass="tab"
                  data-active={isActive}
                  onClick={() => onSelectTab?.(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                    isActive
                      ? "text-white font-semibold bg-white/15 border border-white/20"
                      : "text-white/70 hover:text-white hover:bg-white/10"
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
          <div className="flex-1 min-w-0 max-w-md mx-2 sm:mx-4">
            <div className="relative group">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm kiếm ảnh, địa điểm, chuyến đi…"
                className="blur-background w-full h-9 sm:h-10 pl-4 pr-16 text-sm text-white placeholder-white/70 focus:outline focus:outline-1 focus:outline-white/30 transition-all"
              />
              {searchQuery ? (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-10 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-sm cursor-pointer"
                >
                  ✕
                </button>
              ) : (
                <span className="hidden sm:inline-block absolute right-10 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-xs text-white/60 bg-white/10 rounded border border-white/15 pointer-events-none">
                  /
                </span>
              )}
              <svg
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>
        )}

        {/* PHẢI: Actions, User */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
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
                <div data-glass="dropdown" className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl border border-neutral-100 dark:border-neutral-800 p-2 z-50 text-neutral-800 dark:text-neutral-200">
                  <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                    <p className="font-semibold text-[13px] truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {user.email}
                    </p>

                    {/* Hạn mức dung lượng lưu trữ */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-neutral-500 mb-1">
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

                  <div className="py-1 text-xs">
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        onOpenProfile()
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Hồ sơ cá nhân</span>
                    </button>
                    <button
                      onClick={() => {
                        setProfileOpen(false)
                        onOpenUpgrade()
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between text-[#0063dc] font-medium cursor-pointer"
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
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                    >
                      <span>Cài đặt</span>
                    </button>
                    {onOpenHelp && (
                      <button
                        onClick={() => {
                          setProfileOpen(false)
                          onOpenHelp()
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
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
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 cursor-pointer"
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
            className="md:hidden btn btn-ghost btn-icon cursor-pointer"
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
        <div className="md:hidden border-t border-white/10 px-4 py-3 bg-[rgba(10,15,42,0.88)] backdrop-blur-[20px] flex flex-col gap-1.5 text-sm font-medium">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                onSelectTab?.(tab.id)
                setMobileMenuOpen(false)
              }}
              className={`text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white/15 text-white font-semibold"
                  : "text-white/70 hover:text-white hover:bg-white/10"
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
