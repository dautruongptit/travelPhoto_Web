import { useCallback, useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import type {
  ShareLinkResponse,
  MemberResponse,
  EventMemberRole,
} from "../api/share"
import {
  listShareLinks,
  listMembers,
  removeMember,
  changeMemberRole,
  revokeShareLinkById,
} from "../api/share"

interface Props {
  eventId: number
  onOpenShareModal: () => void
  onToast?: (type: "success" | "error" | "warning" | "info", msg: string) => void
  refreshTrigger?: number
}

export default function ShareTab({
  eventId,
  onOpenShareModal,
  onToast,
  refreshTrigger,
}: Props) {
  const [links, setLinks] = useState<ShareLinkResponse[]>([])
  const [members, setMembers] = useState<MemberResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [qrModalLink, setQrModalLink] = useState<ShareLinkResponse | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [l, m] = await Promise.all([
        listShareLinks(eventId),
        listMembers(eventId),
      ])
      setLinks(l)
      setMembers(m)
    } catch {
      // ignore — endpoint may 403 if not owner
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    refresh()
  }, [refresh, refreshTrigger])

  const getResolvedUrl = (link: ShareLinkResponse): string => {
    if (link.shareUrl && !link.shareUrl.includes("[hidden]")) {
      return link.shareUrl
    }
    try {
      const byId = localStorage.getItem(`share_token_${link.id}`)
      if (byId) return byId
      const byRole = localStorage.getItem(`share_token_${eventId}_${link.role}`)
      if (byRole) return byRole
    } catch {}
    return link.shareUrl
  }

  const handleCopy = (link: ShareLinkResponse) => {
    const url = getResolvedUrl(link)
    if (url.includes("[hidden]")) {
      onToast?.(
        "warning",
        "Link này đã bị ẩn token để bảo mật. Hãy thu hồi và bấm '+ Tạo link mới' để lấy link có thể sao chép & quét QR.",
      )
      return
    }
    navigator.clipboard.writeText(url)
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 2000)
    onToast?.("success", "Đã sao chép liên kết chia sẻ vào bộ nhớ tạm!")
  }

  const handleRevoke = async (linkId: number) => {
    try {
      await revokeShareLinkById(eventId, linkId)
      try {
        localStorage.removeItem(`share_token_${linkId}`)
      } catch {}
      onToast?.("success", "Đã thu hồi liên kết chia sẻ.")
      refresh()
    } catch (err) {
      onToast?.(
        "error",
        err instanceof Error ? err.message : "Thu hồi liên kết thất bại.",
      )
    }
  }

  const handleRemoveMember = async (userId: number) => {
    try {
      await removeMember(eventId, userId)
      onToast?.("success", "Đã xóa thành viên khỏi album.")
      refresh()
    } catch (err) {
      onToast?.(
        "error",
        err instanceof Error ? err.message : "Xóa thành viên thất bại.",
      )
    }
  }

  const handleChangeRole = async (userId: number, role: EventMemberRole) => {
    try {
      await changeMemberRole(eventId, userId, role)
      onToast?.("success", "Đã cập nhật vai trò thành viên.")
      refresh()
    } catch (err) {
      onToast?.(
        "error",
        err instanceof Error ? err.message : "Cập nhật vai trò thất bại.",
      )
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const roleLabel = (r: EventMemberRole) =>
    r === "EDITOR" ? "Biên tập viên" : "Người xem"

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-8">
      {/* Share links */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
            Link chia sẻ
          </h3>
          <button
            onClick={onOpenShareModal}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>+ Tạo link mới</span>
          </button>
        </div>

        {links.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Chưa có link chia sẻ nào. Bấm <strong>+ Tạo link mới</strong> ở trên để tạo.
          </p>
        ) : (
          <div className="space-y-3">
            {links.map((link) => {
              const url = getResolvedUrl(link)
              const isHidden = url.includes("[hidden]")
              const isCopied = copiedId === link.id

              return (
                <div
                  key={link.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        {roleLabel(link.role)}
                      </span>
                      <span className="text-xs text-neutral-400">
                        Tạo ngày {formatDate(link.createdAt)}
                      </span>
                    </div>

                    <p
                      className="text-xs font-mono text-neutral-600 dark:text-neutral-300 truncate"
                      title={url}
                    >
                      {url}
                    </p>

                    <p className="text-[11px] text-neutral-400 mt-1">
                      Hết hạn: {formatDate(link.expiredAt)}
                    </p>
                  </div>

                  {/* Actions: Copy, QR, Thu hồi */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleCopy(link)}
                      disabled={isHidden}
                      title={isHidden ? "Link cũ đã ẩn token" : "Sao chép liên kết"}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        isCopied
                          ? "bg-green-600 text-white"
                          : isHidden
                            ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed opacity-60"
                            : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Đã chép</span>
                        </>
                      ) : (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setQrModalLink(link)}
                      disabled={isHidden}
                      title={isHidden ? "Link cũ đã ẩn token" : "Xem mã QR"}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                        isHidden
                          ? "border-neutral-200 dark:border-neutral-700 text-neutral-400 cursor-not-allowed opacity-60"
                          : "border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800"
                      }`}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </svg>
                      <span>QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRevoke(link.id)}
                      title="Thu hồi liên kết này"
                      className="px-2.5 py-1.5 rounded-lg text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium transition-colors cursor-pointer"
                    >
                      Thu hồi
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Members */}
      <section>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">
          Thành viên ({members.length})
        </h3>

        {members.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Chưa có thành viên nào tham gia.
          </p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700"
              >
                {m.avatarUrl ? (
                  <img
                    src={m.avatarUrl}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center text-xs font-bold text-white">
                    {m.userName?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                    {m.userName}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {m.email}
                  </p>
                </div>

                <select
                  value={m.role}
                  onChange={(e) =>
                    handleChangeRole(m.userId, e.target.value as EventMemberRole)
                  }
                  className="text-xs bg-transparent border border-neutral-300 dark:border-neutral-600 rounded-lg px-2 py-1 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                >
                  <option value="VIEWER">Người xem</option>
                  <option value="EDITOR">Biên tập viên</option>
                </select>

                <button
                  onClick={() => handleRemoveMember(m.userId)}
                  className="text-xs text-red-500 hover:text-red-400 font-medium cursor-pointer"
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* QR Code Modal for ShareTab */}
      {qrModalLink && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setQrModalLink(null)}
          />
          <div className="slide-up relative bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl p-6 max-w-sm w-full border border-neutral-200 dark:border-neutral-800 text-center">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold text-neutral-900 dark:text-white text-left">
                  Mã QR chia sẻ
                </h4>
                <p className="text-xs text-neutral-500 text-left mt-0.5">
                  Quyền: <span className="font-semibold text-blue-600 dark:text-blue-400">{roleLabel(qrModalLink.role)}</span>
                </p>
              </div>
              <button
                onClick={() => setQrModalLink(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-sm inline-block my-2">
              <QRCodeSVG
                value={getResolvedUrl(qrModalLink)}
                size={180}
                level="H"
                includeMargin={true}
              />
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 mb-4 leading-relaxed">
              Quét mã QR bằng Camera hoặc Zalo để truy cập album ngay lập tức.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  handleCopy(qrModalLink)
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Sao chép liên kết</span>
              </button>
              <button
                type="button"
                onClick={() => setQrModalLink(null)}
                className="py-2 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
