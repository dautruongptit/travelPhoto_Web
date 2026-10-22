import { useState, useMemo, useRef } from "react"
import type { TravelEvent, User, Photo, SortOption } from "../types"
import { formatFileSize, formatDateRange, formatDate } from "../utils"
import Lightbox from "./Lightbox"
import ShareModal from "./ShareModal"
import AuthImg from "./AuthImg"
import JustifiedGallery from "./flickr/JustifiedGallery"

interface Props {
  event: TravelEvent
  user: User | null
  searchQuery: string
  onBack: () => void
  onUpload: () => void
  onDeletePhotos: (ids: string[]) => void
  onToast: (type: "success" | "error" | "warning" | "info", msg: string) => void
}

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Mới nhất",
  oldest: "Cũ nhất",
  "name-az": "Tên A–Z",
  "name-za": "Tên Z–A",
}

type AlbumTab = "photos" | "info" | "shared"
type ViewMode = "justified" | "grid" | "large"
const VIEW_MODE_KEY = "travelphoto-album-view"

const VIEW_BUTTONS: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
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
}: Props) {
  const [activeTab, setActiveTab] = useState<AlbumTab>("photos")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sort, setSort] = useState<SortOption>("newest")
  const [filterQuery, setFilterQuery] = useState("")
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [slideshow, setSlideshow] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_KEY)
      return saved === "grid" || saved === "large" ? saved : "justified"
    } catch {
      return "justified"
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
  const isOwner = !!user && String(event.ownerId) === String(user.id)
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
      <div className="bg-white dark:bg-[#0b0b0c] border-b border-neutral-200/80 dark:border-neutral-800/80 transition-colors">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-14 xl:px-24 py-4">
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
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
                  {event.name}
                </h1>
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
              {user && (
                <button
                  onClick={onUpload}
                  className="flex items-center gap-1.5 h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all text-sm shadow-sm hover:shadow-md hover:shadow-blue-200 cursor-pointer"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" />
                    <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" />
                  </svg>
                  <span className="hidden sm:inline">Tải ảnh</span>
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 mt-5 border-b border-neutral-100 dark:border-neutral-800 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors mr-1 cursor-pointer ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-14 xl:px-24 py-5">
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
                <div className="slide-up absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#18181b] rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-800 py-1 z-20 text-xs">
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

            {photos.length > 0 && (
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
            {user && !q && (
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
        ) : (
          <JustifiedGallery
            photos={photos}
            selectedIds={selected}
            onSelectPhoto={(id) => toggleSelect(id)}
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

        {/* INFO TAB */}
        {activeTab === "info" && (
          <div className="max-w-xl space-y-5">
            <div className="bg-white dark:bg-[#18181b] rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
              <div className="h-48 bg-neutral-100 dark:bg-neutral-800">
                <AuthImg
                  src={event.coverImage}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 space-y-4">
                {[
                  { label: "Tên sự kiện", value: event.name },
                  { label: "Mô tả", value: event.description || "—" },
                  { label: "Địa điểm", value: event.location || "—" },
                  {
                    label: "Thời gian",
                    value: formatDateRange(event.startDate, event.endDate),
                  },
                  {
                    label: "Số ảnh",
                    value: `${photoTotal} ảnh · ${formatFileSize(event.totalSizeBytes ?? totalSize)}`,
                  },
                  { label: "Người tạo", value: event.createdBy || "—" },
                  { label: "Ngày tạo", value: formatDate(event.createdAt) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start gap-4">
                    <span className="text-sm text-neutral-400 w-32 flex-shrink-0 pt-0.5">
                      {label}
                    </span>
                    <span className="text-sm text-neutral-900 dark:text-white font-medium">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SHARED TAB (chỉ chủ album) */}
        {activeTab === "shared" && isOwner && (
          <div className="max-w-xl py-10 text-center mx-auto">
            <div className="text-4xl mb-3">🔗</div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-2">
              Chia sẻ album
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
              Tạo link chia sẻ hoặc quản lý những người có thể xem album này.
            </p>
            <button
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Cài đặt chia sẻ
            </button>
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
          {user && (
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
          onDelete={
            user
              ? (photoId) => {
                  // Đóng Lightbox rồi mở hộp thoại xác nhận xóa (nằm dưới Lightbox về z-index)
                  setSelected(new Set([photoId]))
                  setLightboxIndex(null)
                  setSlideshow(false)
                  setShowDeleteConfirm(true)
                }
              : undefined
          }
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
        />
      )}
    </main>
  )
}
