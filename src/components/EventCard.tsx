import type { TravelEvent, User } from "../types"
import { formatDateRange } from "../utils"
import AuthImg from "./AuthImg"
import { badgeOf } from "../visibility"

interface Props {
  event: TravelEvent
  user: User | null
  selected?: boolean
  isLoading?: boolean
  onSelect?: () => void
  onClick: () => void
}

export default function EventCard({
  event,
  selected = false,
  isLoading = false,
  onSelect,
  onClick,
}: Props) {
  const totalPhotos = event.photoCount ?? event.photos.length
  const badge = badgeOf(event.visibility)
  // Ưu tiên ảnh bìa riêng; chưa có thì dùng ảnh đầu tiên trong album
  const cover = event.hasCover
    ? event.coverImage
    : (event.thumbnails?.[0] ?? event.coverImage)

  return (
    <article
      data-glass="event-card"
      onClick={onClick}
      className={`group flex flex-col h-full bg-white dark:bg-[#18181b] rounded-xl overflow-hidden border shadow-sm hover:shadow-xl hover:shadow-gray-200/60 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
        selected
          ? "border-blue-600 ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-[#0b0b0c]"
          : "border-gray-100 dark:border-neutral-800"
      }`}
    >
      {/* Cover image - Aspect ratio 16:10 compact chuẩn layout file */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-neutral-800">
        <AuthImg
          src={cover}
          alt={event.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Loading overlay khi đang tải ảnh album */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 z-10">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-white text-xs font-medium">Đang tải...</span>
          </div>
        )}

        {/* Huy hiệu quyền xem (top-left) */}
        <div
          className={`absolute top-2.5 left-2.5 transition-opacity duration-150 ${
            onSelect ? "group-hover:opacity-0" : ""
          } ${selected ? "opacity-0" : ""}`}
        >
          <span
            data-glass="chip"
            data-vis={event.visibility}
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}
          >
            {badge.label}
          </span>
        </div>

        {/* Select (top-left) */}
        {onSelect && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            title={selected ? "Bỏ chọn" : "Chọn sự kiện"}
            className={`absolute top-2.5 left-2.5 w-5 h-5 rounded flex items-center justify-center transition-all duration-150 backdrop-blur-sm cursor-pointer ${
              selected
                ? "bg-blue-600 text-white opacity-100 scale-100"
                : "bg-black/40 text-white/90 border border-white/40 opacity-0 group-hover:opacity-100 scale-95 hover:scale-100"
            }`}
          >
            {selected ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span className="w-2 h-2 rounded-[2px]" />
            )}
          </button>
        )}

        {/* Photo count badge (top-right) */}
        <div
          className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white bg-black/45 backdrop-blur-[6px]"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span>{totalPhotos}</span>
        </div>
      </div>

      {/* Content - Thân thẻ nhỏ gọn, sắc nét */}
      <div data-glass="event-body" className="p-3 sm:p-3.5 flex flex-col flex-1">
        {/* Tên sự kiện + icon */}
        <div className="flex items-center justify-between gap-1.5 mb-1">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <svg
              className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <h3 className="font-semibold text-sm sm:text-base leading-snug text-neutral-900 dark:text-white truncate">
              {event.name}
            </h3>
          </div>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="flex-shrink-0 text-neutral-400 transition-transform group-hover:translate-x-0.5"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>

        {/* Mô tả */}
        {event.description ? (
          <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1 mb-2 leading-relaxed">
            {event.description}
          </p>
        ) : (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 italic line-clamp-1 mb-2">
            Chưa có mô tả chuyến đi
          </p>
        )}

        {/* Địa điểm & Thời gian */}
        <div className="flex flex-col gap-1 mt-auto pt-2 border-t border-gray-100 dark:border-neutral-800/80 text-xs text-neutral-500 dark:text-neutral-400">
          {event.location && (
            <div className="flex items-center gap-1.5 truncate">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-neutral-400">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="truncate">{event.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 truncate">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 text-neutral-400">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="truncate">{formatDateRange(event.startDate, event.endDate)}</span>
          </div>
        </div>
      </div>
    </article>
  )
}
