import { useEffect, useState } from "react"

import { QRCodeSVG } from "qrcode.react"

import type { TravelEvent } from "../types"

import type { ShareLinkResponse } from "../api/share"
import { createShareLink, listShareLinks } from "../api/share"

import { getEvent, setEventPublic } from "../api/events"

interface Props {
  event: TravelEvent

  onClose: () => void

  onToast: (type: "success" | "error" | "warning" | "info", msg: string) => void

  /** Quyền xem của album đã đổi (đã tạo link / bật tắt công khai) */
  onChanged?: () => void

  /**
   * "share" (mặc định): quản lý link chia sẻ (tạo mới / xem QR).
   * "settings": chỉ xem cài đặt công khai — bỏ phần link/QR vì đã hiển thị
   * sẵn trong tab Chia sẻ, tránh lặp lại cùng 1 nội dung.
   */
  mode?: "share" | "settings"
}

export default function ShareModal({
  event,
  onClose,
  onToast,
  onChanged,
  mode = "share",
}: Props) {
  // null = chưa biết trạng thái thật từ server -> công tắc bị khóa (không đoán "riêng tư")
  const [isPublic, setIsPublic] = useState<boolean | null>(null)
  const [existingLinks, setExistingLinks] = useState<ShareLinkResponse[]>([])
  const [linksLoaded, setLinksLoaded] = useState(false)
  const [linksError, setLinksError] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  /** Link đầy đủ đã được lưu lúc tạo (server chỉ trả token thật 1 lần). */
  const getResolvedUrl = (link: ShareLinkResponse): string => {
    if (link.shareUrl && !link.shareUrl.includes("[hidden]")) {
      return link.shareUrl
    }
    try {
      const byId = localStorage.getItem(`share_token_${link.id}`)
      if (byId) return byId
      const byRole = localStorage.getItem(`share_token_${event.id}_${link.role}`)
      if (byRole) return byRole
    } catch {}
    return link.shareUrl
  }

  useEffect(() => {
    let cancelled = false

    getEvent(Number(event.id))
      .then((dto) => {
        if (!cancelled && dto.visibility) setIsPublic(dto.visibility === "public")
      })
      .catch(() => {})

    listShareLinks(Number(event.id))
      .then((links) => {
        if (cancelled) return
        setExistingLinks(links)
        setLinksLoaded(true)
        // Đã có 1 liên kết đang hoạt động -> mở thẳng màn QR + sao chép,
        // không hiện lại form tạo link (chỉ được phép 1 link/sự kiện).
        const live = links.find(
          (l) => l.active && new Date(l.expiredAt).getTime() > Date.now(),
        )
        if (live) {
          const url = getResolvedUrl(live)
          if (!url.includes("[hidden]")) setShareUrl(url)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLinksLoaded(false)
          setLinksError(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [event.id])

  const liveLinks = existingLinks.filter(
    (l) => l.active && new Date(l.expiredAt).getTime() > Date.now(),
  )
  // Mỗi sự kiện chỉ cho phép 1 liên kết chia sẻ hoạt động tại 1 thời điểm
  // (không phân biệt vai trò) — phải thu hồi link hiện tại mới tạo được link mới.
  const activeLink = liveLinks[0] ?? null
  const hasActiveLink = activeLink !== null

  const [savingPublic, setSavingPublic] = useState(false)

  const handleTogglePublic = async () => {
    if (isPublic === null) return

    const next = !isPublic

    setSavingPublic(true)

    try {
      await setEventPublic(Number(event.id), next)

      setIsPublic(next)

      onChanged?.()

      onToast(
        "success",
        next
          ? "Album đã công khai: mọi người đăng nhập đều xem được."
          : "Đã tắt công khai album.",
      )
    } catch (err) {
      onToast(
        "error",
        err instanceof Error ? err.message : "Không thể đổi chế độ công khai.",
      )
    } finally {
      setSavingPublic(false)
    }
  }

  const [role, setRole] = useState<"VIEWER" | "EDITOR">("VIEWER")

  const [loading, setLoading] = useState(false)

  const handleGenerateLink = async () => {
    setLoading(true)

    try {
      const res = await createShareLink(Number(event.id), role)

      setShareUrl(res.shareUrl)

      try {
        localStorage.setItem(`share_token_${res.id}`, res.shareUrl)
        localStorage.setItem(`share_token_${event.id}_${role}`, res.shareUrl)
      } catch {}

      const updatedLinks = await listShareLinks(Number(event.id))
      setExistingLinks(updatedLinks)
      setLinksLoaded(true)

      onChanged?.()

      onToast("success", "Đã tạo liên kết chia sẻ thành công!")
    } catch (err) {
      onToast(
        "error",
        err instanceof Error ? err.message : "Không thể tạo liên kết chia sẻ.",
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (!shareUrl) return

    navigator.clipboard.writeText(shareUrl)

    onToast("success", "Đã sao chép liên kết vào bộ nhớ tạm!")

    onClose()
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="slide-up relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                {mode === "settings" ? "Cài đặt nâng cao" : "Chia sẻ sự kiện"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {event.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-icon"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Công khai: mọi người đã đăng nhập xem được (chỉ đọc) */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                🌐 Công khai
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Mọi người đã đăng nhập đều xem được album này (chỉ xem, không
                sửa hay xóa).
              </p>
              {isPublic === null && (
                <p className="text-sm text-amber-600 mt-1">
                  Đang kiểm tra trạng thái hiện tại… (nếu không hiện, hãy tải lại
                  trang)
                </p>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPublic === true}
              aria-label="Công khai album"
              disabled={savingPublic || isPublic === null}
              onClick={handleTogglePublic}
              className="switch"
            >
              <span className="switch-thumb" />
            </button>
          </div>

          {mode === "settings" ? null : !shareUrl ? (
            <div className="space-y-4">
              {!linksLoaded && !linksError && (
                <div className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  Đang kiểm tra link hiện có…
                </div>
              )}
              {linksError && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
                  Không thể kiểm tra link hiện có. Thử tải lại trang.
                </div>
              )}
              {linksLoaded && hasActiveLink && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
                  Sự kiện này đã có 1 liên kết chia sẻ đang hoạt động (
                  {activeLink?.role === "EDITOR" ? "Cộng tác" : "Chỉ xem"}).
                  Mỗi sự kiện chỉ được phép 1 liên kết hoạt động — hãy thu hồi
                  link hiện tại trong tab Chia sẻ trước khi tạo link mới.
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Vai trò của người nhận liên kết
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={hasActiveLink}
                    onClick={() => setRole("VIEWER")}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      hasActiveLink
                        ? "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
                        : role === "VIEWER"
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/10"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold ${
                        hasActiveLink
                          ? "text-gray-400 dark:text-gray-500"
                          : role === "VIEWER"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-900 dark:text-white"
                      }`}
                    >
                      Chỉ xem (Viewer)
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {hasActiveLink
                        ? "Đã có liên kết đang hoạt động"
                        : "Chỉ được xem ảnh, không có quyền tải ảnh lên hoặc chỉnh sửa."}
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={hasActiveLink}
                    onClick={() => setRole("EDITOR")}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      hasActiveLink
                        ? "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
                        : role === "EDITOR"
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/10"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold ${
                        hasActiveLink
                          ? "text-gray-400 dark:text-gray-500"
                          : role === "EDITOR"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-900 dark:text-white"
                      }`}
                    >
                      Cộng tác (Editor)
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {hasActiveLink
                        ? "Đã có liên kết đang hoạt động"
                        : "Được quyền tải ảnh lên và cộng tác đóng góp album. Yêu cầu đăng nhập."}
                    </p>
                  </button>
                </div>
              </div>

              <button
                type="button"
                disabled={loading || !linksLoaded || hasActiveLink}
                onClick={handleGenerateLink}
                className="btn btn-primary w-full disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                    Tạo liên kết chia sẻ
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-6">
              {/* QR Code Container */}
              <div className="p-4 bg-white dark:bg-white rounded-3xl border border-gray-100 shadow-md">
                <QRCodeSVG
                  value={shareUrl}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-[280px]">
                Quét mã QR bằng ứng dụng camera hoặc Zalo để truy cập trực tiếp
                sự kiện.
              </p>

              {/* Share link input and Copy */}
              <div className="w-full flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2 pl-3">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 min-w-0 bg-transparent text-xs text-gray-700 dark:text-gray-300 focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="btn btn-primary btn-sm flex-shrink-0"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="9"
                      y="9"
                      width="13"
                      height="13"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    />
                  </svg>
                  Sao chép
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
