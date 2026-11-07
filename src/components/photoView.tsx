import { useEffect, useRef, useState } from "react"
import type { FlickrPhoto, Photo, SortOption } from "../types"
import JustifiedGallery from "./flickr/JustifiedGallery"
import PhotoMasonry from "./PhotoMasonry"
import PhotoList from "./PhotoList"

/**
 * Cách xem ảnh dùng chung cho "Kho ảnh" của album và tab "Photo":
 * cùng bộ nút chế độ xem, cùng menu sắp xếp, cùng bộ hiển thị (masonry / lưới / hàng cân bằng /
 * ảnh lớn / danh sách) và cùng lựa chọn chế độ xem được ghi nhớ trên trình duyệt.
 */

export type ViewMode = "masonry" | "justified" | "grid" | "large" | "list"

const VIEW_MODE_KEY = "travelphoto-album-view"

export const SORT_LABELS: Record<SortOption, string> = {
  newest: "Mới nhất",
  oldest: "Cũ nhất",
  "name-az": "Tên A–Z",
  "name-za": "Tên Z–A",
}

export const VIEW_BUTTONS: {
  mode: ViewMode
  label: string
  icon: React.ReactNode
}[] = [
  {
    mode: "masonry",
    label: "Xếp gạch (giữ tỉ lệ ảnh)",
    icon: (
      <>
        <rect x="3" y="3" width="8" height="10" />
        <rect x="13" y="3" width="8" height="6" />
        <rect x="3" y="15" width="8" height="6" />
        <rect x="13" y="11" width="8" height="10" />
      </>
    ),
  },
  {
    mode: "grid",
    label: "Lưới ô vuông",
    icon: (
      <>
        <rect x="3" y="3" width="4.5" height="4.5" />
        <rect x="9.75" y="3" width="4.5" height="4.5" />
        <rect x="16.5" y="3" width="4.5" height="4.5" />
        <rect x="3" y="9.75" width="4.5" height="4.5" />
        <rect x="9.75" y="9.75" width="4.5" height="4.5" />
        <rect x="16.5" y="9.75" width="4.5" height="4.5" />
        <rect x="3" y="16.5" width="4.5" height="4.5" />
        <rect x="9.75" y="16.5" width="4.5" height="4.5" />
        <rect x="16.5" y="16.5" width="4.5" height="4.5" />
      </>
    ),
  },
  {
    mode: "justified",
    label: "Hàng cân bằng",
    icon: (
      <>
        <rect x="3" y="3" width="11" height="8" />
        <rect x="15.5" y="3" width="5.5" height="8" />
        <rect x="3" y="13" width="6" height="8" />
        <rect x="10.5" y="13" width="10.5" height="8" />
      </>
    ),
  },
  {
    mode: "large",
    label: "Ảnh lớn",
    icon: <rect x="4" y="4" width="16" height="16" rx="1" />,
  },
  {
    mode: "list",
    label: "Danh sách chi tiết",
    icon: (
      <>
        <rect x="3" y="4" width="4" height="4" rx="1" />
        <rect x="9" y="4.5" width="12" height="3" rx="1" />
        <rect x="3" y="10" width="4" height="4" rx="1" />
        <rect x="9" y="10.5" width="12" height="3" rx="1" />
        <rect x="3" y="16" width="4" height="4" rx="1" />
        <rect x="9" y="16.5" width="12" height="3" rx="1" />
      </>
    ),
  },
]

/** Chế độ xem đang chọn, nhớ lại giữa các lần mở (dùng chung cho album và tab Photo). */
export function usePersistedViewMode(): [ViewMode, (m: ViewMode) => void] {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_KEY)
      return saved === "grid" ||
        saved === "large" ||
        saved === "justified" ||
        saved === "list"
        ? saved
        : "masonry"
    } catch {
      return "masonry"
    }
  })

  const change = (m: ViewMode) => {
    setViewMode(m)
    try {
      localStorage.setItem(VIEW_MODE_KEY, m)
    } catch {
      // bỏ qua nếu trình duyệt chặn localStorage
    }
  }

  return [viewMode, change]
}

export function sortPhotos<T extends Photo>(list: T[], sort: SortOption): T[] {
  return [...list].sort((a, b) => {
    switch (sort) {
      case "newest":
        return (
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        )
      case "oldest":
        return (
          new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
        )
      case "name-az":
        return a.name.localeCompare(b.name)
      case "name-za":
        return b.name.localeCompare(a.name)
      default:
        return 0
    }
  })
}

/** Cụm nút chọn chế độ xem (chế độ đang chọn hiện xanh). */
export function ViewModeButtons({
  viewMode,
  onChange,
}: {
  viewMode: ViewMode
  onChange: (m: ViewMode) => void
}) {
  return (
    <>
      {VIEW_BUTTONS.map((b) => (
        <button
          key={b.mode}
          onClick={() => onChange(b.mode)}
          title={b.label}
          aria-label={b.label}
          aria-pressed={viewMode === b.mode}
          className={`btn btn-icon cursor-pointer ${
            viewMode === b.mode ? "btn-primary" : "btn-secondary"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            {b.icon}
          </svg>
        </button>
      ))}
    </>
  )
}

/** Nút + menu sắp xếp (Mới nhất / Cũ nhất / Tên A–Z / Tên Z–A). */
export function SortDropdown({
  sort,
  onChange,
}: {
  sort: SortOption
  onChange: (s: SortOption) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn btn-secondary cursor-pointer"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 6h18M7 12h10M11 18h2" strokeLinecap="round" />
        </svg>
        <span>{SORT_LABELS[sort]}</span>
      </button>

      {open && (
        <div
          data-glass="dropdown"
          className="slide-up absolute right-0 top-full mt-1.5 w-36 py-1 z-30 text-sm"
        >
          {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                onChange(s)
                setOpen(false)
              }}
              className={`w-full text-left px-3.5 py-2 transition-colors cursor-pointer ${
                sort === s
                  ? "text-blue-400 font-semibold bg-white/10"
                  : "text-white/80 hover:bg-white/10"
              }`}
            >
              {SORT_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const NO_SELECTION: Set<string> = new Set()

/** Hiển thị danh sách ảnh theo chế độ xem — giống hệt cách "Kho ảnh" của album hiển thị. */
export function PhotoCollection({
  photos,
  viewMode,
  onPhotoClick,
  loading = false,
}: {
  photos: (Photo | FlickrPhoto)[]
  viewMode: ViewMode
  onPhotoClick: (photo: Photo | FlickrPhoto, index: number) => void
  loading?: boolean
}) {
  if (viewMode === "masonry") {
    return (
      <PhotoMasonry
        photos={photos as Photo[]}
        selectedIds={NO_SELECTION}
        onPhotoClick={onPhotoClick}
      />
    )
  }

  if (viewMode === "list") {
    return (
      <PhotoList
        photos={photos as Photo[]}
        selectedIds={NO_SELECTION}
        onPhotoClick={onPhotoClick}
      />
    )
  }

  return (
    <JustifiedGallery
      photos={photos}
      onPhotoClick={onPhotoClick}
      targetRowHeight={250}
      gap={4}
      mode={viewMode}
      loading={loading}
    />
  )
}
