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
}

export default function ShareModal({
  event,
  onClose,
  onToast,
  onChanged,
}: Props) {
  // null = chưa biết trạng thái thật từ server -> công tắc bị khóa (không đoán "riêng tư")
  const [isPublic, setIsPublic] = useState<boolean | null>(null)
  const [existingLinks, setExistingLinks] = useState<ShareLinkResponse[]>([])
  const [linksLoaded, setLinksLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    getEvent(Number(event.id))
      .then((dto) => {
        if (!cancelled && dto.visibility) setIsPublic(dto.visibility === "public")
      })
      .catch(() => {})

    listShareLinks(Number(event.id))
      .then((links) => {
        if (!cancelled) {
          setExistingLinks(links)
          setLinksLoaded(true)
        }
      })
      .catch(() => {
        if (!cancelled) setLinksLoaded(false)
      })

    return () => {
      cancelled = true
    }
  }, [event.id])

  const liveLinks = existingLinks.filter(
    (l) => l.active && new Date(l.expiredAt).getTime() > Date.now(),
  )
  const hasViewerLink = liveLinks.some((l) => l.role === "VIEWER")
  const hasEditorLink = liveLinks.some((l) => l.role === "EDITOR")

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

  const [shareUrl, setShareUrl] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)

  const handleGenerateLink = async () => {
    setLoading(true)

    try {
      const res = await createShareLink(Number(event.id), role)

      setShareUrl(res.shareUrl)

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
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="slide-up relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                Chia sẻ sự kiện
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {event.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xl"
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Mọi người đã đăng nhập đều xem được album này (chỉ xem, không
                sửa hay xóa).
              </p>
              {isPublic === null && (
                <p className="text-xs text-amber-600 mt-1">
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
              className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors disabled:opacity-50 cursor-pointer ${
                isPublic ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  isPublic ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          {!shareUrl ? (
            <div className="space-y-4">
              {!linksLoaded && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
                  Không thể kiểm tra link hiện có. Thử tải lại trang.
                </div>
              )}
              {linksLoaded && hasViewerLink && hasEditorLink && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-300">
                  Đã tạo đủ link cho cả 2 quyền. Thu hồi link cũ trong tab Chia sẻ để tạo link mới.
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Vai trò của người nhận liên kết
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={hasViewerLink}
                    onClick={() => setRole("VIEWER")}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      hasViewerLink
                        ? "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
                        : role === "VIEWER"
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/10"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold ${
                        hasViewerLink
                          ? "text-gray-400 dark:text-gray-500"
                          : role === "VIEWER"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-900 dark:text-white"
                      }`}
                    >
                      Chỉ xem (Viewer)
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {hasViewerLink
                        ? "Đã có link cho quyền này"
                        : "Chỉ được xem ảnh, không có quyền tải ảnh lên hoặc chỉnh sửa."}
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={hasEditorLink}
                    onClick={() => setRole("EDITOR")}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      hasEditorLink
                        ? "border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed"
                        : role === "EDITOR"
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/10"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold ${
                        hasEditorLink
                          ? "text-gray-400 dark:text-gray-500"
                          : role === "EDITOR"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-gray-900 dark:text-white"
                      }`}
                    >
                      Cộng tác (Editor)
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {hasEditorLink
                        ? "Đã có link cho quyền này"
                        : "Được quyền tải ảnh lên và cộng tác đóng góp album. Yêu cầu đăng nhập."}
                    </p>
                  </button>
                </div>
              </div>

              <button
                type="button"
                disabled={loading || !linksLoaded || (role === "VIEWER" && hasViewerLink) || (role === "EDITOR" && hasEditorLink)}
                onClick={handleGenerateLink}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200/50 dark:shadow-none flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
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

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[280px]">
                Quét mã QR bằng ứng dụng camera hoặc Zalo để truy cập trực tiếp
                sự kiện.
              </p>

              {/* Share link input and Copy */}
              <div className="w-full flex items-center gap-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2 pl-3">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent text-xs text-gray-700 dark:text-gray-300 focus:outline-none select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0"
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

              {/* Reset link option */}
              <button
                type="button"
                onClick={() => setShareUrl(null)}
                className="text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
              >
                Tạo cấu hình chia sẻ khác
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
