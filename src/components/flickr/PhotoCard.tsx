import { useState } from "react"
import type { LayoutPhoto } from "../../hooks/useJustifiedLayout"
import AuthImg from "../AuthImg"
import { displayUrl, formatFileSize, formatDate } from "../../utils"

interface PhotoCardProps {
  photo: LayoutPhoto
  isSelected?: boolean
  onSelect?: () => void
  onClick: () => void
  onToggleLike?: (photoId: string, currentLiked: boolean) => void
}

export default function PhotoCard({
  photo,
  isSelected = false,
  onSelect,
  onClick,
  onToggleLike,
}: PhotoCardProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [liked, setLiked] = useState(Boolean(photo.isLiked))
  const [likesCount, setLikesCount] = useState(photo.likesCount || 0)

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextState = !liked
    setLiked(nextState)
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)))
    onToggleLike?.(photo.id, liked)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={photo.title || photo.name}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      onClick={onClick}
      style={{
        width: `${photo.computedWidth}px`,
        height: `${photo.computedHeight}px`,
      }}
      className={`group relative overflow-hidden bg-neutral-200 dark:bg-[#18181b] cursor-pointer select-none transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0063dc] ${
        isSelected
          ? "ring-2 ring-[#0063dc] ring-offset-2 dark:ring-offset-[#0b0b0c]"
          : ""
      }`}
    >
      {/* Skeleton Shimmer khi chờ ảnh */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800" />
      )}

      {/* Ảnh chính với lazy load và fade-in */}
      <AuthImg
        src={displayUrl(photo)}
        alt={photo.title || photo.name}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        className={`w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02] ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Checkbox chọn ảnh */}
      {onSelect && (
        <button
          type="button"
          aria-label={isSelected ? "Bỏ chọn ảnh" : "Chọn ảnh"}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          className={`absolute top-2 left-2 z-10 w-6 h-6 rounded flex items-center justify-center transition-all duration-150 backdrop-blur-sm cursor-pointer ${
            isSelected
              ? "bg-[#0063dc] text-white opacity-100 scale-100"
              : "bg-black/40 text-white/90 border border-white/40 opacity-0 group-hover:opacity-100 scale-95 hover:scale-100"
          }`}
        >
          {isSelected ? (
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <span className="w-2.5 h-2.5 rounded-[2px]" />
          )}
        </button>
      )}

      {/* Hover Overlay phong cách Flickr: Gradient từ đáy lên */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-3 pointer-events-none">
        {/* Nút hành động góc trên phải */}
        <div className="flex justify-end gap-1.5 pointer-events-auto">
          <button
            type="button"
            aria-label="Thích ảnh"
            onClick={handleLike}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-md cursor-pointer ${
              liked
                ? "bg-[#ff0084] text-white shadow-sm"
                : "bg-black/50 text-white/90 hover:bg-[#ff0084] hover:text-white"
            }`}
          >
            <svg
              className="w-4 h-4 transition-transform active:scale-125"
              viewBox="0 0 24 24"
              fill={liked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>

        {/* Thông tin ảnh ở đáy */}
        <div className="transform translate-y-1 group-hover:translate-y-0 transition-transform duration-200 pointer-events-auto">
          <h3 className="text-white text-sm font-medium tracking-tight truncate drop-shadow-sm">
            {photo.title || photo.name}
          </h3>
          <p className="text-[11px] text-neutral-300 mt-0.5 truncate">
            {formatFileSize(photo.size)}
            {photo.width && photo.height ? ` · ${photo.width}×${photo.height}` : ""}
            {photo.uploadedAt ? ` · ${formatDate(photo.uploadedAt)}` : ""}
          </p>
          <div className="flex items-center justify-between text-xs text-neutral-300 mt-1">
            <span className="truncate max-w-[65%] hover:text-white transition-colors">
              by{" "}
              <strong className="font-medium text-white">
                {photo.uploadedBy || "Thành viên"}
              </strong>
            </span>
            <div className="flex items-center gap-2.5 text-[11px] font-medium text-neutral-300">
              {likesCount > 0 && (
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3 text-[#ff0084]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  {likesCount}
                </span>
              )}
              {photo.commentsCount !== undefined && photo.commentsCount > 0 && (
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3 text-neutral-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {photo.commentsCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
