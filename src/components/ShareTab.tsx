import { useCallback, useEffect, useState } from "react"
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
}

export default function ShareTab({ eventId, onOpenShareModal }: Props) {
  const [links, setLinks] = useState<ShareLinkResponse[]>([])
  const [members, setMembers] = useState<MemberResponse[]>([])
  const [loading, setLoading] = useState(true)

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
  }, [refresh])

  const handleRevoke = async (linkId: number) => {
    await revokeShareLinkById(eventId, linkId)
    refresh()
  }

  const handleRemoveMember = async (userId: number) => {
    await removeMember(eventId, userId)
    refresh()
  }

  const handleChangeRole = async (userId: number, role: EventMemberRole) => {
    await changeMemberRole(eventId, userId, role)
    refresh()
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
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            + Tạo link mới
          </button>
        </div>

        {links.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Chưa có link chia sẻ nào.
          </p>
        ) : (
          <div className="space-y-2">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                      {roleLabel(link.role)}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {formatDate(link.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                    {link.shareUrl}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Hết hạn: {formatDate(link.expiredAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(link.id)}
                  className="shrink-0 text-xs text-red-500 hover:text-red-400 font-medium cursor-pointer"
                >
                  Thu hồi
                </button>
              </div>
            ))}
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
    </div>
  )
}
