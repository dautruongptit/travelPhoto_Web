import type { TravelEvent, User } from "../types"
import { formatDateRange, formatTimeAgo } from "../utils"
import AuthImg from "./AuthImg"
import { badgeOf } from "../visibility"

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
  const badge = badgeOf(event.visibility)
  // Ưu tiên ảnh bìa riêng; chưa có thì dùng ảnh đầu tiên trong album
  const cover = event.hasCover
    ? event.coverImage
    : (event.thumbnails?.[0] ?? event.coverImage)

  return (
    <article
      onClick={onClick}
      className={`group flex flex-col h-full bg-white dark:bg-[#18181b] rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl hover:shadow-gray-200/60 dark:hover:shadow-none hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Huy hiệu quyền xem (top-left); ẩn khi rê chuột / đang chọn để nhường chỗ cho ô chọn */}
        <div
          className={`absolute top-3 left-3 transition-opacity duration-150 ${
            onSelect ? "group-hover:opacity-0" : ""
          } ${selected ? "opacity-0" : ""}`}
        >
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${badge.cls}`}>
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
          {totalPhotos}
        </div>

        {/* Event name */}
        <div className="absolute bottom-3 left-3">
          <p className="text-white font-semibold text-base leading-tight">
            {event.name}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" opacity=".5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          </svg>
          <span className="truncate">{event.location}</span>
        </div>

        {event.description && (
          <p className="text-gray-600 dark:text-neutral-300 text-sm leading-relaxed line-clamp-2 mb-3">
            {event.description}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
            </svg>
            {formatDateRange(event.startDate, event.endDate)}
          </div>
          <span className="text-xs text-gray-400">
            {formatTimeAgo(event.createdAt)}
          </span>
        </div>
      </div>
    </article>
  )
}
