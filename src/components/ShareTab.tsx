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
        "Token đã bị ẩn để bảo mật. Hãy thu hồi và bấm '+ Generate Token' để khởi tạo token mới.",
      )
      return
    }
    navigator.clipboard.writeText(url)
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 2200)
    onToast?.("success", "Đã chép Access Token URL vào Clipboard!")
  }

  const executeRevoke = async () => {
    if (!confirmRevokeLink) return
    setIsRevoking(true)
    try {
      await revokeShareLinkById(eventId, confirmRevokeLink.id)
      try {
        localStorage.removeItem(`share_token_${confirmRevokeLink.id}`)
      } catch {}
      onToast?.("success", `Đã thu hồi thành công token #${confirmRevokeLink.id}`)
      setConfirmRevokeLink(null)
      refresh()
    } catch (err) {
      onToast?.(
        "error",
        err instanceof Error ? err.message : "Thu hồi token thất bại.",
      )
    } finally {
      setIsRevoking(false)
    }
  }

  const handleRemoveMember = async (userId: number) => {
    try {
      await removeMember(eventId, userId)
      onToast?.("success", `Đã thu hồi quyền truy cập của User #${userId}`)
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
      onToast?.("success", `Đã cập nhật chính sách IAM: [ROLE: ${role}]`)
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
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <span className="font-mono text-cyan-300/70 text-xs">
          FETCHING_ACCESS_CONTROL_POLICY...
        </span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${isEmbedded ? "" : "max-w-6xl mx-auto py-6"}`}>
      {/* SECTION HEADER (DEV HUD STYLE) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs font-bold text-white tracking-wider uppercase">
            // ACCESS_CONTROL_ENGINE & IAM
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            RBAC_ENABLED
          </span>
        </div>
        <div className="font-mono text-[11px] text-white/40 flex items-center gap-2">
          <span>ACTIVE_TOKENS: <strong className="text-white">{links.length}</strong></span>
          <span>·</span>
          <span>MEMBERS: <strong className="text-white">{members.length}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (7 CỘT): QUẢN LÝ ENDPOINTS & ACCESS TOKENS */}
        <section className="lg:col-span-7 bg-[rgba(15,20,38,0.72)] backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5">
          {/* Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner font-mono text-base font-bold">
                &gt;_
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Access Tokens &amp; Endpoints</span>
                  <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {links.length} ACTIVE
                  </span>
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Scoped Bearer Tokens và liên kết chia sẻ công khai
                </p>
              </div>
            </div>

            <button
              onClick={onOpenShareModal}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white font-mono text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/25 border border-blue-400/20 transition-all cursor-pointer shrink-0"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>+ GENERATE_TOKEN</span>
            </button>
          </div>

          {/* Danh sách Tokens */}
          {links.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center px-4 rounded-2xl bg-black/20 border border-white/5 font-mono">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 shadow-inner text-lg font-bold">
                {`{ }`}
              </div>
              <h4 className="text-xs font-semibold text-white/90 mb-1">
                // NO_ACTIVE_ACCESS_TOKENS
              </h4>
              <p className="text-[11px] text-white/40 max-w-sm mb-4 leading-relaxed">
                Chưa có mã token nào được tạo cho album này. Khởi tạo token để ủy quyền truy cập cho người dùng ngoài.
              </p>
              <button
                onClick={onOpenShareModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600/80 hover:bg-blue-600 text-white font-mono text-xs font-semibold rounded-xl transition-all cursor-pointer active:scale-95"
              >
                + GENERATE_FIRST_TOKEN
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {links.map((link) => {
                const url = getResolvedUrl(link)
                const isHidden = url.includes("[hidden]")
                const isCopied = copiedId === link.id

                return (
                  <div
                    key={link.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-black/35 hover:bg-black/50 border border-white/10 hover:border-cyan-500/30 transition-all duration-200 flex flex-col gap-3 group"
                  >
                    {/* Header dòng Token: Scope + Expiry + Revoke */}
                    <div className="flex items-center justify-between gap-2 flex-wrap font-mono text-[11px]">
                      <div className="flex items-center gap-2">
                        {link.role === "EDITOR" ? (
                          <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            [SCOPE: READ_WRITE]
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            [SCOPE: READ_ONLY]
                          </span>
                        )}

                        <span className="text-white/50 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          EXP: {formatDate(link.expiredAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-white/35 hidden sm:inline">
                          ID: #{link.id}
                        </span>
                        <button
                          onClick={() => setConfirmRevokeLink(link)}
                          title="Revoke access token"
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 px-2 py-0.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 font-mono"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          <span>REVOKE</span>
                        </button>
                      </div>
                    </div>

                    {/* Console Bar: Endpoint URL + Copy + QR */}
                    <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl p-1.5 pl-3">
                      <span className="font-mono text-[10px] text-cyan-400/70 select-none shrink-0 font-bold">
                        GET
                      </span>
                      <input
                        type="text"
                        readOnly
                        value={url}
                        title={url}
                        className="bg-transparent border-0 outline-none text-xs font-mono text-cyan-200/90 w-full truncate select-all"
                      />

                      <button
                        type="button"
                        onClick={() => handleCopy(link)}
                        disabled={isHidden}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                          isCopied
                            ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/30"
                            : isHidden
                              ? "bg-white/10 text-white/40 cursor-not-allowed"
                              : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20 active:scale-95"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>COPIED!</span>
                          </>
                        ) : (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                            <span>COPY</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setQrModalLink(link)}
                        disabled={isHidden}
                        title="Display QR Matrix"
                        className="p-1.5 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 text-xs font-mono font-medium flex items-center gap-1 transition-colors shrink-0 cursor-pointer active:scale-95"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

        {/* CỘT PHẢI (5 CỘT): IDENTITY & ACCESS MANAGEMENT (IAM) */}
        <section className="lg:col-span-5 bg-[rgba(15,20,38,0.72)] backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col gap-5">
          {/* Header Card */}
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner font-mono text-base font-bold">
              IAM
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Collaborators &amp; IAM</span>
                <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {members.length} PRINCIPALS
                </span>
              </h3>
              <p className="text-xs text-white/50 mt-0.5">
                Chính sách phân quyền tài khoản (RBAC)
              </p>
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-2.5 flex-1">
            {members.length === 0 ? (
              <div className="py-10 text-center text-white/40 font-mono text-xs px-4 rounded-2xl bg-black/20 border border-white/5">
                // NO_COLLABORATORS_REGISTERED
              </div>
            ) : (
              members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-black/30 hover:bg-black/50 border border-white/10 transition-colors"
                >
                  {m.avatarUrl ? (
                    <img
                      src={m.avatarUrl}
                      alt=""
                      className="w-8 h-8 rounded-xl object-cover ring-1 ring-white/15 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-xs font-mono font-bold text-white shadow-sm shrink-0">
                      {m.userName?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate flex items-center gap-1.5">
                      <span>{m.userName}</span>
                      <span className="text-[10px] font-mono text-white/35 font-normal">
                        #u_{m.userId}
                      </span>
                    </p>
                    <p className="text-[11px] font-mono text-white/50 truncate">
                      {m.email}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={m.role}
                      onChange={(e) =>
                        handleChangeRole(m.userId, e.target.value as EventMemberRole)
                      }
                      className="text-[11px] font-mono bg-black/60 border border-white/20 rounded-xl px-2 py-1 text-cyan-300 focus:border-cyan-400 outline-none cursor-pointer"
                    >
                      <option value="VIEWER" className="bg-[#0f1426] text-white">
                        ROLE: VIEWER
                      </option>
                      <option value="EDITOR" className="bg-[#0f1426] text-white">
                        ROLE: EDITOR
                      </option>
                    </select>

                    <button
                      onClick={() => handleRemoveMember(m.userId)}
                      title="Revoke collaborator access"
                      className="p-1.5 text-white/40 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors cursor-pointer"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RBAC Documentation Block */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 font-mono text-[11px] space-y-1.5">
            <p className="text-white/70 font-bold flex items-center gap-1">
              <span>// RBAC_PERMISSION_MATRIX</span>
            </p>
            <div className="space-y-1 text-white/50 text-[10px] leading-relaxed">
              <div className="flex items-start gap-1.5">
                <span className="text-cyan-400 shrink-0">• [VIEWER]:</span>
                <span>s3:GetObject, event:Read, download:FullAsset</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-purple-400 shrink-0">• [EDITOR]:</span>
                <span>s3:PutObject, s3:DeleteOwned, event:Contribute</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-400 shrink-0">• [OWNER]:</span>
                <span>full:AdministrativeAccess (*:*)</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* QR Code Modal (Dev Terminal Look) */}
      {qrModalLink && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setQrModalLink(null)}
          />
          <div className="slide-up relative bg-[rgba(15,20,38,0.92)] backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl p-6 max-w-sm w-full text-center">
            <div className="flex items-center justify-between mb-4 font-mono text-left">
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">
                  // ACCESS_POINT: QR_MATRIX
                </h4>
                <p className="text-[11px] text-cyan-300/80 mt-0.5">
                  SCOPE: {qrModalLink.role === "EDITOR" ? "READ_WRITE" : "READ_ONLY"}
                </p>
              </div>
              <button
                onClick={() => setQrModalLink(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl shadow-xl inline-block my-2 border border-white/20">
              <QRCodeSVG
                value={getResolvedUrl(qrModalLink)}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            <p className="font-mono text-[11px] text-white/50 mt-2 mb-4 leading-relaxed">
              Quét mã matrix để khởi tạo phiên truy cập trên thiết bị di động.
            </p>

            <div className="flex gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  handleCopy(qrModalLink)
                  setQrModalLink(null)
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-600/30 cursor-pointer active:scale-95"
              >
                <span>COPY_ENDPOINT_URL</span>
              </button>
              <button
                type="button"
                onClick={() => setQrModalLink(null)}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white/90 transition-colors cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận thu hồi Token (Dev Terminal Alert) */}
      {confirmRevokeLink && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => !isRevoking && setConfirmRevokeLink(null)}
          />
          <div className="slide-up relative bg-[rgba(15,20,38,0.95)] backdrop-blur-2xl border border-rose-500/30 rounded-3xl shadow-2xl p-6 max-w-md w-full text-left font-mono">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-inner text-base font-bold">
                !
              </div>
              <div>
                <h4 className="text-sm font-bold text-white tracking-wide">
                  // REVOKE_ACCESS_TOKEN
                </h4>
                <p className="text-[11px] text-rose-400 mt-0.5">
                  TOKEN_ID: #{confirmRevokeLink.id}
                </p>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed mb-4">
              Hành động này sẽ vô hiệu hóa token ngay lập tức trên toàn bộ API Gateway và CDN Edge. Người dùng đang sử dụng link này sẽ bị ngắt quyền truy cập (401 Unauthorized).
            </p>

            {/* Thông tin token code block */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 mb-5 text-[11px] space-y-1.5 text-white/80">
              <div className="flex justify-between">
                <span className="text-white/40">SCOPE:</span>
                <span className="text-cyan-300">{confirmRevokeLink.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">EXPIRES:</span>
                <span>{formatDate(confirmRevokeLink.expiredAt)}</span>
              </div>
              <div className="text-[10px] text-white/40 truncate pt-1 border-t border-white/5">
                {getResolvedUrl(confirmRevokeLink)}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isRevoking}
                onClick={() => setConfirmRevokeLink(null)}
                className="px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/80 transition-all cursor-pointer disabled:opacity-50"
              >
                ABORT
              </button>
              <button
                type="button"
                disabled={isRevoking}
                onClick={executeRevoke}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-xs font-semibold text-white transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isRevoking ? "REVOKING..." : "CONFIRM_REVOKE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
