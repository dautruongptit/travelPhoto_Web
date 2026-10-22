import type { TravelEvent, User } from "../types"
import {
  formatDateRange,
  formatTimeAgo,
  formatFileSize,
  formatTotalSize,
} from "../utils"
import AuthImg from "./AuthImg"

interface Props {
  event: TravelEvent
  user: User | null
  selected?: boolean
  onSelect?: () => void
  onClick: () => void
}

// Thẻ sự kiện theo thiết kế "Tất cả sự kiện": ảnh bìa 16:10, tên đè lên ảnh, số ảnh,
// bên dưới là địa điểm, mô tả (tối đa 2 dòng) và khoảng thời gian · thời điểm tạo.
export default function EventCard({
  event,
  selected = false,
  onSelect,
  onClick,
}: Props) {
  const totalPhotos = event.photoCount ?? event.photos.length
  const totalBytes =
    event.totalSizeBytes ?? event.photos.reduce((sum, p) => sum + p.size, 0)
  // Album chưa có ảnh bìa riêng thì dùng ảnh đầu tiên trong album
  const cover = event.thumbnails?.[0] ?? event.coverImage

  return (
    <article
      onClick={onClick}
      className={`group bg-white dark:bg-[#18181b] rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl hover:shadow-gray-200/60 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
        selected
          ? "border-blue-600 ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-[#0b0b0c]"
          : "border-gray-100 dark:border-neutral-800"
      }`}
    >
      {/* Cover */}
      <div
        className="relative overflow-hidden bg-gray-100 dark:bg-neutral-800"
        style={{ aspectRatio: "16/10" }}
      >
        <AuthImg
          src={cover}
          alt={event.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        {/* Select (top-left) */}
        {onSelect && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            title={selected ? "Bỏ chọn" : "Chọn sự kiện"}
            className={`absolute top-3 left-3 w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150 backdrop-blur-sm cursor-pointer ${
              selected
                ? "bg-blue-600 text-white opacity-100 scale-100"
                : "bg-black/40 text-white/90 border border-white/40 opacity-0 group-hover:opacity-100 scale-95 hover:scale-100"
            }`}
          >
            {selected ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span className="w-2.5 h-2.5 rounded-[2px]" />
            )}
          </button>
        )}

        {/* Photo count */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="2" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="white" />
            <path d="M21 15l-5-5L5 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {totalPhotos} ảnh · {totalBytes >= 1024 ** 3 ? formatTotalSize(totalBytes) : formatFileSize(totalBytes)}
        </div>

        {/* Thông tin đầy đủ trên ảnh bìa: tên, địa điểm, thời gian */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <p className="font-semibold text-base leading-tight truncate">
            {event.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-white/85">
            {event.location && (
              <span className="flex items-center gap-1 min-w-0">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                </svg>
                <span className="truncate">{event.location}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
              </svg>
              {formatDateRange(event.startDate, event.endDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {event.description && (
          <p className="text-gray-600 dark:text-neutral-300 text-sm leading-relaxed line-clamp-2 mb-3">
            {event.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-neutral-800 text-xs text-gray-400">
          <span>Tạo {formatTimeAgo(event.createdAt)}</span>
          <span>{event.createdBy}</span>
        </div>
      </div>
    </article>
  )
}
