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
  onOpenProfile?: () => void
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
  onOpenProfile,
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
    { key: "info", label: "Thông tin & Chia sẻ" },
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
      {/* Header bar gọn gàng chuẩn theo mockup */}
      <div className="border-b border-white/10 bg-transparent transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3.5">
          {/* Hàng 1: Breadcrumb + Badge quyền xem ở bên trái, Nút Chia sẻ + Avatar ở bên phải */}
          <div className="flex items-center justify-between gap-3 mb-3.5 flex-wrap">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-400">
              <button
                onClick={onBack}
                className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium"
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
              <span className="text-white/30">/</span>
              <span className="text-white font-bold truncate max-w-xs sm:max-w-md">
                {event.name}
              </span>

              {/* Badge quyền xem đặt ngay cạnh tên album */}
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/15">
                <span>{vis.icon}</span>
                <span>{vis.label}</span>
              </span>
            </div>

            {/* Bên phải: Nút Chia sẻ + Avatar */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              {user && String(event.ownerId) === String(user.id) && (
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-1.5 h-8 px-3.5 bg-white/5 hover:bg-white/10 border border-white/15 rounded-full text-xs font-semibold text-white transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <svg
                    width="13"
                    height="13"
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
                  <span>Chia sẻ</span>
                </button>
              )}

              {user && (
                <button
                  type="button"
                  onClick={onOpenProfile}
                  title={user.name || "Hồ sơ cá nhân"}
                  className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-md ring-2 ring-white/10 hover:ring-white/30 transition-all cursor-pointer active:scale-95"
                >
                  {(user.name || "U").charAt(0).toUpperCase()}
                </button>
              )}
            </div>
          </div>

          {/* Hàng 2: Tabs */}
          <div className="flex gap-4 border-b border-white/10 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
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

      <div
        className={
          activeTab === "photos"
            ? "max-w-screen-2xl mx-auto px-4 sm:px-6 py-5"
            : "max-w-6xl mx-auto px-4 sm:px-6 py-6"
        }
      >
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

            {canUpload && (
              <button
                onClick={onUpload}
                className="h-9 px-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Tải ảnh lên</span>
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

        {/* TAB THÔNG TIN & CHIA SẺ — KHỚP 100% THEO THIẾT KẾ MẪU CỦA USER */}
        {activeTab === "info" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* ================= CỘT TRÁI (5 CỘT): THÔNG TIN SỰ KIỆN ================= */}
              <div className="lg:col-span-5">
                <div className="bg-[rgba(22,28,54,0.65)] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
                  {/* Header Thẻ Thông tin sự kiện */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white tracking-tight">
                          Thông tin sự kiện
                        </h3>
                        <p className="text-xs text-white/50 mt-0.5">
                          Chi tiết &amp; ghi chú chuyến đi
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-medium text-white/70 px-3.5 py-1 rounded-full bg-white/5 border border-white/10">
                      Album
                    </span>
                  </div>

                  {/* Thông tin dòng chi tiết */}
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-white/50 font-medium">Tên album:</span>
                      <span className="text-sm font-bold text-white">{event.name}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-white/50 font-medium">Địa điểm:</span>
                      <span className="text-sm font-medium text-white/90">{event.location || "Chưa có"}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-white/50 font-medium">Thời gian:</span>
                      <span className="text-sm font-medium text-white/90">{formatDateRange(event.startDate, event.endDate)}</span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-white/50 font-medium">Người tạo:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                          {(event.createdBy || user?.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-bold text-white">
                          {event.createdBy || user?.name || "Bạn"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-white/50 font-medium">Quyền xem:</span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                        <span>{vis.icon}</span>
                        <span>{vis.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Khung mô tả chuyến đi */}
                  <div className="pt-2">
                    <p className="text-xs text-white/50 font-medium mb-2.5">Mô tả chuyến đi:</p>
                    <div className="p-4 rounded-2xl bg-black/30 border border-white/10 min-h-[90px] flex items-center">
                      <p className="text-sm text-white/90 italic font-medium leading-relaxed">
                        {event.description ? `“${event.description}”` : <span className="text-white/40 not-italic text-xs">Chưa có ghi chú mô tả chuyến đi.</span>}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= CỘT PHẢI (7 CỘT): 3 THẺ CHIA SẺ, THÀNH VIÊN & BẢO MẬT ================= */}
              <div className="lg:col-span-7">
                {isOwner ? (
                  <ShareTab
                    eventId={Number(event.id)}
                    eventName={event.name}
                    onOpenShareModal={() => setShowShareModal(true)}
                    onToast={onToast}
                    refreshTrigger={shareRefreshKey}
                    isEmbedded={true}
                  />
                ) : (
                  /* GIAO DIỆN DÀNH CHO KHÁCH (VIEWER) */
                  <div className="space-y-6">
                    <div className="bg-[rgba(22,28,54,0.65)] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-xl space-y-5">
                      <div className="relative rounded-2xl overflow-hidden aspect-[16/9] bg-neutral-900 border border-white/10">
                        <AuthImg
                          src={event.coverImage}
                          alt={event.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                          <h3 className="text-xl font-bold tracking-tight">{event.name}</h3>
                          {event.location && (
                            <p className="text-xs text-white/80 mt-1 flex items-center gap-1">
                              📍 {event.location}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setActiveTab("photos")}
                          className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer text-center"
                        >
                          Xem {photoTotal} bức ảnh trong album
                        </button>
                        {photos.length > 0 && (
                          <button
                            onClick={() => {
                              setSlideshow(true)
                              setLightboxIndex(0)
                            }}
                            className="py-3 px-5 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-xl border border-white/10 transition-colors cursor-pointer"
                          >
                            Trình chiếu
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
