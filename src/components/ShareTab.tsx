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
    setTimeout(() => setCopiedId(null), 2200)
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

  const executeRevoke = async () => {
    if (!confirmRevokeLink) return
    setIsRevoking(true)
    try {
      await revokeShareLinkById(eventId, confirmRevokeLink.id)
      try {
        localStorage.removeItem(`share_token_${confirmRevokeLink.id}`)
      } catch {}
      onToast?.("success", "Đã thu hồi liên kết chia sẻ thành công.")
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

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-white/60 text-xs">Đang tải cài đặt chia sẻ...</span>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: Quản lý liên kết chia sẻ (Links) */}
        <section className="lg:col-span-7 bg-[rgba(22,28,54,0.65)] backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl transition-all">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Liên kết chia sẻ</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {links.length}
                  </span>
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Tạo link bảo mật để mời bạn bè xem hoặc đóng góp ảnh
                </p>
              </div>
            </div>

            <button
              onClick={onOpenShareModal}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Tạo link mới</span>
            </button>
          </div>

          {/* Links List */}
          {links.length === 0 ? (
            <div className="py-14 text-center flex flex-col items-center justify-center px-4">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-inner">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">
                Chưa có liên kết chia sẻ nào
              </h4>
              <p className="text-xs text-white/50 max-w-sm mb-5 leading-relaxed">
                Tạo liên kết để gửi cho bạn bè hoặc gia đình cùng xem và đóng góp ảnh vào album này.
              </p>
              <button
                onClick={onOpenShareModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Tạo liên kết chia sẻ đầu tiên</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {links.map((link) => {
                const url = getResolvedUrl(link)
                const isHidden = url.includes("[hidden]")
                const isCopied = copiedId === link.id

                return (
                  <div
                    key={link.id}
                    className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-white/20 transition-all duration-200 flex flex-col gap-3 group"
                  >
                    {/* Hàng trên: Vai trò + Hạn dùng + Nút thu hồi */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {link.role === "EDITOR" ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                            Biên tập viên
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            Chỉ xem
                          </span>
                        )}

                        <span className="text-[11px] text-white/50 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Hạn: {formatDate(link.expiredAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-white/40 hidden sm:inline">
                          Tạo ngày {formatDate(link.createdAt)}
                        </span>
                        <button
                          onClick={() => setConfirmRevokeLink(link)}
                          title="Thu hồi liên kết này"
                          className="text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ml-1"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          <span>Thu hồi</span>
                        </button>
                      </div>
                    </div>

                    {/* Hàng dưới: Thanh liên kết + Nút Copy + Nút QR */}
                    <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-1.5 pl-3">
                      <svg className="text-white/40 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      <input
                        type="text"
                        readOnly
                        value={url}
                        title={url}
                        className="bg-transparent border-0 outline-none text-xs font-mono text-white/90 w-full truncate select-all"
                      />

                      <button
                        type="button"
                        onClick={() => handleCopy(link)}
                        disabled={isHidden}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                          isCopied
                            ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/30"
                            : isHidden
                              ? "bg-white/10 text-white/40 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20 active:scale-95"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Đã chép!</span>
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
                        title="Hiển thị mã QR để quét điện thoại"
                        className="p-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 text-xs font-medium flex items-center gap-1 transition-colors shrink-0 cursor-pointer active:scale-95"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        <span>QR</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* CỘT PHẢI: Quản lý thành viên & Hướng dẫn quyền (Members & Roles) */}
        <section className="lg:col-span-5 bg-[rgba(22,28,54,0.65)] backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col transition-all">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Thành viên</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {members.length}
                </span>
              </h3>
              <p className="text-xs text-white/50 mt-0.5">
                Những người đã truy cập và tham gia album
              </p>
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-3 flex-1">
            {members.length === 0 ? (
              <div className="py-12 text-center text-white/40 text-xs px-4">
                Chưa có thành viên nào tham gia album này qua liên kết chia sẻ.
              </div>
            ) : (
              members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 transition-colors"
                >
                  {m.avatarUrl ? (
                    <img
                      src={m.avatarUrl}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                      {m.userName?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">
                      {m.userName}
                    </p>
                    <p className="text-xs text-white/50 truncate">
                      {m.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={m.role}
                      onChange={(e) =>
                        handleChangeRole(m.userId, e.target.value as EventMemberRole)
                      }
                      className="text-xs bg-black/50 border border-white/15 rounded-xl px-2.5 py-1.5 text-white/90 focus:border-blue-500 outline-none cursor-pointer"
                    >
                      <option value="VIEWER" className="bg-[#151a30] text-white">Chỉ xem</option>
                      <option value="EDITOR" className="bg-[#151a30] text-white">Biên tập</option>
                    </select>

                    <button
                      onClick={() => handleRemoveMember(m.userId)}
                      title="Gỡ thành viên khỏi album"
                      className="p-1.5 text-white/40 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Permissions Info */}
          <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-white/50 space-y-2">
            <p className="font-semibold text-white/70">Quyền hạn trong album:</p>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
              <span><strong>Chỉ xem:</strong> Được xem toàn bộ ảnh trong album và tải ảnh gốc về máy.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
              <span><strong>Biên tập viên:</strong> Được tải thêm ảnh mới và đóng góp nội dung vào album.</span>
            </div>
          </div>
        </section>
      </div>

      {/* QR Code Modal */}
      {qrModalLink && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setQrModalLink(null)}
          />
          <div className="slide-up relative bg-[rgba(22,28,54,0.92)] backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl p-6 max-w-sm w-full text-center">
            <div className="flex items-center justify-between mb-4">
              <div className="text-left">
                <h4 className="text-base font-bold text-white">
                  Mã QR chia sẻ
                </h4>
                <p className="text-xs text-white/50 mt-0.5">
                  Quyền: <span className="font-semibold text-blue-400">{qrModalLink.role === "EDITOR" ? "Biên tập viên" : "Chỉ xem"}</span>
                </p>
              </div>
              <button
                onClick={() => setQrModalLink(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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

            <p className="text-xs text-white/60 mt-2 mb-5 leading-relaxed">
              Mở Camera điện thoại hoặc Zalo quét mã để truy cập album nhanh chóng.
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  handleCopy(qrModalLink)
                  setQrModalLink(null)
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-600/30 cursor-pointer active:scale-95"
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
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white/90 transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận thu hồi liên kết chia sẻ */}
      {confirmRevokeLink && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            onClick={() => !isRevoking && setConfirmRevokeLink(null)}
          />
          <div className="slide-up relative bg-[rgba(22,28,54,0.92)] backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl p-6 max-w-md w-full text-left">
            <div className="flex items-center gap-3.5 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  Thu hồi liên kết chia sẻ?
                </h4>
                <p className="text-xs text-white/50 mt-0.5">
                  Vô hiệu hóa liên kết này ngay lập tức
                </p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed mb-4">
              Bất kỳ ai đang sở hữu liên kết này sẽ <strong className="text-rose-400 font-semibold">không thể truy cập</strong> vào album được nữa. Bạn có chắc chắn muốn tiếp tục?
            </p>

            {/* Thông tin liên kết sắp thu hồi */}
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 mb-6 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50 text-[11px]">Quyền hạn:</span>
                <span className="font-semibold text-white/90">
                  {confirmRevokeLink.role === "EDITOR" ? "Biên tập viên" : "Chỉ xem"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50 text-[11px]">Hạn sử dụng:</span>
                <span className="text-white/70 text-[11px] font-mono">
                  {formatDate(confirmRevokeLink.expiredAt)}
                </span>
              </div>
              <div className="text-[11px] font-mono text-white/50 truncate pt-2 border-t border-white/5">
                {getResolvedUrl(confirmRevokeLink)}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isRevoking}
                onClick={() => setConfirmRevokeLink(null)}
                className="px-4 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isRevoking}
                onClick={executeRevoke}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-xs font-semibold text-white transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isRevoking ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang thu hồi...</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Xác nhận thu hồi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
