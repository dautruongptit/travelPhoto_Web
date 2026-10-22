import type { TravelEvent, User } from "../types"
import { formatDateRange } from "../utils"
import AuthImg from "./AuthImg"

interface Props {
  event: TravelEvent
  user: User | null
  selected?: boolean
  onSelect?: () => void
  onClick: () => void
}

function Tile({ src, alt, className }: { src?: string; alt: string; className: string }) {
  return (
    <div className={`overflow-hidden bg-neutral-200 dark:bg-neutral-800 ${className}`}>
      {src && (
        <AuthImg
          src={src}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
      )}
    </div>
  )
}

export default function EventCard({
  event,
  selected = false,
  onSelect,
  onClick,
}: Props) {
  const totalPhotos = event.photoCount ?? event.photos.length
  const thumbs = event.thumbnails ?? []

  return (
    <article
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl transition-all duration-200 ${
        selected ? "ring-2 ring-[#0063dc] ring-offset-2 dark:ring-offset-[#0b0b0c]" : ""
      }`}
    >
      {/* Collage: 1 ảnh lớn bên trái + 2 ảnh nhỏ xếp dọc bên phải */}
      <div
        className="relative grid grid-cols-3 grid-rows-2 gap-0.5 rounded-2xl overflow-hidden"
        style={{ aspectRatio: "3/2" }}
      >
        <Tile src={thumbs[0]} alt={event.name} className="col-span-2 row-span-2" />
        <Tile src={thumbs[1]} alt={event.name} className="" />
        <Tile src={thumbs[2]} alt={event.name} className="" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />

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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <span className="w-2.5 h-2.5 rounded-[2px]" />
            )}
          </button>
        )}
      </div>

      {/* Text */}
      <div className="pt-2.5 px-1">
        <p className="font-bold text-neutral-900 dark:text-neutral-100 text-base leading-tight truncate">
          {event.name}
        </p>
        <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1 truncate">
          {totalPhotos} ảnh
          {event.location ? ` · ${event.location}` : ""}
        </p>
        <p className="text-neutral-400 dark:text-neutral-500 text-xs mt-0.5 truncate">
          {formatDateRange(event.startDate, event.endDate)}
        </p>
      </div>
    </article>
  )
}
