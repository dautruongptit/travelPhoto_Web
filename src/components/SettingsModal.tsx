import { useState } from "react"

import type { User } from "../types"

interface Props {
  user: User

  theme: "light" | "dark"

  onToggleTheme: () => void

  onClose: () => void

  onLogout: () => void

  onToast: (type: "success" | "info", message: string) => void
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      className="switch"
    >
      <span className="switch-thumb" />
    </button>
  )
}

function Row({
  title,
  desc,
  right,
}: {
  title: string
  desc?: string
  right: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
          {title}
        </p>
        {desc && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {desc}
          </p>
        )}
      </div>
      {right}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mt-5 mb-1 first:mt-0">
      {children}
    </h3>
  )
}

export default function SettingsModal({
  user,
  theme,
  onToggleTheme,
  onClose,
  onLogout,
  onToast,
}: Props) {
  const [emailOnUpload, setEmailOnUpload] = useState(true)

  const [weeklyDigest, setWeeklyDigest] = useState(false)

  const [publicByDefault, setPublicByDefault] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="slide-up relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
            Cài đặt
          </h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-gray-100 dark:divide-gray-800">
          <div>
            <SectionTitle>Giao diện</SectionTitle>
            <Row
              title="Chế độ tối"
              desc="Chuyển giao diện sáng/tối cho toàn bộ ứng dụng"
              right={
                <Toggle checked={theme === "dark"} onChange={onToggleTheme} />
              }
            />
          </div>

          <div>
            <SectionTitle>Thông báo</SectionTitle>
            <Row
              title="Email khi có ảnh mới"
              desc="Nhận email khi thành viên khác tải ảnh lên sự kiện"
              right={
                <Toggle
                  checked={emailOnUpload}
                  onChange={() => setEmailOnUpload((v) => !v)}
                />
              }
            />
            <Row
              title="Bản tin hàng tuần"
              desc="Tổng hợp hoạt động album mỗi tuần"
              right={
                <Toggle
                  checked={weeklyDigest}
                  onChange={() => setWeeklyDigest((v) => !v)}
                />
              }
            />
          </div>

          <div>
            <SectionTitle>Quyền riêng tư</SectionTitle>
            <Row
              title="Công khai sự kiện mới mặc định"
              desc="Người có link đều xem được, không cần đăng nhập"
              right={
                <Toggle
                  checked={publicByDefault}
                  onChange={() => setPublicByDefault((v) => !v)}
                />
              }
            />
          </div>

          <div>
            <SectionTitle>Tài khoản</SectionTitle>
            <Row
              title="Email"
              desc={user.email}
              right={
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Qua Google
                </span>
              }
            />
            <button
              onClick={() => {
                onLogout()
                onToast("info", "Đã đăng xuất khỏi tất cả thiết bị.")
              }}
              className="w-full text-left py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 transition-colors"
            >
              Đăng xuất khỏi tất cả thiết bị
            </button>
          </div>

          <div>
            <SectionTitle>Khu vực nguy hiểm</SectionTitle>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="w-full text-left py-3 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                Xóa tài khoản
              </button>
            ) : (
              <div className="py-3 rounded-xl bg-red-50 dark:bg-red-950/30 px-3.5 mt-1">
                <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                  Xóa tài khoản sẽ mất toàn bộ album và ảnh. Không thể hoàn tác.
                </p>
                <div className="flex gap-2 mt-2.5">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="btn btn-secondary btn-sm"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDelete(false)
                      onToast(
                        "info",
                        "Yêu cầu xóa tài khoản đã được ghi nhận (demo).",
                      )
                      onClose()
                    }}
                    className="btn btn-danger btn-sm"
                  >
                    Xác nhận xóa
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
