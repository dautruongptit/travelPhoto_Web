import type { Photo } from "../types"
import { formatFileSize, formatDate } from "../utils"
import AuthImg from "./AuthImg"

interface Props {
  photos: Photo[]
  selectedIds: Set<string>
  onSelectPhoto: (id: string) => void
  onPhotoClick: (photo: Photo, index: number) => void
}

/** Thumbnail nhỏ (JPEG ~480px); không có thì dùng ảnh hiển thị. */
function thumbUrl(p: Photo): string {
  const m = p.url.match(/^(.*\/api\/photos)\/download\/(\d+)(\?.*)?$/)
  return m ? `${m[1]}/${m[2]}/thumbnail${m[3] ?? ""}` : p.previewUrl || p.url
}

/** Danh sách dạng dòng (kiểu File Explorer): thumbnail nhỏ + tên + ngày chụp + kích thước. */
export default function PhotoList({
  photos,
  selectedIds,
  onSelectPhoto,
  onPhotoClick,
}: Props) {
  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
      {photos.map((photo, index) => {
        const selected = selectedIds.has(photo.id)
        return (
          <div
            key={photo.id}
            role="button"
            tabIndex={0}
            aria-label={photo.name}
            onClick={() => onPhotoClick(photo, index)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onPhotoClick(photo, index)
              }
            }}
            className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              selected
                ? "bg-blue-50 dark:bg-blue-950/30"
                : "hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
            }`}
          >
            {/* Chọn ảnh */}
            <button
              type="button"
              aria-label={selected ? "Bỏ chọn" : "Chọn ảnh"}
              onClick={(e) => {
                e.stopPropagation()
                onSelectPhoto(photo.id)
              }}
              className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${
                selected
                  ? "bg-blue-600 border-blue-600"
                  : "border-neutral-300 dark:border-neutral-600 hover:border-blue-400"
              }`}
            >
              {selected && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            {/* Thumbnail */}
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
              <AuthImg
                src={thumbUrl(photo)}
                alt={photo.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Tên + ngày chụp */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                {photo.name}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {formatDate(photo.takenAt ?? photo.uploadedAt)}
              </p>
            </div>

            {/* Kích thước */}
            <div className="hidden sm:block w-20 shrink-0 text-right text-xs text-neutral-500 dark:text-neutral-400">
              {formatFileSize(photo.size)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
