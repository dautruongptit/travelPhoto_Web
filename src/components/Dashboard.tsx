import { useState } from "react"
import type { TravelEvent, User, Photo } from "../types"
import { formatTotalSize } from "../utils"
import EventCard from "./EventCard"
import JustifiedGallery from "./flickr/JustifiedGallery"
import Lightbox from "./Lightbox"

interface Props {
  user: User
  events: TravelEvent[]
  searchQuery: string
  loadingEventId?: string | null
  onOpenEvent: (id: string) => void
  onCreateEvent: () => void
  onDeleteEvents: (ids: string[]) => void
}

// Tạm ẩn mục "Khoảnh khắc mới nhất" trên trang chủ (đổi thành true để hiện lại).
const SHOW_RECENT_MOMENTS = false

const EmptyEvents = ({ onCreateEvent }: { onCreateEvent: () => void }) => (
  <div className="flex flex-col items-center justify-center py-28 text-center">
    <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800/80 rounded-full flex items-center justify-center mb-5 text-neutral-400">
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path
          d="M21 15l-5-5L5 21"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
      Chưa có album nào
    </h3>
    <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-sm mb-6 leading-relaxed">
      Tạo album hoặc chuyến đi đầu tiên để bắt đầu sắp xếp và lưu giữ khoảnh
      khắc theo chuẩn Flickr.
    </p>
    <button
      onClick={onCreateEvent}
      className="btn btn-primary cursor-pointer"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
      <span>Tạo chuyến đi mới</span>
    </button>
  </div>
)

export default function Dashboard({
  user,
  events,
  searchQuery,
  loadingEventId,
  onOpenEvent,
  onCreateEvent,
  onDeleteEvents,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [confirmName, setConfirmName] = useState("")
  const [recentLightboxIndex, setRecentLightboxIndex] = useState<number | null>(
    null,
  )

  const totalPhotos = events.reduce(
    (s, e) => s + (e.photoCount ?? e.photos.length),
    0,
  )
  const totalSize = events.reduce(
    (s, e) =>
      s + (e.totalSizeBytes ?? e.photos.reduce((ps, p) => ps + p.size, 0)),
    0,
  )

  // Tổng hợp ảnh gần đây
  const allPhotos: Photo & { eventName: string }[] = events.flatMap((e) =>
    e.photos.map((ph) => ({ ...ph, eventName: e.name })),
  )
  const recentPhotos = [...allPhotos]
    .sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    )
    .slice(0, 10)

  const filtered = searchQuery
    ? events.filter((e) => {
        const q = searchQuery.toLowerCase()
        return (
          e.name.toLowerCase().includes(q) ||
          (e.location ?? "").toLowerCase().includes(q)
        )
      })
    : events

  const selectedEvents = events.filter((e) => selected.has(e.id))
  const targetDeleteName = selectedEvents[0]?.name || ""
  const isDeleteConfirmed =
    selectedEvents.length === 1
      ? confirmName.trim().toLowerCase() === targetDeleteName.trim().toLowerCase()
      : confirmName.trim().toUpperCase() === "XÓA" ||
        selectedEvents.some(
          (e) => e.name.trim().toLowerCase() === confirmName.trim().toLowerCase(),
        )

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(filtered.map((e) => e.id)))
  const clearSelect = () => setSelected(new Set())

  const handleDelete = () => {
    if (!isDeleteConfirmed) return
    onDeleteEvents(Array.from(selected))
    clearSelect()
    setShowDeleteConfirm(false)
    setConfirmName("")
  }

  return (
    <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-4">
      {/* CasaOS Quick Metric Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
        {[
          { label: "Sự kiện & Chuyến đi", value: events.length, icon: "🗺️", accent: "text-cyan-400" },
          { label: "Tổng số bức ảnh", value: totalPhotos, icon: "📸", accent: "text-pink-400" },
          {
            label: "Dung lượng đã dùng",
            value: formatTotalSize(totalSize),
            icon: "💾",
            accent: "text-emerald-400",
          },
          {
            label: "Ảnh gần đây",
            value: allPhotos.filter((p) => {
              const d = new Date(p.uploadedAt)
              return Date.now() - d.getTime() < 7 * 86400000
            }).length,
            icon: "✨",
            accent: "text-amber-400",
          },
        ].map(({ label, value, icon, accent }) => (
          <div
            key={label}
            className="blur-background glass-hover px-3 py-2.5 transition-all flex items-center justify-between cursor-default"
          >
            <div>
              <p className="text-[11px] text-white/60 font-medium">
                {label}
              </p>
              <p className="text-base sm:text-lg font-bold text-white mt-0.5 tracking-tight leading-tight">
                {value}
              </p>
            </div>
            <div className={`w-7 h-7 rounded-lg bg-white/[0.08] border border-white/10 flex items-center justify-center text-sm ${accent}`}>
              {icon}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Photos Showcase (Flickr Justified Gallery) */}
      {SHOW_RECENT_MOMENTS && recentPhotos.length > 0 && !searchQuery && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight">
                Khoảnh khắc mới nhất
              </h2>
              <span className="text-xs text-neutral-400 font-medium">
                ({recentPhotos.length} ảnh)
              </span>
            </div>
          </div>

          <div className="blur-background p-2">
            <JustifiedGallery
              photos={recentPhotos}
              onPhotoClick={(_photo, index) => setRecentLightboxIndex(index)}
              targetRowHeight={200}
              gap={3}
            />
          </div>
        </section>
      )}

      {/* Events / Albums Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-4 bg-blue-500 rounded-full shadow-sm shadow-blue-500/50" />
            {searchQuery
              ? `Kết quả tìm kiếm "${searchQuery}"`
              : "Tất cả album"}
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10">
              {filtered.length}
            </span>
          </h2>
        </div>

        {filtered.length === 0 ? (
          searchQuery ? (
            <div className="py-20 text-center">
              <p className="text-neutral-400 text-sm">
                Không tìm thấy sự kiện phù hợp.
              </p>
            </div>
          ) : (
            <EmptyEvents onCreateEvent={onCreateEvent} />
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                user={null}
                selected={selected.has(event.id)}
                isLoading={loadingEventId === event.id}
                onSelect={() => toggleSelect(event.id)}
                onClick={() => onOpenEvent(event.id)}
              />
            ))}
            {!searchQuery && (
              <button
                data-glass="create"
                onClick={onCreateEvent}
                className="group rounded-[10px] flex flex-col items-center justify-center gap-3 text-white/60 hover:text-white transition-all cursor-pointer min-h-[200px] p-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform shadow-inner">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-semibold tracking-tight">Tạo sự kiện mới</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* Floating Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#18181b] text-white pl-4 pr-2 py-2 rounded-full shadow-2xl slide-up border border-neutral-700">
          <span className="text-xs sm:text-sm font-medium pr-2">
            <strong>{selected.size}</strong> sự kiện đã chọn
          </span>
          <div className="w-px h-4 bg-white/20" />
          <button
            onClick={
              selected.size === filtered.length ? clearSelect : selectAll
            }
            className="btn btn-ghost btn-sm cursor-pointer"
          >
            {selected.size === filtered.length
              ? "Bỏ chọn"
              : `Chọn tất cả (${filtered.length})`}
          </button>
          <button
            onClick={() => {
              setConfirmName("")
              setShowDeleteConfirm(true)
            }}
            className="btn btn-ghost-danger btn-sm cursor-pointer"
          >
            Xóa
          </button>
          <button
            onClick={clearSelect}
            title="Đóng"
            className="btn btn-ghost btn-icon btn-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => {
              setShowDeleteConfirm(false)
              setConfirmName("")
            }}
          />
          <div className="slide-up relative bg-[rgba(22,28,54,0.92)] backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl p-6 max-w-md w-full text-left text-white">
            <div className="flex items-center gap-3 mb-3.5">
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white tracking-tight truncate">
                  Xác nhận xóa {selected.size === 1 ? "sự kiện / album" : `${selected.size} sự kiện / album`}
                </h3>
                <p className="text-xs text-red-300 font-medium">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <p className="text-white/70 text-sm mb-4 leading-relaxed">
              Toàn bộ ảnh, thông tin chuyến đi và liên kết chia sẻ bên trong{" "}
              {selected.size === 1 ? (
                <>sự kiện <strong className="text-white font-semibold break-all">"{targetDeleteName}"</strong></>
              ) : (
                <><strong className="text-white font-semibold">{selected.size} sự kiện đã chọn</strong></>
              )}{" "}
              sẽ bị xóa vĩnh viễn khỏi hệ thống.
            </p>

            <div className="bg-black/35 border border-white/10 rounded-xl p-3 mb-4 text-xs">
              <p className="text-white/60 mb-1.5">
                {selected.size === 1
                  ? "Vui lòng nhập chính xác tên sự kiện dưới đây để xác nhận:"
                  : `Vui lòng nhập tên sự kiện "${targetDeleteName}" hoặc gõ "XÓA" để xác nhận:`}
              </p>
              <p className="font-mono text-sm font-bold text-amber-300 select-all tracking-wide bg-white/[0.06] px-2.5 py-1.5 rounded-lg border border-white/10 break-all">
                {selected.size === 1 ? targetDeleteName : `${targetDeleteName} (hoặc XÓA)`}
              </p>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Nhập tên để xác nhận:
              </label>
              <input
                type="text"
                autoFocus
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isDeleteConfirmed) {
                    e.preventDefault()
                    handleDelete()
                  }
                }}
                placeholder={
                  selected.size === 1
                    ? `Nhập "${targetDeleteName}"...`
                    : `Nhập "${targetDeleteName}" hoặc "XÓA"...`
                }
                className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 focus:border-red-400 focus:ring-2 focus:ring-red-400/20 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
              />
              {confirmName.trim() && !isDeleteConfirmed && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <span>⚠</span> Tên chưa khớp với yêu cầu
                </p>
              )}
              {isDeleteConfirmed && (
                <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1 font-medium">
                  <span>✓</span> Đã khớp, bạn có thể thực hiện xóa
                </p>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setConfirmName("")
                }}
                className="btn btn-secondary flex-1 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={!isDeleteConfirmed}
                onClick={handleDelete}
                className={`btn btn-danger flex-1 transition-all ${
                  isDeleteConfirmed
                    ? "cursor-pointer active:scale-95 shadow-lg shadow-red-600/30"
                    : "opacity-40 cursor-not-allowed pointer-events-none"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>
                  {selected.size === 1 ? "Xóa sự kiện" : `Xóa ${selected.size} sự kiện`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for Recent Photos */}
      {recentLightboxIndex !== null && (
        <Lightbox
          photos={recentPhotos}
          initialIndex={recentLightboxIndex}
          photographerName={user.name}
          selected={new Set()}
          onToggleSelect={() => {}}
          onClose={() => setRecentLightboxIndex(null)}
        />
      )}
    </main>
  )
}
