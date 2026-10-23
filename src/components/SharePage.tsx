import { useEffect, useMemo, useState } from "react"
import type { Photo, TravelEvent, User } from "../types"
import type { EventMemberRole } from "../api/share"
import { getShareInfo, getSharedPhotos, joinShareLink } from "../api/share"
import { mapEventResponse, mapPhotoResponse } from "../mappers"
import { useGoogleLoginPopup } from "../hooks/useGoogleLoginPopup"
import { formatDateRange, formatFileSize } from "../utils"
import PhotoMasonry from "./PhotoMasonry"
import Lightbox from "./Lightbox"

interface Props {
  token: string
  user: User | null
  theme: "light" | "dark"
  onToggleTheme: () => void
  onLogin: (token: string) => void
  onLoginError: (message: string) => void
  onToast: (type: "success" | "error" | "warning" | "info", msg: string) => void
}

/** Ảnh trong link chia sẻ không cần đăng nhập: gắn ?token= để backend cho phép tải ảnh/thumbnail. */
const withShareToken = (url: string | undefined, token: string) =>
  url
    ? `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`
    : url

const NO_SELECTION = new Set<string>()

const roleLabelVi: Record<EventMemberRole, string> = {
  EDITOR: "Biên tập viên",
  VIEWER: "Người xem",
}

export default function SharePage({
  token,
  user,
  theme,
  onToggleTheme,
  onLogin,
  onLoginError,
  onToast,
}: Props) {
  const [event, setEvent] = useState<TravelEvent | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [linkRole, setLinkRole] = useState<EventMemberRole>("VIEWER")
  const [state, setState] = useState<"loading" | "ready" | "error" | "auth_required">("loading")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [joining, setJoining] = useState(false)

  const { signIn, loading: signingIn } = useGoogleLoginPopup({
    onSuccess: onLogin,
    onError: onLoginError,
  })

  useEffect(() => {
    let cancelled = false
    setState("loading")
    Promise.all([getShareInfo(token), getSharedPhotos(token, 0, 500)])
      .then(([info, page]) => {
        if (cancelled) return
        setEvent(mapEventResponse(info.event))
        setLinkRole(info.linkRole)
        setPhotos(
          page.content.map((dto) => {
            const p = mapPhotoResponse(dto)
            return {
              ...p,
              url: withShareToken(p.url, token) ?? p.url,
              previewUrl: withShareToken(p.previewUrl, token),
            }
          }),
        )
        setState("ready")
      })
      .catch((err: any) => {
        if (cancelled) return
        if (!user && err?.status === 403) {
          setState("auth_required")
        } else {
          setState("error")
        }
      })
    return () => {
      cancelled = true
    }
  }, [token, user])

  const totalSize = useMemo(
    () => photos.reduce((sum, p) => sum + p.size, 0),
    [photos],
  )

  const isAlreadyMember =
    user && event && event.userRole != null
  const isOwner =
    user && event && String(event.ownerId) === String(user.id)

  const handleJoin = async () => {
    setJoining(true)
    try {
      const eventId = await joinShareLink(token)
      window.location.assign(`/events/${eventId}`)
    } catch (err) {
      setJoining(false)
      onToast(
        "error",
        err instanceof Error ? err.message : "Không thể tham gia album này.",
      )
    }
  }

  const renderActionButton = () => {
    if (!event) return null

    if (isOwner) {
      return (
        <a
          href={`/events/${event.id}`}
          className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors inline-flex items-center"
        >
          Mở album của bạn
        </a>
      )
    }

    if (isAlreadyMember) {
      return (
        <a
          href={`/events/${event.id}`}
          className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors inline-flex items-center"
        >
          Đi đến album
        </a>
      )
    }

    if (user) {
      return (
        <button
          onClick={handleJoin}
          disabled={joining}
          className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60 cursor-pointer"
        >
          {joining ? "Đang tham gia…" : "Tham gia album"}
        </button>
      )
    }

    return (
      <button
        onClick={signIn}
        disabled={signingIn}
        className="h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60 cursor-pointer"
      >
        {signingIn ? "Đang xác thực…" : "Đăng nhập Google để tham gia"}
      </button>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Thanh trên */}
      <header
        data-glass="navbar"
        className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0b0b0c]/95 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80"
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <a
            href="/"
            className="font-black text-lg sm:text-xl tracking-tight text-neutral-900 dark:text-white flex items-center gap-1"
          >
            TravelPhoto
            <span className="inline-flex items-center gap-0.5 ml-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0063dc]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff0084]" />
            </span>
          </a>
          <div className="flex items-center gap-3">
            {user && (
              <a
                href="/"
                className="text-sm text-neutral-600 dark:text-neutral-300 hover:underline"
              >
                {user.name}
              </a>
            )}
            <button
              onClick={onToggleTheme}
              aria-label="Đổi giao diện sáng/tối"
              className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-screen-2xl w-full mx-auto px-4 sm:px-6 py-8">
        {state === "loading" && (
          <div className="flex justify-center py-24">
            <div className="w-8 h-8 border-2 border-[#0063dc] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {state === "auth_required" && (
          <div className="max-w-md mx-auto text-center py-24">
            <div className="text-4xl mb-3">🔒</div>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              Link này yêu cầu đăng nhập
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              Đây là link chia sẻ với quyền Cộng tác (Editor). Bạn cần đăng nhập
              để xem và tham gia album.
            </p>
            <button
              onClick={signIn}
              disabled={signingIn}
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
            >
              {signingIn ? "Đang xác thực…" : "Đăng nhập Google để tiếp tục"}
            </button>
          </div>
        )}

        {state === "error" && (
          <div className="max-w-md mx-auto text-center py-24">
            <div className="text-4xl mb-3">🔗</div>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              Link chia sẻ không hợp lệ hoặc đã hết hạn
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              Hãy nhờ người chia sẻ gửi lại link mới cho bạn.
            </p>
            <a
              href="/"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Về trang chủ
            </a>
          </div>
        )}

        {state === "ready" && event && (
          <>
            <div
              data-glass="panel"
              className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-[#18181b] p-5 sm:p-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  {event.createdBy
                    ? `${event.createdBy} đã chia sẻ album với bạn`
                    : "Album được chia sẻ với bạn"}
                </p>
                <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight truncate">
                  {event.name}
                </h1>
                {event.description && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 max-w-2xl">
                    {event.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  {event.location && <span>📍 {event.location}</span>}
                  <span>📅 {formatDateRange(event.startDate, event.endDate)}</span>
                  <span>
                    🖼️ {event.photoCount ?? photos.length} ảnh ·{" "}
                    {formatFileSize(event.totalSizeBytes ?? totalSize)}
                  </span>
                </div>
                {/* Role badge */}
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                      linkRole === "EDITOR"
                        ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                        : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                    }`}
                  >
                    {isOwner
                      ? "Chủ album"
                      : isAlreadyMember
                        ? `Đã tham gia · ${roleLabelVi[event.userRole === "editor" ? "EDITOR" : "VIEWER"]}`
                        : `Quyền khi tham gia: ${roleLabelVi[linkRole]}`}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0">{renderActionButton()}</div>
            </div>

            {photos.length === 0 ? (
              <p className="py-20 text-center text-sm text-neutral-500">
                Album chưa có ảnh nào.
              </p>
            ) : (
              <PhotoMasonry
                photos={photos}
                selectedIds={NO_SELECTION}
                onSelectPhoto={() => {}}
                onPhotoClick={(_photo, index) => setLightboxIndex(index)}
              />
            )}
          </>
        )}
      </main>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          location={event?.location}
          selected={NO_SELECTION}
          onToggleSelect={() => {}}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
