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
  eventName?: string
  onOpenShareModal: () => void
  onToast?: (type: "success" | "error" | "warning" | "info", msg: string) => void
  refreshTrigger?: number
  isEmbedded?: boolean
}

export default function ShareTab({
  eventId,
  eventName = "Album",
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
        "Liên kết đã được tạo trước đó. Hãy thu hồi và bấm '+ Tạo link mới' để lấy link copy trực tiếp.",
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

  const latestExpire = links.length > 0 ? formatDate(links[0].expiredAt) : null

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-white/60 text-xs">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span>Đang tải thông tin...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${isEmbedded ? "" : "max-w-screen-2xl mx-auto px-4 sm:px-6 py-6"}`}>
      {/* THẺ 1: LIÊN KẾT CHIA SẺ */}
      <div className="bg-[rgba(22,28,54,0.65)] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Liên kết chia sẻ
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                {links.length}
              </span>
            </div>
          </div>

          <button
            onClick={onOpenShareModal}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold rounded-full shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>+ Tạo link mới</span>
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
                  className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-3"
                >
                  {/* Hàng thông tin quyền & hạn dùng */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      {link.role === "EDITOR" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Biên tập viên
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Chỉ xem
                        </span>
                      )}
                      <span className="text-xs text-white/60 flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span>Hạn: {formatDate(link.expiredAt)}</span>
                      </span>
                    </div>

                    <button
                      onClick={() => setConfirmRevokeLink(link)}
                      className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-0.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                      </svg>
                      <span>Thu hồi</span>
                    </button>
                  </div>

                  {/* Thanh link + Nút Sao chép + Nút QR */}
                  <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl p-1.5 pl-3">
                    <svg className="text-white/40 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    <input
                      type="text"
                      readOnly
                      value={url}
                      className="bg-transparent border-0 outline-none text-xs text-white/90 w-full truncate select-all font-mono"
                    />

                    <button
                      type="button"
                      onClick={() => handleCopy(link)}
                      disabled={isHidden}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                        isCopied
                          ? "bg-emerald-600 text-white"
                          : isHidden
                            ? "bg-white/10 text-white/40 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-500 text-white active:scale-95 shadow-sm shadow-blue-600/30"
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>Đã chép!</span>
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                      title="Xem mã QR"
                      className="p-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-medium shrink-0 cursor-pointer active:scale-95"
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

      {/* THẺ 2: THÀNH VIÊN */}
      <div className="bg-[rgba(22,28,54,0.65)] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Thành viên
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/70">
              {members.length}
            </span>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="py-6 text-center text-xs text-white/40">
            Chưa có thành viên nào tham gia album này.
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-black/30 border border-white/10"
              >
                {m.avatarUrl ? (
                  <img
                    src={m.avatarUrl}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-cyan-500/30"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
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

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={m.role}
                    onChange={(e) =>
                      handleChangeRole(m.userId, e.target.value as EventMemberRole)
                    }
                    className="text-xs bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-white/90 outline-none cursor-pointer"
                  >
                    <option value="VIEWER" className="bg-[#151a30] text-white">Chỉ xem</option>
                    <option value="EDITOR" className="bg-[#151a30] text-white">Biên tập</option>
                  </select>

                  <button
                    onClick={() => handleRemoveMember(m.userId)}
                    title="Gỡ thành viên"
                    className="p-1.5 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

      {/* THẺ 3: BẢO MẬT & ĐỒNG BỘ LƯU TRỮ */}
      <div className="bg-[rgba(22,28,54,0.65)] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <h4 className="text-sm font-bold text-white tracking-tight">
              Bảo mật &amp; Đồng bộ lưu trữ
            </h4>
          </div>

          <span className="text-[11px] text-white/40 font-mono">
            NAS S3 v2.4
          </span>
        </div>

        <p className="text-xs text-white/70 leading-relaxed">
          Dữ liệu hình ảnh trong album <strong className="text-white">{eventName}</strong> đã được sao lưu an toàn trên hệ thống đám mây phân tán S3 Cloud. {latestExpire ? `Liên kết chia sẻ hiện đang có hiệu lực đến ngày ${latestExpire}.` : "Chưa có liên kết chia sẻ công khai nào."}
        </p>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-4 text-xs text-white/70">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Đã mã hóa đầu cuối
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              Sẵn sàng chia sẻ QR
            </span>
          </div>

          <button
            onClick={onOpenShareModal}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 transition-all cursor-pointer"
          >
            Cài đặt nâng cao
          </button>
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
