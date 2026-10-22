import { useEffect, useRef, useState, useCallback } from "react"
import type { Photo, FlickrPhoto } from "../types"
import { formatFileSize, displayUrl } from "../utils"
import AuthImg, { downloadAuthed } from "./AuthImg"

interface Props {
  photos: (Photo | FlickrPhoto)[]
  initialIndex: number
  location?: string
  photographerName?: string
  selected: Set<string>
  onToggleSelect: (id: string) => void
  onClose: () => void
  /** Mở ở chế độ trình chiếu tự động chuyển ảnh */
  autoPlay?: boolean
  /** Có thì hiện nút Chia sẻ (chỉ truyền cho chủ sự kiện) */
  onShare?: () => void
  /** Có thì hiện nút Xóa; nhận id ảnh đang xem */
  onDelete?: (photoId: string) => void
}

const ZOOM_LEVELS = [1, 1.4, 1.8, 2.5]

export default function Lightbox({
  photos,
  initialIndex,
  location,
  selected,
  onClose,
  autoPlay = false,
  onShare,
  onDelete,
}: Props) {
  const [index, setIndex] = useState(initialIndex)
  const [playing, setPlaying] = useState(autoPlay)
  const [zoomStep, setZoomStep] = useState(0)
  // Màn hình rộng: mở sẵn bảng Thông tin & EXIF khi xem ảnh (phím I để ẩn/hiện).
  const [showInfo, setShowInfo] = useState(() => window.innerWidth >= 1024)
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({})
  const stripRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)

  const photo = photos[index]
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
      else if (e.key === " ") {
        e.preventDefault()
        setPlaying((v) => !v)
      }
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

  // Trình chiếu: tự chuyển ảnh mỗi 4 giây, hết ảnh thì quay lại ảnh đầu
  useEffect(() => {
    if (!playing || photos.length < 2) return
    const timer = setInterval(() => {
      setZoomStep(0)
      setIndex((i) => (i + 1) % photos.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [playing, photos.length])

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

  // EXIF thật (nếu có). Không còn giá trị giả "Sony Alpha 7 IV / 35mm / f/2.8" nữa.
  const flickrPhoto = photo as FlickrPhoto
  const camera = flickrPhoto.cameraModel
  const focalLength = flickrPhoto.focalLength
  const aperture = flickrPhoto.fNumber
  const shutter = flickrPhoto.shutterSpeed
  const iso = flickrPhoto.iso
  const lens = flickrPhoto.lensModel
  const focal35 = flickrPhoto.focalLength35mm
  const takenAt = flickrPhoto.takenAt
  const hasExif = Boolean(
    camera || lens || focalLength || focal35 || aperture || shutter || iso,
  )
  const megapixels =
    photo.width && photo.height ? (photo.width * photo.height) / 1_000_000 : 0
  const mpLabel =
    megapixels > 0
      ? `${megapixels.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MP`
      : ""
  const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString("vi-VN", { dateStyle: "long", timeStyle: "short" })

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#0b0b0c] text-white flex flex-col fade-in select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header Bar: trái = Quay lại · phải = Chia sẻ, Phóng to, Thu nhỏ, Yêu thích, Xóa, Tải về, Thông tin */}
      <div className="flex items-center justify-between gap-4 px-3 sm:px-5 h-14 bg-black/60 backdrop-blur-md border-b border-neutral-800/60 z-40">
        {/* Trái: quay lại */}
        <button
          onClick={onClose}
          className="flex items-center gap-2 h-9 pl-2 pr-3.5 rounded-full text-neutral-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Quay lại (Esc)"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-medium">Quay lại</span>
        </button>

        {/* Giữa: tên ảnh + vị trí (ẩn trên màn hình nhỏ) */}
        <div className="hidden md:block min-w-0 text-center">
          <p className="text-sm font-medium truncate max-w-[40vw] text-neutral-100">
            {photo.name}
          </p>
          <p className="text-[11px] text-neutral-400">
            {playing ? (
              <span className="text-[#4da3ff]">
                ▶ Đang trình chiếu · Space để dừng ·{" "}
              </span>
            ) : null}
            {index + 1} / {photos.length}
          </p>
        </div>

        {/* Phải: các nút thao tác (có chú thích khi rê chuột) */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          {onShare && (
            <IconButton label="Chia sẻ" onClick={onShare}>
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
            </IconButton>
          )}

          <IconButton
            label="Phóng to (+)"
            onClick={zoomIn}
            disabled={zoomStep === ZOOM_LEVELS.length - 1}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
          </IconButton>

          <IconButton label="Thu nhỏ (-)" onClick={zoomOut} disabled={zoomStep === 0}>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35M8 11h6" />
          </IconButton>

          <IconButton
            label={isLiked ? "Bỏ yêu thích (F)" : "Yêu thích (F)"}
            onClick={toggleLike}
            active={isLiked}
            activeClass="text-[#ff0084]"
            fillWhenActive
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </IconButton>

          {onDelete && (
            <IconButton
              label="Xóa"
              onClick={() => onDelete(photo.id)}
              hoverClass="hover:text-red-400"
            >
              <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
            </IconButton>
          )}

          <IconButton
            label="Tải về (ảnh gốc)"
            onClick={() => downloadAuthed(photo.url, photo.name).catch(() => {})}
          >
            <path d="M12 3v13M8 12l4 4 4-4M4 21h16" />
          </IconButton>

          <IconButton
            label="Thông tin (I)"
            onClick={() => setShowInfo((v) => !v)}
            active={showInfo}
            activeClass="bg-white text-neutral-900 hover:text-neutral-900"
            align="right"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </IconButton>
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

            {/* Thông tin ảnh kiểu Google Photos: icon + dòng chính + dòng thông số */}
            <div className="space-y-5 text-sm">
              {/* Ngày chụp / ngày tải lên */}
              <InfoRow
                icon={
                  <>
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </>
                }
                title={takenAt ? fmtDateTime(takenAt) : fmtDateTime(photo.uploadedAt)}
                lines={[
                  takenAt
                    ? `Được chụp vào ${fmtDateTime(takenAt)}`
                    : "Không có ngày chụp trong ảnh",
                  `Được tải lên vào ${fmtDateTime(photo.uploadedAt)} bởi ${photo.uploadedBy || "Thành viên"}`,
                ]}
              />

              {/* Máy ảnh + thông số chụp */}
              {hasExif && (
                <InfoRow
                  icon={
                    <>
                      <circle cx="12" cy="12" r="10" />
                      <path d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94" />
                    </>
                  }
                  title={camera || "Không rõ máy ảnh"}
                  lines={[
                    [
                      aperture ? aperture.replace(/^f\//i, "ƒ/").replace(".", ",") : "",
                      shutter ? shutter.replace(/\s*sec$/i, "") : "",
                      focalLength ? focalLength.replace(/\s+/g, "").replace(".", ",") : "",
                      iso ? `ISO${iso}` : "",
                    ]
                      .filter(Boolean)
                      .join("   "),
                    [lens, focal35 ? `${focal35.replace(/\s+/g, " ")} (quy đổi 35mm)` : ""]
                      .filter(Boolean)
                      .join(" — "),
                  ]}
                />
              )}

              {/* Tên file + MP + kích thước */}
              <InfoRow
                icon={
                  <>
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </>
                }
                title={photo.name}
                lines={[
                  [
                    mpLabel,
                    photo.width && photo.height ? `${photo.width} × ${photo.height}` : "",
                  ]
                    .filter(Boolean)
                    .join("   "),
                ]}
              />

              {/* Dung lượng */}
              <InfoRow
                icon={
                  <>
                    <ellipse cx="12" cy="5" rx="8" ry="3" />
                    <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
                  </>
                }
                title={formatFileSize(photo.size)}
                lines={["Dung lượng file gốc"]}
              />

              {location && (
                <InfoRow
                  icon={
                    <>
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </>
                  }
                  title={location}
                  lines={["Địa điểm sự kiện"]}
                />
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

/** Một dòng thông tin có icon: dòng chính (đậm) + các dòng phụ nhỏ phía dưới (bỏ dòng rỗng). */
function InfoRow({
  icon,
  title,
  lines,
}: {
  icon: React.ReactNode
  title: string
  lines: string[]
}) {
  return (
    <div className="flex items-start gap-4">
      <svg
        className="w-5 h-5 mt-0.5 flex-shrink-0 text-neutral-300"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icon}
      </svg>
      <div className="min-w-0">
        <p className="text-neutral-100 font-medium break-words">{title}</p>
        {lines
          .filter((l) => l && l.trim() !== "" && l !== title)
          .map((l, i) => (
            <p key={i} className="text-xs text-neutral-400 mt-0.5 break-words">
              {l}
            </p>
          ))}
      </div>
    </div>
  )
}

/** Nút icon tròn có chú thích (tooltip) khi rê chuột hoặc focus bàn phím. */
function IconButton({
  label,
  onClick,
  disabled = false,
  active = false,
  activeClass = "bg-white text-neutral-900",
  hoverClass = "hover:text-white",
  fillWhenActive = false,
  align = "center",
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  active?: boolean
  activeClass?: string
  hoverClass?: string
  fillWhenActive?: boolean
  align?: "center" | "right"
  children: React.ReactNode
}) {
  return (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
          active
            ? activeClass
            : `text-neutral-300 hover:bg-white/10 ${hoverClass}`
        }`}
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill={active && fillWhenActive ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {children}
        </svg>
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-full mt-1.5 z-30 whitespace-nowrap rounded-md border border-white/10 bg-black/90 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${
          align === "right" ? "right-0" : "left-1/2 -translate-x-1/2"
        }`}
      >
        {label}
      </span>
    </div>
  )
}
