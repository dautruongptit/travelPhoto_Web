import { useState, useMemo, useRef } from "react"
import type { TravelEvent, User, Photo, SortOption } from "../types"
import { formatFileSize, formatDateRange, formatDate } from "../utils"
import Lightbox from "./Lightbox"
import ShareModal from "./ShareModal"
import AuthImg from "./AuthImg"
import JustifiedGallery from "./flickr/JustifiedGallery"
import PhotoMasonry from "./PhotoMasonry"
import ShareTab from "./ShareTab"
import { infoOf } from "../visibility"

interface Props {
  event: TravelEvent
  user: User | null
  searchQuery: string
  onBack: () => void
  onUpload: () => void
  onDeletePhotos: (ids: string[]) => void
  onToast: (type: "success" | "error" | "warning" | "info", msg: string) => void
  /** Gọi khi quyền xem của album có thể đã đổi (tạo link chia sẻ, bật/tắt công khai) */
  onVisibilityChanged?: (eventId: string) => void
}

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Mới nhất",
  oldest: "Cũ nhất",
  "name-az": "Tên A–Z",
  "name-za": "Tên Z–A",
}

type AlbumTab = "photos" | "info"
type ViewMode = "masonry" | "justified" | "grid" | "large"
const VIEW_MODE_KEY = "travelphoto-album-view"

const VIEW_BUTTONS: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
  {
    mode: "masonry",
    label: "Xếp gạch (giữ tỉ lệ ảnh)",
    icon: (
      <>
        <rect x="3" y="3" width="8" height="10" />
        <rect x="13" y="3" width="8" height="6" />
        <rect x="3" y="15" width="8" height="6" />
        <rect x="13" y="11" width="8" height="10" />
      </>
    ),
  },
  {
    mode: "grid",
    label: "Lưới ô vuông",
    icon: (
      <>
        <rect x="3" y="3" width="4.5" height="4.5" />
        <rect x="9.75" y="3" width="4.5" height="4.5" />
        <rect x="16.5" y="3" width="4.5" height="4.5" />
        <rect x="3" y="9.75" width="4.5" height="4.5" />
        <rect x="9.75" y="9.75" width="4.5" height="4.5" />
        <rect x="16.5" y="9.75" width="4.5" height="4.5" />
        <rect x="3" y="16.5" width="4.5" height="4.5" />
        <rect x="9.75" y="16.5" width="4.5" height="4.5" />
        <rect x="16.5" y="16.5" width="4.5" height="4.5" />
      </>
    ),
  },
  {
    mode: "justified",
    label: "Hàng cân bằng",
    icon: (
      <>
        <rect x="3" y="3" width="11" height="8" />
        <rect x="15.5" y="3" width="5.5" height="8" />
        <rect x="3" y="13" width="6" height="8" />
        <rect x="10.5" y="13" width="10.5" height="8" />
      </>
    ),
  },
  {
    mode: "large",
    label: "Ảnh lớn",
    icon: <rect x="4" y="4" width="16" height="16" rx="1" />,
  },
]

export default function AlbumPage({
  event,
  user,
  searchQuery,
  onBack,
  onUpload,
  onDeletePhotos,
  onToast,
  onVisibilityChanged,
}: Props) {
  const [activeTab, setActiveTab] = useState<AlbumTab>("photos")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<SortOption>("newest")
  const [filterQuery, setFilterQuery] = useState("")
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareRefreshKey, setShareRefreshKey] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [slideshow, setSlideshow] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_KEY)
      return saved === "grid" || saved === "large" || saved === "justified"
        ? saved
        : "masonry"
    } catch {
      return "masonry"
    }
  })
  const changeViewMode = (m: ViewMode) => {
    setViewMode(m)
    try {
      localStorage.setItem(VIEW_MODE_KEY, m)
    } catch {
      // bỏ qua nếu trình duyệt chặn localStorage
    }
  }
  const sortRef = useRef<HTMLDivElement>(null)

  const q = filterQuery || searchQuery

  const photos = useMemo(() => {
    let list = [...event.photos]
    if (q)
      list = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    list.sort((a, b) => {
      switch (sort) {
        case "newest":
          return (
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
          )
        case "oldest":
          return (
            new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
          )
        case "name-az":
          return a.name.localeCompare(b.name)
        case "name-za":
          return b.name.localeCompare(a.name)
        default:
          return 0
      }
    })
    return list
  }, [event.photos, q, sort])

  const totalSize = event.photos.reduce((s, p) => s + p.size, 0)
  const vis = infoOf(event.visibility)
  const isOwner = !!user && String(event.ownerId) === String(user.id)
  const role = event.userRole ?? (isOwner ? "owner" : null)
  const canUpload = role === "owner" || role === "editor"
  const canDelete = (photo: Photo) =>
    role === "owner" || (role === "editor" && !!user && photo.uploadedBy === user.id)
  const canSelect = canUpload
  const photoTotal = event.photoCount ?? event.photos.length

  const TABS: { key: AlbumTab; label: string }[] = [
    { key: "photos", label: `Kho ảnh (${photoTotal})` },
    { key: "info", label: isOwner ? "Tổng quan & Quản trị" : "Thông tin album" },
  ]

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(photos.map((p) => p.id)))
  const clearSelect = () => setSelected(new Set())

  const handleDelete = () => {
    onDeletePhotos(Array.from(selected))
    clearSelect()
    setShowDeleteConfirm(false)
  }

  return (
    <main className="min-h-screen pb-16">
      {/* Flickr Sub-header & Album Cover banner */}
      <div data-glass="panel" className="bg-white dark:bg-[#0b0b0c] border-b border-neutral-200/80 dark:border-neutral-800/80 transition-colors">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mb-3">
            <button
              onClick={onBack}
              className="hover:text-[#0063dc] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Trang chủ
            </button>
            <span>/</span>
            <span className="text-neutral-900 dark:text-white font-medium truncate max-w-xs sm:max-w-md">
              {event.name}
            </span>
          </div>

          {/* Event info */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="hidden sm:block w-20 h-20 rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 border border-neutral-200 dark:border-neutral-800">
                <AuthImg
                  src={event.coverImage}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                    {event.name}
                  </h1>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${vis.color}`}>
                    {vis.icon} {vis.label}
                  </span>
                </div>
                {event.description && (
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 line-clamp-2 max-w-2xl">
                    {event.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                      {event.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatDateRange(event.startDate, event.endDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    {event.photos.length} ảnh · {formatFileSize(totalSize)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {user && String(event.ownerId) === String(user.id) && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-1.5 h-9 px-3.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-200 hover:border-blue-300 hover:text-blue-600 transition-all cursor-pointer"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                  </svg>
                  <span className="hidden sm:inline">Chia sẻ</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-5 border-b border-white/10 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors mr-1 cursor-pointer ${
                  activeTab === tab.key
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-white/60 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-5">
        {activeTab === "photos" && (
          <>
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          {/* Search inside album */}
          <div className="relative flex-1 min-w-44 max-w-xs">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="11"
                cy="11"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="m21 21-4.35-4.35"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Tìm tên ảnh…"
              className="w-full h-9 pl-9 pr-8 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-700 dark:text-neutral-200 placeholder-neutral-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort & Select actions */}
          <div className="flex items-center gap-2">
            {/* Chế độ xem: trình chiếu · lưới · hàng cân bằng · ảnh lớn */}
            <div className="flex items-center gap-0.5 text-neutral-500 dark:text-neutral-400 mr-1">
              {photos.length > 0 && (
                <button
                  onClick={() => {
                    setSlideshow(true)
                    setLightboxIndex(0)
                  }}
                  title="Trình chiếu"
                  aria-label="Trình chiếu"
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="13" rx="2" />
                    <path d="M10 8.5v4l3.5-2z" fill="currentColor" />
                    <path d="M8 21h8" />
                  </svg>
                </button>
              )}
              {VIEW_BUTTONS.map((b) => (
                <button
                  key={b.mode}
                  onClick={() => changeViewMode(b.mode)}
                  title={b.label}
                  aria-label={b.label}
                  aria-pressed={viewMode === b.mode}
                  className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
                    viewMode === b.mode
                      ? "text-[#0063dc]"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-800 dark:hover:text-white"
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    {b.icon}
                  </svg>
                </button>
              ))}
            </div>

            <div className="relative" ref={sortRef}>
              <button
                onClick={() => setShowSortMenu((v) => !v)}
                className="flex items-center gap-1.5 h-9 px-3.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-600 dark:text-neutral-300 hover:border-blue-300 transition-colors cursor-pointer"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 6h18M7 12h10M11 18h2" strokeLinecap="round" />
                </svg>
                {SORT_LABELS[sort]}
              </button>
              {showSortMenu && (
                <div data-glass="dropdown" className="slide-up absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#18181b] rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-800 py-1 z-20 text-xs">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSort(s)
                        setShowSortMenu(false)
                      }}
                      className={`w-full text-left px-3.5 py-2 transition-colors cursor-pointer ${
                        sort === s
                          ? "text-[#0063dc] font-semibold bg-neutral-50 dark:bg-neutral-800/80"
                          : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      }`}
                    >
                      {SORT_LABELS[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {photos.length > 0 && canSelect && (
              <button
                onClick={
                  selected.size === photos.length ? clearSelect : selectAll
                }
                className="h-9 px-3.5 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-600 dark:text-neutral-300 hover:border-blue-300 transition-colors cursor-pointer"
              >
                {selected.size === photos.length
                  ? "Bỏ chọn tất cả"
                  : "Chọn tất cả"}
              </button>
            )}
          </div>
        </div>

        {/* Flickr Justified Photo Gallery */}
        {photos.length === 0 && photoTotal === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 bg-neutral-50 dark:bg-neutral-800 rounded-3xl flex items-center justify-center mb-5">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="#D1D5DB" strokeWidth="1.5" />
                <circle cx="8.5" cy="8.5" r="1.5" fill="#D1D5DB" />
                <path d="M21 15l-5-5L5 21" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              {q ? "Không tìm thấy ảnh" : "Chưa có ảnh nào"}
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
              {q
                ? `Không có ảnh khớp với "${q}".`
                : "Tải ảnh lên để bắt đầu lưu giữ kỷ niệm chuyến đi này."}
            </p>
            {canUpload && !q && (
              <button
                onClick={onUpload}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-lg shadow-blue-200 dark:shadow-none cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                Tải ảnh lên ngay
              </button>
            )}
          </div>
        ) : viewMode === "masonry" ? (
          photos.length === 0 ? (
            event.photos.length === 0 ? (
              /* Skeleton loading grid khi đang tải ảnh từ backend */
              <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 p-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="mb-3 break-inside-avoid rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 animate-pulse"
                    style={{ height: `${[160, 220, 180, 250, 140, 200, 170, 240, 190, 150, 210, 165][i % 12]}px` }}
                  />
                ))}
              </div>
            ) : (
              <p className="py-20 text-center text-sm text-neutral-500">
                Không có ảnh khớp với "{q}".
              </p>
            )
          ) : (
            <PhotoMasonry
              photos={photos}
              selectedIds={selected}
              onSelectPhoto={canSelect ? (id) => toggleSelect(id) : () => {}}
              onPhotoClick={(_photo, index) => {
                setSlideshow(false)
                setLightboxIndex(index)
              }}
            />
          )
        ) : (
          <JustifiedGallery
            photos={photos}
            selectedIds={selected}
            onSelectPhoto={canSelect ? (id) => toggleSelect(id) : () => {}}
            onPhotoClick={(_photo, index) => {
              setSlideshow(false)
              setLightboxIndex(index)
            }}
            targetRowHeight={250}
            gap={4}
            mode={viewMode}
            loading={event.photos.length === 0 && (event.photoCount ?? 0) > 0}
          />
        )}
          </>
        )}

        {/* TAB TỔNG QUAN & QUẢN TRỊ (GỘP THÔNG TIN + CHIA SẺ CHUẨN DEV DASHBOARD) */}
        {activeTab === "info" && (
          <div className="max-w-6xl mx-auto py-6 space-y-8">
            {/* TOP DEVELOPER TELEMETRY STATUS BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 px-5 rounded-2xl bg-[rgba(15,20,38,0.75)] backdrop-blur-2xl border border-white/10 font-mono text-xs shadow-xl">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  STATUS: 200_OK
                </span>
                <span className="text-white/20">|</span>
                <div className="flex items-center gap-1.5 text-white/80">
                  <span className="text-white/40">UUID:</span>
                  <span className="text-cyan-300 font-semibold select-all">#EV-{String(event.id).padStart(4, "0")}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`#EV-${event.id}`)
                      onToast?.("success", "Đã sao chép Album UUID!")
                    }}
                    title="Sao chép UUID"
                    className="text-white/40 hover:text-cyan-300 transition-colors cursor-pointer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  </button>
                </div>
                <span className="text-white/20">|</span>
                <span className="text-white/60">
                  POLICY: <span className="text-white font-semibold">{vis.label.toUpperCase()}</span>
                </span>
              </div>

              <div className="flex items-center gap-3 text-white/60">
                <span className="hidden sm:inline">
                  PAYLOAD: <span className="text-cyan-300 font-semibold">{formatFileSize(event.totalSizeBytes ?? totalSize)}</span>
                </span>
                <span className="text-white/20 hidden sm:inline">|</span>
                <span className="text-emerald-400/90 font-semibold flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  S3_STORAGE_SYNCED
                </span>
              </div>
            </div>

            {/* MAIN 2-COLUMN GRID (MEDIA HERO & METADATA SPECS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* CỘT TRÁI (5 CỘT): HERO MEDIA & CLI ACTIONS */}
              <div className="lg:col-span-5 bg-[rgba(15,20,38,0.72)] backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col gap-5">
                {/* Hero Media Box with HUD Overlays */}
                <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-neutral-900 border border-white/10 group shadow-lg">
                  <AuthImg
                    src={event.coverImage}
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

                  {/* Corner HUD: Aspect ratio & Role */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 font-mono text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-cyan-300 border border-white/20 shadow-md">
                      RATIO: 16:10
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white/80 border border-white/20 shadow-md">
                      ROLE: {role?.toUpperCase() ?? "GUEST"}
                    </span>
                  </div>

                  {/* Top-Right: Object ID */}
                  <div className="absolute top-3 right-3 font-mono text-[10px]">
                    <span className="px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white/70 border border-white/20 shadow-md">
                      #EV-{event.id}
                    </span>
                  </div>

                  {/* Bottom: Title & Geolocation */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="text-lg font-bold tracking-tight drop-shadow truncate">
                      {event.name}
                    </h3>
                    {event.location && (
                      <p className="text-xs text-cyan-300/90 flex items-center gap-1 mt-0.5 drop-shadow font-mono">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                          <circle cx="12" cy="9" r="2.5" />
                        </svg>
                        <span>{event.location}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Console / Description Box */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/10 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5 text-[10px] text-white/40">
                    <span>// MANIFEST_DESCRIPTION</span>
                    <span>UTF-8</span>
                  </div>
                  {event.description ? (
                    <p className="text-white/85 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                      {event.description}
                    </p>
                  ) : (
                    <p className="text-white/35 italic text-[11px]">
                      // NO_DESCRIPTION_METADATA_ATTACHED
                    </p>
                  )}
                </div>

                {/* CLI-style Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5 pt-1 font-mono text-xs">
                  {photos.length > 0 && (
                    <button
                      onClick={() => {
                        setSlideshow(true)
                        setLightboxIndex(0)
                      }}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors cursor-pointer border border-white/10 active:scale-95"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      <span>▶ SLIDESHOW</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab("photos")}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold transition-all shadow-md shadow-blue-600/30 cursor-pointer active:scale-95"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>⊞ BROWSE_PHOTOS</span>
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="col-span-2 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/15 text-cyan-300 hover:text-white font-semibold transition-colors cursor-pointer border border-cyan-500/30 active:scale-95"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>+ GENERATE_SHARE_LINK</span>
                    </button>
                  )}
                </div>
              </div>

              {/* CỘT PHẢI (7 CỘT): TELEMETRY METRICS & SYSTEM MANIFEST */}
              <div className="lg:col-span-7 space-y-6">
                {/* 4 Cyber Telemetry Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  {/* Total Objects */}
                  <div className="p-3.5 rounded-2xl bg-[rgba(15,20,38,0.72)] backdrop-blur-xl border border-white/10 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-white/40 tracking-wider">TOTAL_OBJECTS</span>
                      <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-base font-bold text-white tracking-tight">{photoTotal}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">Assets indexed</p>
                  </div>

                  {/* Payload Size */}
                  <div className="p-3.5 rounded-2xl bg-[rgba(15,20,38,0.72)] backdrop-blur-xl border border-white/10 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-white/40 tracking-wider">STORAGE_PAYLOAD</span>
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white tracking-tight truncate">
                      {formatFileSize(event.totalSizeBytes ?? totalSize)}
                    </p>
                    <p className="text-[10px] text-emerald-400/80 mt-0.5">S3 SSD Hot</p>
                  </div>

                  {/* Geolocation */}
                  <div className="p-3.5 rounded-2xl bg-[rgba(15,20,38,0.72)] backdrop-blur-xl border border-white/10 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-white/40 tracking-wider">GEO_TARGET</span>
                      <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                          <circle cx="12" cy="9" r="2.5" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white tracking-tight truncate" title={event.location || "UNSET"}>
                      {event.location || "UNSET"}
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5">Geotag metadata</p>
                  </div>

                  {/* Temporal Window */}
                  <div className="p-3.5 rounded-2xl bg-[rgba(15,20,38,0.72)] backdrop-blur-xl border border-white/10 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-white/40 tracking-wider">TIME_SPAN</span>
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-white tracking-tight truncate" title={formatDateRange(event.startDate, event.endDate)}>
                      {formatDateRange(event.startDate, event.endDate)}
                    </p>
                    <p className="text-[10px] text-white/40 mt-0.5">Event window</p>
                  </div>
                </div>

                {/* System Manifest & Technical Specs (Inspector) */}
                <div className="bg-[rgba(15,20,38,0.72)] backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl font-mono">
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner font-bold text-sm">
                      SYS
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                        <span>System Manifest &amp; Specs</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          SYNCED
                        </span>
                      </h4>
                      <p className="text-xs text-white/50 mt-0.5">
                        Thuộc tính runtime và thông số kiểm soát truy cập
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    {/* Hàng: Canonical ID */}
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-black/35 border border-white/5">
                      <span className="text-white/40 font-medium">canonical_id:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-300 font-semibold select-all">#EV-{event.id}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(String(event.id))
                            onToast?.("success", "Đã sao chép ID sự kiện!")
                          }}
                          className="text-white/40 hover:text-cyan-300 cursor-pointer"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Hàng: Canonical Title */}
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-black/35 border border-white/5">
                      <span className="text-white/40 font-medium">canonical_title:</span>
                      <span className="font-semibold text-white font-sans">{event.name}</span>
                    </div>

                    {/* Hàng: Owner Principal */}
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-black/35 border border-white/5">
                      <span className="text-white/40 font-medium">owner_principal:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                          {(event.createdBy || user?.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-white">
                          {event.createdBy || user?.name || "root"}
                        </span>
                        <span className="text-[10px] text-white/35">#uid_{event.ownerId}</span>
                      </div>
                    </div>

                    {/* Hàng: Created At */}
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-black/35 border border-white/5">
                      <span className="text-white/40 font-medium">created_timestamp:</span>
                      <span className="text-white/80">{formatDate(event.createdAt)}</span>
                    </div>

                    {/* Hàng: Access Policy */}
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-black/35 border border-white/5">
                      <span className="text-white/40 font-medium">access_policy:</span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold">
                          <span>{vis.icon}</span>
                          <span>{vis.label}</span>
                        </span>
                        {isOwner && (
                          <button
                            onClick={() => setShowShareModal(true)}
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                          >
                            Config
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Hàng: Data Encryption */}
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-black/35 border border-white/5">
                      <span className="text-white/40 font-medium">encryption_at_rest:</span>
                      <span className="text-emerald-400 font-semibold text-[11px]">
                        AES-256-GCM · TLS 1.3
                      </span>
                    </div>

                    {/* Hàng: Storage Engine */}
                    <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-black/35 border border-white/5">
                      <span className="text-white/40 font-medium">storage_tier:</span>
                      <span className="text-white/80 text-[11px]">
                        Standard Hot SSD (S3-Compatible)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* INTEGRATED ACCESS CONTROL & IAM ENGINE (CHỈ HIỂN THỊ KHI LÀ OWNER) */}
            {isOwner && (
              <div className="pt-6 border-t border-white/10">
                <ShareTab
                  eventId={Number(event.id)}
                  onOpenShareModal={() => setShowShareModal(true)}
                  onToast={onToast}
                  refreshTrigger={shareRefreshKey}
                  isEmbedded={true}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating selection toolbar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#18181b] text-white pl-4 pr-2 py-2 rounded-full shadow-2xl slide-up border border-neutral-700">
          <span className="text-xs sm:text-sm font-medium pr-2">
            <strong>{selected.size}</strong> đã chọn
          </span>
          <div className="w-px h-4 bg-white/20" />
          <button
            onClick={selected.size === photos.length ? clearSelect : selectAll}
            className="px-2.5 py-1 text-xs text-white/80 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            {selected.size === photos.length ? "Bỏ chọn" : "Tất cả"}
          </button>
          {canSelect && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-2.5 py-1 text-xs text-red-400 hover:text-red-300 rounded-full transition-colors cursor-pointer"
            >
              Xóa
            </button>
          )}
          <button
            onClick={clearSelect}
            title="Đóng"
            className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Lightbox Photo Detail */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          location={event.location}
          photographerName={user?.name}
          selected={selected}
          onToggleSelect={toggleSelect}
          autoPlay={slideshow}
          onShare={
            user && String(event.ownerId) === String(user.id)
              ? () => {
                  setLightboxIndex(null)
                  setSlideshow(false)
                  setShowShareModal(true)
                }
              : undefined
          }
          onDelete={(() => {
            if (!canSelect) return undefined
            const currentPhoto =
              lightboxIndex != null ? photos[lightboxIndex] : undefined
            if (!currentPhoto || !canDelete(currentPhoto)) return undefined
            return (photoId: string) => {
              setSelected(new Set([photoId]))
              setLightboxIndex(null)
              setSlideshow(false)
              setShowDeleteConfirm(true)
            }
          })()}
          onClose={() => {
            setLightboxIndex(null)
            setSlideshow(false)
          }}
        />
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="slide-up relative bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">
              Xác nhận xóa
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm mb-5">
              Bạn có chắc muốn xóa <strong>{selected.size} ảnh</strong> đã chọn?
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 rounded-full bg-red-600 hover:bg-red-700 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Xóa {selected.size} ảnh
              </button>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <ShareModal
          event={event}
          onClose={() => setShowShareModal(false)}
          onToast={onToast}
          onChanged={() => {
            setShareRefreshKey((k) => k + 1)
            onVisibilityChanged?.(event.id)
          }}
        />
      )}
    </main>
  )
}
