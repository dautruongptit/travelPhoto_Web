import { useEffect, useRef, useState, useCallback } from "react"
import type { Photo, FlickrPhoto } from "../types"
import { formatFileSize, formatDate, displayUrl } from "../utils"
import AuthImg, { downloadAuthed } from "./AuthImg"

interface Props {
  photos: (Photo | FlickrPhoto)[]
  initialIndex: number
  location?: string
  photographerName?: string
  selected: Set<string>
  onToggleSelect: (id: string) => void
  onClose: () => void
}

const ZOOM_LEVELS = [1, 1.4, 1.8, 2.5]

export default function Lightbox({
  photos,
  initialIndex,
  location,
  photographerName,
  selected,
  onToggleSelect,
  onClose,
}: Props) {
  const [index, setIndex] = useState(initialIndex)
  const [zoomStep, setZoomStep] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})
  const stripRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)

  const photo = photos[index]
  const isSelected = selected.has(photo.id)
  const zoomed = zoomStep > 0
  const isLiked =
    likedMap[photo.id] ?? ("isLiked" in photo ? Boolean(photo.isLiked) : false)

  const prev = useCallback(() => {
    setZoomStep(0)
    setIndex((i) => Math.max(0, i - 1))
  }, [])

  const next = useCallback(() => {
    setZoomStep(0)
    setIndex((i) => Math.min(photos.length - 1, i + 1))
  }, [photos.length])

  const zoomIn = () =>
    setZoomStep((z) => Math.min(ZOOM_LEVELS.length - 1, z + 1))
  const zoomOut = () => setZoomStep((z) => Math.max(0, z - 1))

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev()
      else if (e.key === "ArrowRight") next()
      else if (e.key === "Escape") onClose()
      else if (e.key.toLowerCase() === "i") setShowInfo((v) => !v)
      else if (e.key === "+" || e.key === "=") zoomIn()
      else if (e.key === "-") zoomOut()
      else if (e.key.toLowerCase() === "f") {
        // Toggle like shortcut
        setLikedMap((m) => ({ ...m, [photo.id]: !m[photo.id] }))
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [prev, next, onClose, photo?.id])

  // Cuộn thanh thumbnail tới ảnh hiện tại
  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    const thumb = strip.children[index] as HTMLElement
    if (thumb) {
      thumb.scrollIntoView({
        block: "nearest",
        inline: "center",
        behavior: "smooth",
      })
    }
  }, [index])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(dx) > 50) {
      if (dx > 0) next()
      else prev()
    }
  }

  const toggleLike = () => {
    setLikedMap((m) => ({ ...m, [photo.id]: !isLiked }))
  }

  // Mock / read camera EXIF data
  const flickrPhoto = photo as FlickrPhoto
  const camera = flickrPhoto.cameraModel || "Sony Alpha 7 IV"
  const focalLength = flickrPhoto.focalLength || "35mm"
  const aperture = flickrPhoto.fNumber || "f/2.8"
  const shutter = flickrPhoto.shutterSpeed || "1/500s"
  const iso = flickrPhoto.iso || 100

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#0b0b0c] text-white flex flex-col fade-in select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 h-14 bg-black/60 backdrop-blur-md border-b border-neutral-800/60 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Đóng (Esc)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-semibold truncate max-w-[45vw] text-neutral-100">
              {photo.name}
            </h2>
            <p className="text-[11px] text-neutral-400">
              {index + 1} / {photos.length} · by{" "}
              <span className="text-neutral-200">
                {photographerName || photo.uploadedBy || "Thành viên"}
              </span>
            </p>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Select Toggle Button */}
          <button
            onClick={() => onToggleSelect(photo.id)}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium transition-all cursor-pointer ${
              isSelected
                ? "bg-[#0063dc] text-white shadow-sm"
                : "bg-white/10 text-neutral-300 hover:text-white hover:bg-white/20"
            }`}
          >
            {isSelected ? (
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
              <span className="w-3 h-3 rounded-[2px] border border-neutral-400" />
            )}
            <span className="hidden sm:inline">
              {isSelected ? "Đã chọn" : "Chọn ảnh"}
            </span>
          </button>

          {/* Like Button (Flickr Pink) */}
          <button
            onClick={toggleLike}
            className={`h-8 px-3 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isLiked
                ? "bg-[#ff0084] text-white shadow-sm"
                : "bg-white/10 text-neutral-300 hover:text-white hover:bg-white/20"
            }`}
            title="Thích ảnh (F)"
          >
            <svg
              className={`w-3.5 h-3.5 ${isLiked ? "text-white" : ""}`}
              viewBox="0 0 24 24"
              fill={isLiked ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span className="hidden sm:inline">
              {isLiked ? "Đã thích" : "Thích"}
            </span>
          </button>

          {/* Toggle EXIF Info Panel */}
          <button
            onClick={() => setShowInfo((v) => !v)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              showInfo
                ? "bg-white text-neutral-900"
                : "text-neutral-300 hover:text-white hover:bg-white/10"
            }`}
            title="Thông số kỹ thuật & EXIF (i)"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
            </svg>
          </button>

          {/* Zoom In / Out Controls */}
          <div className="hidden sm:flex items-center bg-white/10 rounded-full p-0.5">
            <button
              onClick={zoomOut}
              disabled={zoomStep === 0}
              className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Thu nhỏ (-)"
            >
              -
            </button>
            <span className="text-[10px] px-1 text-neutral-400 font-mono">
              {ZOOM_LEVELS[zoomStep]}x
            </span>
            <button
              onClick={zoomIn}
              disabled={zoomStep === ZOOM_LEVELS.length - 1}
              className="w-7 h-7 flex items-center justify-center rounded-full text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Phóng to (+)"
            >
              +
            </button>
          </div>

          {/* Direct Download Button */}
          <a
            href={photo.url}
            download={photo.name}
            onClick={(e) => {
              e.preventDefault()
              downloadAuthed(photo.url, photo.name).catch(() => {})
            }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-[#0063dc] hover:bg-[#0052b8] text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Tải ảnh gốc"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                d="M12 3v13M8 12l4 4 4-4M3 21h18"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden sm:inline">Tải về</span>
          </a>
        </div>
      </div>

      {/* Main View Area: Image + Optional EXIF Side Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Photo Center Canvas */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden p-2 sm:p-4">
          {/* Previous Arrow Button */}
          {index > 0 && (
            <button
              onClick={prev}
              aria-label="Ảnh trước"
              className="absolute left-4 z-10 w-11 h-11 flex items-center justify-center bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full text-white transition-all duration-150 hover:scale-105 border border-white/10 cursor-pointer"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  d="M15 18l-6-6 6-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}

          {/* Image Canvas */}
          <div
            className={`w-full h-full flex items-center justify-center transition-all duration-300 ${
              zoomed ? "cursor-zoom-out overflow-auto" : "cursor-zoom-in"
            }`}
            onClick={() => (zoomed ? setZoomStep(0) : zoomIn())}
          >
            <AuthImg
              key={photo.id}
              src={displayUrl(photo)}
              alt={photo.name}
              className="max-w-full max-h-full object-contain transition-transform duration-200 select-none drop-shadow-2xl"
              style={{
                transform: `scale(${ZOOM_LEVELS[zoomStep]})`,
              }}
              draggable={false}
            />
          </div>

          {/* Next Arrow Button */}
          {index < photos.length - 1 && (
            <button
              onClick={next}
              aria-label="Ảnh sau"
              className="absolute right-4 z-10 w-11 h-11 flex items-center justify-center bg-black/50 hover:bg-black/80 backdrop-blur-md rounded-full text-white transition-all duration-150 hover:scale-105 border border-white/10 cursor-pointer"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  d="M9 18l6-6-6-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Flickr EXIF & Metadata Right Drawer Panel */}
        {showInfo && (
          <aside className="w-80 sm:w-96 flex-shrink-0 bg-[#18181b]/95 backdrop-blur-xl border-l border-neutral-800 p-5 overflow-y-auto z-20 flex flex-col gap-6 slide-right">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-semibold text-sm text-neutral-100 flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0063dc"
                  strokeWidth="2"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Thông tin & EXIF
              </h3>
              <button
                onClick={() => setShowInfo(false)}
                className="text-neutral-400 hover:text-white text-xs cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>

            {/* Photo Title & Description */}
            <div>
              <h4 className="text-base font-bold text-white tracking-tight">
                {photo.name}
              </h4>
              <p className="text-xs text-neutral-400 mt-1">
                Tải lên vào {formatDate(photo.uploadedAt)} bởi{" "}
                <strong className="text-neutral-200">
                  {photo.uploadedBy || "Thành viên"}
                </strong>
              </p>
            </div>

            {/* Camera Specs / Settings (Flickr Signature Block) */}
            <div className="bg-[#222226] p-4 rounded-xl border border-neutral-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                <span>📷</span>
                <span>{camera}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-neutral-800/60 p-2.5 rounded-lg">
                  <p className="text-neutral-400 text-[10px] uppercase font-mono">
                    Tiêu cự
                  </p>
                  <p className="font-semibold text-neutral-200 mt-0.5">
                    {focalLength}
                  </p>
                </div>
                <div className="bg-neutral-800/60 p-2.5 rounded-lg">
                  <p className="text-neutral-400 text-[10px] uppercase font-mono">
                    Khẩu độ
                  </p>
                  <p className="font-semibold text-neutral-200 mt-0.5">
                    {aperture}
                  </p>
                </div>
                <div className="bg-neutral-800/60 p-2.5 rounded-lg">
                  <p className="text-neutral-400 text-[10px] uppercase font-mono">
                    Tốc độ màn trập
                  </p>
                  <p className="font-semibold text-neutral-200 mt-0.5">
                    {shutter}
                  </p>
                </div>
                <div className="bg-neutral-800/60 p-2.5 rounded-lg">
                  <p className="text-neutral-400 text-[10px] uppercase font-mono">
                    ISO
                  </p>
                  <p className="font-semibold text-neutral-200 mt-0.5">{iso}</p>
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
                <span className="text-neutral-400">Độ phân giải</span>
                <span className="font-mono text-neutral-200">
                  {photo.width} × {photo.height} px
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
                <span className="text-neutral-400">Dung lượng</span>
                <span className="font-mono text-neutral-200">
                  {formatFileSize(photo.size)}
                </span>
              </div>
              {location && (
                <div className="flex justify-between py-1.5 border-b border-neutral-800/80">
                  <span className="text-neutral-400">Địa điểm</span>
                  <span className="text-neutral-200 font-medium">
                    {location}
                  </span>
                </div>
              )}
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="mt-auto pt-4 border-t border-neutral-800 text-[11px] text-neutral-400 space-y-1">
              <p>
                Phím tắt:{" "}
                <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-mono">
                  ←
                </kbd>{" "}
                <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-mono">
                  →
                </kbd>{" "}
                chuyển ảnh
              </p>
              <p>
                <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-mono">
                  F
                </kbd>{" "}
                thích ·{" "}
                <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-mono">
                  I
                </kbd>{" "}
                bật/tắt EXIF ·{" "}
                <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded font-mono">
                  Esc
                </kbd>{" "}
                thoát
              </p>
            </div>
          </aside>
        )}
      </div>

      {/* Flickr Filmstrip Thumbnails Bar at Bottom */}
      <div className="h-16 flex-shrink-0 bg-black/80 backdrop-blur-md border-t border-neutral-800/60 px-4 flex items-center justify-center z-20">
        <div
          ref={stripRef}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full py-1"
        >
          {photos.map((ph, i) => (
            <button
              key={ph.id}
              onClick={() => {
                setZoomStep(0)
                setIndex(i)
              }}
              className={`relative flex-shrink-0 w-11 h-11 rounded-lg overflow-hidden border-2 transition-all duration-150 cursor-pointer ${
                i === index
                  ? "border-[#0063dc] scale-110 shadow-lg ring-1 ring-[#0063dc]"
                  : "border-transparent opacity-40 hover:opacity-90"
              }`}
            >
              <AuthImg
                src={displayUrl(ph)}
                alt={ph.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {selected.has(ph.id) && (
                <div className="absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-sm bg-[#0063dc] flex items-center justify-center">
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
