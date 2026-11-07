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
      className="flex items-center gap-2 bg-[#ff0084] hover:bg-[#e00074] text-white font-semibold px-5 py-2.5 rounded-full transition-all shadow-sm active:scale-95 cursor-pointer text-sm"
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
    onDeleteEvents(Array.from(selected))
    clearSelect()
    setShowDeleteConfirm(false)
  }

  return (
    <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-20">
      {/* CasaOS Quick Metric Widgets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
        {[
          { label: "Sự kiện & Chuyến đi", value: events.length, icon: "🗺️", accent: "from-blue-500/20 to-cyan-500/20 text-cyan-300" },
          { label: "Tổng số bức ảnh", value: totalPhotos, icon: "📸", accent: "from-purple-500/20 to-pink-500/20 text-pink-300" },
          {
            label: "Dung lượng đã dùng",
            value: formatTotalSize(totalSize),
            icon: "💾",
            accent: "from-emerald-500/20 to-teal-500/20 text-emerald-300",
          },
          {
            label: "Ảnh gần đây",
            value: allPhotos.filter((p) => {
              const d = new Date(p.uploadedAt)
              return Date.now() - d.getTime() < 7 * 86400000
            }).length,
            icon: "✨",
            accent: "from-amber-500/20 to-orange-500/20 text-amber-300",
          },
        ].map(({ label, value, icon, accent }) => (
          <div
            key={label}
            data-glass="stat"
            className="blur-background rounded-[10px] p-4 transition-all flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-white/60 font-medium">
                {label}
              </p>
              <p className="text-xl sm:text-2xl font-bold text-white mt-1 tracking-tight">
                {value}
              </p>
            </div>
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${accent} border border-white/10 flex items-center justify-center text-xl shadow-inner`}>
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

          <div className="rounded-2xl overflow-hidden bg-[rgba(53,54,58,0.35)] backdrop-blur-[8px] saturate-[180%] border border-white/10 p-2 shadow-[inset_0.5px_1px_1px_0px_rgba(255,255,255,0.125)]">
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
              : "Tất cả sự kiện"}
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
            className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            {selected.size === filtered.length
              ? "Bỏ chọn"
              : `Chọn tất cả (${filtered.length})`}
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-2.5 py-1 text-xs text-red-400 hover:text-red-300 rounded-full transition-colors cursor-pointer"
          >
            Xóa
          </button>
          <button
            onClick={clearSelect}
            title="Đóng"
            className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="slide-up relative bg-white dark:bg-[#18181b] rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-2">
              Xác nhận xóa sự kiện
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-5 leading-relaxed">
              Bạn có chắc muốn xóa <strong>{selected.size} sự kiện</strong> đã
              chọn? Toàn bộ ảnh bên trong cũng sẽ bị xóa vĩnh viễn.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-full border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 rounded-full bg-red-600 hover:bg-red-700 text-sm font-semibold text-white transition-colors cursor-pointer"
              >
                Xóa {selected.size} sự kiện
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
