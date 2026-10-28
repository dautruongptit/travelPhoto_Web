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
  isEmbedded?: boolean
}

export default function ShareTab({
  eventId,
  onOpenShareModal,
  onToast,
  refreshTrigger,
  isEmbedded = false,
}: Props) {
  const [links, setLinks] = useState<ShareLinkResponse[]>([])
  const [members, setMembers] = useState<MemberResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [qrModalLink, setQrModalLink] = useState<ShareLinkResponse | null>(null)
  const [confirmRevokeLink, setConfirmRevokeLink] = useState<ShareLinkResponse | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const [l, m] = await Promise.all([
        listShareLinks(eventId),
        listMembers(eventId),
      ])
      setLinks(l)
      setMembers(m)
    } catch {
      // ignore
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
        "Liên kết đã được tạo trước đó. Bạn có thể thu hồi và bấm '+ Tạo link mới' để lấy link copy trực tiếp.",
      )
      return
    }
    navigator.clipboard.writeText(url)
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 2000)
    onToast?.("success", "Đã sao chép liên kết vào bộ nhớ tạm!")
  }

  const executeRevoke = async () => {
    if (!confirmRevokeLink) return
    setIsRevoking(true)
    try {
      await revokeShareLinkById(eventId, confirmRevokeLink.id)
      try {
        localStorage.removeItem(`share_token_${confirmRevokeLink.id}`)
      } catch {}
      onToast?.("success", "Đã thu hồi liên kết thành công.")
      setConfirmRevokeLink(null)
      refresh()
    } catch (err) {
      onToast?.(
        "error",
        err instanceof Error ? err.message : "Thu hồi liên kết thất bại.",
      )
    } finally {
      setIsRevoking(false)
    }
  }

  const handleRemoveMember = async (userId: number) => {
    try {
      await removeMember(eventId, userId)
      onToast?.("success", "Đã gỡ thành viên khỏi album.")
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
      onToast?.("success", "Đã cập nhật quyền thành viên.")
      refresh()
    } catch (err) {
      onToast?.(
        "error",
        err instanceof Error ? err.message : "Cập nhật quyền thất bại.",
      )
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-white/60 text-xs">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span>Đang tải thông tin chia sẻ...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${isEmbedded ? "" : "max-w-6xl mx-auto py-6"}`}>
      {/* 2 KHỐI CHÍNH: LIÊN KẾT & THÀNH VIÊN THEO PHONG CÁCH CASAOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (7 CỘT): QUẢN LÝ LIÊN KẾT CHIA SẺ */}
        <div className="lg:col-span-7 bg-[rgba(26,34,64,0.65)] backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Liên kết chia sẻ</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                    {links.length}
                  </span>
                </h4>
              </div>
            </div>

            <button
              onClick={onOpenShareModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold rounded-full shadow-md shadow-blue-600/25 transition-all cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Tạo link mới</span>
            </button>
          </div>

          {links.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/50 space-y-2">
              <p>Chưa có liên kết chia sẻ nào được tạo.</p>
              <button
                onClick={onOpenShareModal}
                className="text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer"
              >
                Bấm vào đây để tạo liên kết đầu tiên
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => {
                const url = getResolvedUrl(link)
                const isHidden = url.includes("[hidden]")
                const isCopied = copiedId === link.id

                return (
                  <div
                    key={link.id}
                    className="p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 transition-colors space-y-2.5"
                  >
                    {/* Hàng thông tin quyền & ngày */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {link.role === "EDITOR" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Biên tập viên
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Chỉ xem
                          </span>
                        )}
                        <span className="text-[11px] text-white/50">
                          Hạn: {formatDate(link.expiredAt)}
                        </span>
                      </div>

                      <button
                        onClick={() => setConfirmRevokeLink(link)}
                        className="text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Thu hồi
                      </button>
                    </div>

                    {/* Hàng đường link và nút thao tác */}
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-1.5 pl-3">
                      <input
                        type="text"
                        readOnly
                        value={url}
                        className="bg-transparent border-0 outline-none text-xs text-white/90 w-full truncate select-all"
                      />

                      <button
                        type="button"
                        onClick={() => handleCopy(link)}
                        disabled={isHidden}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                          isCopied
                            ? "bg-emerald-600 text-white"
                            : isHidden
                              ? "bg-white/10 text-white/40 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-500 text-white active:scale-95"
                        }`}
                      >
                        {isCopied ? "Đã chép!" : "Sao chép"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setQrModalLink(link)}
                        disabled={isHidden}
                        title="Xem mã QR"
                        className="p-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium shrink-0 cursor-pointer active:scale-95"
                      >
                        QR
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* CỘT PHẢI (5 CỘT): DANH SÁCH THÀNH VIÊN */}
        <div className="lg:col-span-5 bg-[rgba(26,34,64,0.65)] backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Thành viên</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                  {members.length}
                </span>
              </h4>
            </div>
          </div>

          {members.length === 0 ? (
            <div className="py-8 text-center text-xs text-white/40">
              Chưa có thành viên nào tham gia album này.
            </div>
          ) : (
            <div className="space-y-2.5">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-white/[0.04] border border-white/10"
                >
                  {m.avatarUrl ? (
                    <img
                      src={m.avatarUrl}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {m.userName?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">
                      {m.userName}
                    </p>
                    <p className="text-[11px] text-white/50 truncate">
                      {m.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={m.role}
                      onChange={(e) =>
                        handleChangeRole(m.userId, e.target.value as EventMemberRole)
                      }
                      className="text-xs bg-black/50 border border-white/15 rounded-xl px-2 py-1 text-white/90 outline-none cursor-pointer"
                    >
                      <option value="VIEWER" className="bg-[#151a30] text-white">Chỉ xem</option>
                      <option value="EDITOR" className="bg-[#151a30] text-white">Biên tập</option>
                    </select>

                    <button
                      onClick={() => handleRemoveMember(m.userId)}
                      title="Gỡ thành viên"
                      className="p-1.5 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR MODAL */}
      {qrModalLink && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setQrModalLink(null)}
          />
          <div className="slide-up relative bg-[rgba(22,28,54,0.92)] backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl p-6 max-w-sm w-full text-center">
            <div className="flex items-center justify-between mb-4">
              <div className="text-left">
                <h4 className="text-sm font-bold text-white">
                  Mã QR truy cập
                </h4>
                <p className="text-xs text-blue-400 mt-0.5">
                  {qrModalLink.role === "EDITOR" ? "Quyền biên tập viên" : "Quyền chỉ xem"}
                </p>
              </div>
              <button
                onClick={() => setQrModalLink(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-xl inline-block my-2">
              <QRCodeSVG
                value={getResolvedUrl(qrModalLink)}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            <p className="text-xs text-white/60 mt-2 mb-5">
              Quét mã bằng Camera điện thoại hoặc Zalo để vào album.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  handleCopy(qrModalLink)
                  setQrModalLink(null)
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                Sao chép liên kết
              </button>
              <button
                type="button"
                onClick={() => setQrModalLink(null)}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-white/90 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM REVOKE MODAL */}
      {confirmRevokeLink && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => !isRevoking && setConfirmRevokeLink(null)}
          />
          <div className="slide-up relative bg-[rgba(22,28,54,0.92)] backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl p-6 max-w-sm w-full text-left">
            <h4 className="text-base font-bold text-white mb-2">
              Thu hồi liên kết chia sẻ?
            </h4>
            <p className="text-xs text-white/70 mb-5 leading-relaxed">
              Những ai đang có liên kết này sẽ không thể vào album được nữa. Bạn có chắc chắn muốn thu hồi?
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isRevoking}
                onClick={() => setConfirmRevokeLink(null)}
                className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 transition-all cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isRevoking}
                onClick={executeRevoke}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-xs font-semibold text-white transition-all cursor-pointer"
              >
                {isRevoking ? "Đang thu hồi..." : "Xác nhận thu hồi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
