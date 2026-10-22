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
  onOpenEvent: (id: string) => void
  onCreateEvent: () => void
  onDeleteEvents: (ids: string[]) => void
}

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
    <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm max-w-sm mb-6 leading-relaxed">
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
    <main className="max-w-[1920px] mx-auto px-3 sm:px-6 py-6 pb-20">
      {/* Flickr Slim Hero Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-neutral-200/80 dark:border-neutral-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              Khám phá & Bộ sưu tập
            </h1>
            <span className="w-2 h-2 rounded-full bg-[#0063dc]" />
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Xin chào{" "}
            <strong className="text-neutral-800 dark:text-neutral-200">
              {user.name}
            </strong>{" "}
            · Lưu giữ những khoảnh khắc tuyệt đẹp
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onCreateEvent}
            className="flex items-center gap-1.5 bg-[#0063dc] hover:bg-[#0052b8] text-white font-semibold px-4 py-2 rounded-full transition-all text-xs sm:text-sm shadow-sm active:scale-95 cursor-pointer"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            <span>Tạo sự kiện mới</span>
          </button>
        </div>
      </div>

      {/* Flickr Quick Metric Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Sự kiện & Chuyến đi", value: events.length, icon: "🗺️" },
          { label: "Tổng số bức ảnh", value: totalPhotos, icon: "📸" },
          {
            label: "Dung lượng đã dùng",
            value: formatTotalSize(totalSize),
            icon: "💾",
          },
          {
            label: "Ảnh gần đây",
            value: allPhotos.filter((p) => {
              const d = new Date(p.uploadedAt)
              return Date.now() - d.getTime() < 7 * 86400000
            }).length,
            icon: "✨",
          },
        ].map(({ label, value, icon }) => (
          <div
            key={label}
            className="bg-neutral-50 dark:bg-[#18181b] rounded-2xl p-4 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {label}
              </p>
              <p className="text-xl font-bold text-neutral-900 dark:text-white mt-1">
                {value}
              </p>
            </div>
            <span className="text-2xl">{icon}</span>
          </div>
        ))}
      </div>

      {/* Recent Photos Showcase (Flickr Justified Gallery) */}
      {recentPhotos.length > 0 && !searchQuery && (
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

          <div className="rounded-xl overflow-hidden bg-neutral-100/50 dark:bg-neutral-900/40 p-1">
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
          <h2 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight">
            {searchQuery
              ? `Kết quả tìm kiếm cho "${searchQuery}"`
              : "Tất cả album chuyến đi"}
            <span className="ml-2 text-xs font-normal text-neutral-400">
              ({filtered.length})
            </span>
          </h2>
        </div>

        {filtered.length === 0 ? (
          searchQuery ? (
            <div className="py-20 text-center">
              <p className="text-neutral-400 text-sm">
                Không tìm thấy album hoặc địa điểm phù hợp.
              </p>
            </div>
          ) : (
            <EmptyEvents onCreateEvent={onCreateEvent} />
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filtered.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                user={null}
                selected={selected.has(event.id)}
                onSelect={() => toggleSelect(event.id)}
                onClick={() => onOpenEvent(event.id)}
              />
            ))}
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
            <p className="text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm mb-5 leading-relaxed">
              Bạn có chắc muốn xóa <strong>{selected.size} sự kiện</strong> đã
              chọn? Toàn bộ ảnh bên trong cũng sẽ bị xóa vĩnh viễn.
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
