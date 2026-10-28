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

type AlbumTab = "photos" | "info" | "shared"
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
    { key: "photos", label: `Ảnh (${photoTotal})` },
    { key: "info", label: "Thông tin" },
    ...(isOwner ? [{ key: "shared" as AlbumTab, label: "Chia sẻ" }] : []),
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

        {/* INFO TAB — Redesign chuẩn phong cách CasaOS Glass */}
        {activeTab === "info" && (
          <div className="max-w-6xl mx-auto py-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* CỘT TRÁI (5 cột): Ảnh bìa Hero & Thao tác nhanh */}
              <div className="lg:col-span-5 bg-[rgba(22,28,54,0.65)] backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl flex flex-col gap-5">
                {/* Khung ảnh bìa lớn điện ảnh */}
                <div className="relative rounded-2xl overflow-hidden aspect-[16/10] bg-neutral-900 border border-white/10 group shadow-lg">
                  <AuthImg
                    src={event.coverImage}
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Badge quyền xem góc trên */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 shadow-md">
                      <span>{vis.icon}</span>
                      <span>{vis.label}</span>
                    </span>
                  </div>

                  {/* Tên & địa điểm đè trên ảnh */}
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <h3 className="text-lg font-bold tracking-tight drop-shadow truncate">
                      {event.name}
                    </h3>
                    {event.location && (
                      <p className="text-xs text-white/80 flex items-center gap-1 mt-0.5 drop-shadow">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                          <circle cx="12" cy="9" r="2.5" />
                        </svg>
                        <span>{event.location}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Mô tả chuyến đi nếu có */}
                {event.description ? (
                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10">
                    <p className="text-xs font-medium text-white/40 mb-1">Mô tả chuyến đi</p>
                    <p className="text-xs text-white/85 leading-relaxed whitespace-pre-wrap">
                      {event.description}
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 text-center text-xs text-white/40 italic">
                    Chưa có mô tả cho album này.
                  </div>
                )}

                {/* Dãy nút thao tác nhanh */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  {photos.length > 0 && (
                    <button
                      onClick={() => {
                        setSlideshow(true)
                        setLightboxIndex(0)
                      }}
                      className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer border border-white/10 active:scale-95"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      <span>Trình chiếu</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab("photos")}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all shadow-md shadow-blue-600/30 cursor-pointer active:scale-95"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>Xem kho ảnh</span>
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="col-span-2 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 hover:text-white text-xs font-semibold transition-colors cursor-pointer border border-white/10 active:scale-95"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                      <span>Quản lý chia sẻ & phân quyền</span>
                    </button>
                  )}
                </div>
              </div>

              {/* CỘT PHẢI (7 cột): 4 Thẻ chỉ số + Chi tiết Album */}
              <div className="lg:col-span-7 space-y-6">
                {/* 4 Thẻ chỉ số thống kê (CasaOS Quick Metric Cards) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Số ảnh */}
                  <div className="p-4 rounded-2xl bg-[rgba(22,28,54,0.65)] backdrop-blur-xl border border-white/10 shadow-lg">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <p className="text-[11px] text-white/50">Số bức ảnh</p>
                    <p className="text-base font-bold text-white mt-0.5">{photoTotal}</p>
                  </div>

                  {/* Dung lượng */}
                  <div className="p-4 rounded-2xl bg-[rgba(22,28,54,0.65)] backdrop-blur-xl border border-white/10 shadow-lg">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      </svg>
                    </div>
                    <p className="text-[11px] text-white/50">Dung lượng</p>
                    <p className="text-base font-bold text-white mt-0.5 truncate">
                      {formatFileSize(event.totalSizeBytes ?? totalSize)}
                    </p>
                  </div>

                  {/* Địa điểm */}
                  <div className="p-4 rounded-2xl bg-[rgba(22,28,54,0.65)] backdrop-blur-xl border border-white/10 shadow-lg">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-2.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                    </div>
                    <p className="text-[11px] text-white/50">Địa điểm</p>
                    <p className="text-base font-bold text-white mt-0.5 truncate" title={event.location || "Chưa có"}>
                      {event.location || "Chưa có"}
                    </p>
                  </div>

                  {/* Thời gian */}
                  <div className="p-4 rounded-2xl bg-[rgba(22,28,54,0.65)] backdrop-blur-xl border border-white/10 shadow-lg">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <p className="text-[11px] text-white/50">Thời gian</p>
                    <p className="text-xs font-bold text-white mt-1 truncate" title={formatDateRange(event.startDate, event.endDate)}>
                      {formatDateRange(event.startDate, event.endDate)}
                    </p>
                  </div>
                </div>

                {/* Bảng chi tiết hồ sơ Album */}
                <div className="bg-[rgba(22,28,54,0.65)] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/10">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white tracking-tight">
                        Hồ sơ chi tiết album
                      </h4>
                      <p className="text-xs text-white/50 mt-0.5">
                        Dữ liệu hệ thống và cấu hình quyền truy cập
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    {/* Hàng: Tên album */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                      <span className="text-xs text-white/50 font-medium">Tên sự kiện / Album:</span>
                      <span className="text-xs font-semibold text-white">{event.name}</span>
                    </div>

                    {/* Hàng: Người tạo */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                      <span className="text-xs text-white/50 font-medium">Người tạo album:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                          {(event.createdBy || user?.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-white">
                          {event.createdBy || user?.name || "Bạn"}
                        </span>
                      </div>
                    </div>

                    {/* Hàng: Ngày tạo */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                      <span className="text-xs text-white/50 font-medium">Thời điểm khởi tạo:</span>
                      <span className="text-xs text-white/80 font-mono">{formatDate(event.createdAt)}</span>
                    </div>

                    {/* Hàng: Quyền riêng tư & bảo mật */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                      <span className="text-xs text-white/50 font-medium">Trạng thái quyền xem:</span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          <span>{vis.icon}</span>
                          <span>{vis.label}</span>
                        </span>
                        {isOwner && (
                          <button
                            onClick={() => setActiveTab("shared")}
                            className="text-[11px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                          >
                            Đổi quyền
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Hàng: Trạng thái máy chủ */}
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                      <span className="text-xs text-white/50 font-medium">Trạng thái lưu trữ:</span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Hoạt động bình thường
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SHARED TAB (chỉ chủ album) */}
        {activeTab === "shared" && isOwner && (
          <ShareTab
            eventId={Number(event.id)}
            onOpenShareModal={() => setShowShareModal(true)}
            onToast={onToast}
            refreshTrigger={shareRefreshKey}
          />
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
