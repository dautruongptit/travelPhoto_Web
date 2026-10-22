import type { TravelEvent, User } from "../types"
import { formatDateRange, formatTimeAgo } from "../utils"
import AuthImg from "./AuthImg"

interface Props {
  event: TravelEvent
  user: User | null
  selected?: boolean
  onSelect?: () => void
  onClick: () => void
}

export default function EventCard({
  event,
  selected = false,
  onSelect,
  onClick,
}: Props) {
  const totalPhotos = event.photoCount ?? event.photos.length

  return (
    <article
      onClick={onClick}
      className={`group bg-white dark:bg-[#18181b] rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer ${
        selected
          ? "border-[#0063dc] ring-2 ring-[#0063dc] ring-offset-2 dark:ring-offset-[#0b0b0c]"
          : "border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm hover:shadow-md"
      }`}
    >
      {/* Cover */}
      <div
        className="relative overflow-hidden bg-neutral-100 dark:bg-neutral-800"
        style={{ aspectRatio: "16/10" }}
      >
        <AuthImg
          src={event.coverImage}
          alt={event.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Select badge (top-left) */}
        {onSelect && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            title={selected ? "Bỏ chọn" : "Chọn sự kiện"}
            className={`absolute top-3 left-3 w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150 backdrop-blur-sm cursor-pointer ${
              selected
                ? "bg-[#0063dc] text-white opacity-100 scale-100"
                : "bg-black/40 text-white/90 border border-white/40 opacity-0 group-hover:opacity-100 scale-95 hover:scale-100"
            }`}
          >
            {selected ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span className="w-2.5 h-2.5 rounded-[2px]" />
            )}
          </button>
        )}

        {/* Photo count badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-full border border-white/10">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path
              d="M21 15l-5-5L5 21"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{totalPhotos} ảnh</span>
        </div>

        {/* Event name on cover image */}
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-bold text-base sm:text-lg leading-tight drop-shadow-sm truncate">
            {event.name}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Location */}
        {event.location && (
          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-xs mb-2">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <p className="text-neutral-600 dark:text-neutral-300 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-3">
            {event.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400 dark:text-neutral-500">
          <div className="flex items-center gap-1">
            <svg
              width="12"
              height="12"
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
            <span>{formatDateRange(event.startDate, event.endDate)}</span>
          </div>
          <span>{formatTimeAgo(event.createdAt)}</span>
        </div>
      </div>
    </article>
  )
}
