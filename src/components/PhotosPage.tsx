import { useEffect, useMemo, useState } from "react"
import type { Photo, SortOption, TravelEvent } from "../types"
import { listPhotosByEvent } from "../api/photos"
import { mapPhotoResponse } from "../mappers"
import Lightbox from "./Lightbox"
import {
  PhotoCollection,
  SortDropdown,
  ViewModeButtons,
  sortPhotos,
  usePersistedViewMode,
} from "./photoView"

interface Props {
  events: TravelEvent[]
  searchQuery: string
}

type PhotoWithAlbum = Photo & { eventId: string; eventName: string }

const noop = () => {}
const EMPTY_SET: Set<string> = new Set()

/**
 * Tab "Photo": gom ảnh của TẤT CẢ album mà người dùng có quyền xem, mới nhất trước.
 * Ảnh của từng album lấy từ chính API đang dùng ở trang album (đúng phân quyền),
 * nên không cần endpoint riêng.
 */
export default function PhotosPage({ events, searchQuery }: Props) {
  const [photos, setPhotos] = useState<PhotoWithAlbum[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(0)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [sort, setSort] = useState<SortOption>("newest")
  const [viewMode, changeViewMode] = usePersistedViewMode()

  // Chỉ tải lại khi tập album thay đổi (không phụ thuộc ảnh đã nạp sẵn trong events)
  const eventKey = events.map((e) => `${e.id}:${e.photoCount ?? ""}`).join(",")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFailed(0)

    const withPhotos = events.filter((e) => (e.photoCount ?? 1) > 0)

    Promise.allSettled(
      withPhotos.map(async (e) => {
        const page = await listPhotosByEvent(Number(e.id), 0, 500)
        return page.content.map<PhotoWithAlbum>((dto) => ({
          ...mapPhotoResponse(dto),
          eventId: e.id,
          eventName: e.name,
        }))
      }),
    ).then((results) => {
      if (cancelled) return
      const all: PhotoWithAlbum[] = []
      let bad = 0
      for (const r of results) {
        if (r.status === "fulfilled") all.push(...r.value)
        else bad++
      }
      setPhotos(all)
      setFailed(bad)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventKey])

  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const list = q
      ? photos.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.eventName.toLowerCase().includes(q),
        )
      : photos
    return sortPhotos(list, sort)
  }, [photos, searchQuery, sort])

  const current = lightboxIndex !== null ? visible[lightboxIndex] : null

  return (
    <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <span className="w-1.5 h-4 bg-blue-500 rounded-full shadow-sm shadow-blue-500/50" />
          {searchQuery ? `Kết quả tìm kiếm "${searchQuery}"` : "Tất cả ảnh"}
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/70 border border-white/10">
            {visible.length}
          </span>
        </h2>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <ViewModeButtons viewMode={viewMode} onChange={changeViewMode} />
          <div className="ml-1.5">
            <SortDropdown sort={sort} onChange={setSort} />
          </div>
        </div>
      </div>

      {failed > 0 && !loading && (
        <p className="mb-4 text-sm text-red-400">
          Không tải được ảnh của {failed} album. Hãy tải lại trang để thử lại.
        </p>
      )}

      {loading ? (
        <div className="py-24 flex flex-col items-center gap-3 text-white/60 text-sm">
          <div className="w-7 h-7 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          Đang tải ảnh của bạn…
        </div>
      ) : visible.length === 0 ? (
        <div className="py-24 text-center text-white/60 text-sm">
          {searchQuery
            ? "Không tìm thấy ảnh phù hợp."
            : "Bạn chưa có ảnh nào. Tạo album và tải ảnh lên để bắt đầu."}
        </div>
      ) : (
        <PhotoCollection
          photos={visible}
          viewMode={viewMode}
          onPhotoClick={(_photo, index) => setLightboxIndex(index)}
        />
      )}

      {current && lightboxIndex !== null && (
        <Lightbox
          photos={visible}
          initialIndex={lightboxIndex}
          location={current.eventName}
          selected={EMPTY_SET}
          onToggleSelect={noop}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </main>
  )
}
