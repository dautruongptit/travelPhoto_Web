import { useState } from "react"
import type { Photo } from "../types"
import { formatFileSize, formatDate } from "../utils"
import AuthImg from "./AuthImg"

interface Props {
  photos: Photo[]
  selectedIds: Set<string>
  onSelectPhoto: (id: string) => void
  onPhotoClick: (photo: Photo, index: number) => void
}

/** Thumbnail nhỏ (JPEG ~480px) cho lưới; không có thì dùng ảnh hiển thị. Ảnh đầy đủ chỉ tải ở Lightbox. */
function thumbUrl(p: Photo): string {
  const m = p.url.match(/^(.*\/api\/photos)\/download\/(\d+)/)
  return m ? `${m[1]}/${m[2]}/thumbnail` : p.previewUrl || p.url
}

// Bố cục masonry kiểu thiết kế: CSS columns (class "photo-masonry"), mỗi ảnh giữ tỉ lệ gốc.
export default function PhotoMasonry({
  photos,
  selectedIds,
  onSelectPhoto,
  onPhotoClick,
}: Props) {
  return (
    <div className="photo-masonry">
      {photos.map((photo, index) => (
        <MasonryItem
          key={photo.id}
          photo={photo}
          selected={selectedIds.has(photo.id)}
          onSelect={() => onSelectPhoto(photo.id)}
          onClick={() => onPhotoClick(photo, index)}
        />
      ))}
    </div>
  )
}

function MasonryItem({
  photo,
  selected,
  onSelect,
  onClick,
}: {
  photo: Photo
  selected: boolean
  onSelect: () => void
  onClick: () => void
}) {
  const [loaded, setLoaded] = useState(false)
  const ratio =
    photo.width > 0 && photo.height > 0
      ? `${photo.width} / ${photo.height}`
      : undefined

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={photo.name}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      style={{ aspectRatio: loaded ? undefined : ratio }}
      className={`photo-item relative group cursor-pointer rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        selected ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-[#0b0b0c]" : ""
      }`}
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-300 to-neutral-200 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800" />
      )}
      <AuthImg
        src={thumbUrl(photo)}
        alt={photo.name}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full h-auto object-cover group-hover:scale-[1.03] transition-[transform,opacity] duration-300 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute inset-0 transition-all duration-200 ${
          selected ? "bg-blue-600/20" : "bg-black/0 group-hover:bg-black/30"
        }`}
      >
        {/* Chọn ảnh */}
        <div
          className={`absolute top-2 left-2 transition-opacity duration-200 ${
            selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        >
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              selected ? "bg-blue-600 border-blue-600" : "bg-white/80 border-white"
            }`}
          >
            {selected && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
        {/* Biểu tượng xem */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="white" strokeWidth="2" />
              <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="2" />
            </svg>
          </div>
        </div>
        {/* Thông tin */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <p className="text-white text-xs font-medium truncate">{photo.name}</p>
          <p className="text-white/70 text-[10px]">
            {formatFileSize(photo.size)} · {formatDate(photo.uploadedAt)}
          </p>
        </div>
      </div>
    </div>
  )
}
