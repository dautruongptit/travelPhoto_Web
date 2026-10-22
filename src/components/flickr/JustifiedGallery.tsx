import { useRef, useState, useEffect, useMemo } from "react"
import type { FlickrPhoto, Photo } from "../../types"
import {
  useJustifiedLayout,
  type LayoutRow,
  type LayoutPhoto,
} from "../../hooks/useJustifiedLayout"
import PhotoCard from "./PhotoCard"

interface JustifiedGalleryProps {
  photos: (FlickrPhoto | Photo)[]
  selectedIds?: Set<string>
  onSelectPhoto?: (id: string) => void
  onPhotoClick: (photo: FlickrPhoto | Photo, index: number) => void
  onToggleLike?: (photoId: string, currentLiked: boolean) => void
  targetRowHeight?: number
  gap?: number
  /** true khi ảnh của event đang được tải (hiện spinner thay vì "chưa có ảnh") */
  loading?: boolean
  /** justified: hàng cân bằng (mặc định) · grid: ô vuông đều nhau · large: ảnh lớn (ít ảnh mỗi hàng) */
  mode?: "justified" | "grid" | "large"
}

export default function JustifiedGallery({
  photos,
  selectedIds = new Set(),
  onSelectPhoto,
  onPhotoClick,
  onToggleLike,
  targetRowHeight = 240,
  gap = 4,
  loading = false,
  mode = "justified",
}: JustifiedGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>(0)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(Math.floor(entry.contentRect.width))
        }
      }
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const baseHeight = mode === "large" ? targetRowHeight * 2 : targetRowHeight
  const responsiveTargetHeight =
    containerWidth < 640 ? (mode === "large" ? 300 : 170) : baseHeight
  const responsiveGap = containerWidth < 640 ? 3 : gap

  const justifiedRows = useJustifiedLayout(photos, {
    containerWidth,
    targetRowHeight: responsiveTargetHeight,
    gap: responsiveGap,
  })

  // Kiểu lưới: ô vuông bằng nhau, số cột tự theo độ rộng khung (ô tối thiểu ~170px)
  const gridRows = useMemo<LayoutRow[]>(() => {
    if (mode !== "grid" || !containerWidth) return []
    const minCell = containerWidth < 640 ? 110 : 170
    const cols = Math.max(
      2,
      Math.floor((containerWidth + responsiveGap) / (minCell + responsiveGap)),
    )
    const cell = Math.floor((containerWidth - responsiveGap * (cols - 1)) / cols)
    const out: LayoutRow[] = []
    for (let i = 0; i < photos.length; i += cols) {
      const chunk: LayoutPhoto[] = photos.slice(i, i + cols).map((p) => ({
        ...p,
        computedWidth: cell,
        computedHeight: cell,
      }))
      out.push({ photos: chunk, height: cell })
    }
    return out
  }, [mode, containerWidth, responsiveGap, photos])

  const rows = mode === "grid" ? gridRows : justifiedRows

  let photoIndex = 0

  // Container (có ref cho ResizeObserver) phải LUÔN được render. Trước đây khi photos rỗng
  // (ảnh đang tải) component return sớm -> ref chưa gắn lúc effect chạy -> không bao giờ đo
  // được độ rộng -> khi ảnh về vẫn không vẽ gì cho tới lần mở lại thứ 2.
  return (
    <div
      ref={containerRef}
      className="w-full select-none"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: `${responsiveGap}px`,
      }}
    >
      {photos.length === 0 && (loading ? (
        <div className="py-24 flex justify-center">
          <div className="w-8 h-8 border-2 border-[#0063dc] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
      <div className="py-24 text-center">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-center text-neutral-400">
          <svg
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-base font-medium text-neutral-800 dark:text-neutral-200">
          Chưa có khoảnh khắc nào
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Hãy bắt đầu chia sẻ những bức ảnh tuyệt đẹp của bạn.
        </p>
      </div>
      ))}
      {rows.map((row, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="flex flex-nowrap"
          style={{ height: `${row.height}px`, gap: `${responsiveGap}px` }}
        >
          {row.photos.map((photo) => {
            const currentIndex = photoIndex++
            return (
              <PhotoCard
                key={photo.id}
                photo={photo}
                isSelected={selectedIds.has(photo.id)}
                onSelect={
                  onSelectPhoto ? () => onSelectPhoto(photo.id) : undefined
                }
                onClick={() => onPhotoClick(photo, currentIndex)}
                onToggleLike={onToggleLike}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
