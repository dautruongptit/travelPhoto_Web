import type { Visibility } from "./types"

// Nhãn quyền xem của album (theo thiết kế mẫu): huy hiệu trên thẻ và trong trang album.
export const VISIBILITY_BADGE: Record<Visibility, { label: string; cls: string }> = {
  private: { label: "Riêng tư", cls: "bg-gray-100 text-gray-500" },
  link: { label: "Link chia sẻ", cls: "bg-yellow-50 text-yellow-700" },
  public: { label: "Công khai", cls: "bg-green-50 text-green-700" },
}

export const VISIBILITY_INFO: Record<Visibility, { label: string; color: string; icon: string }> = {
  private: { label: "Riêng tư", color: "text-gray-500 bg-gray-100", icon: "🔒" },
  link: { label: "Chia sẻ qua link", color: "text-yellow-700 bg-yellow-50", icon: "🔗" },
  public: { label: "Công khai", color: "text-green-700 bg-green-50", icon: "🌐" },
}

// Chưa biết quyền xem (backend chưa trả về / không tải được): hiển thị trung tính, KHÔNG giả định "riêng tư".
const UNKNOWN_BADGE = { label: "Chưa rõ", cls: "bg-gray-100 text-gray-400" }
const UNKNOWN_INFO = { label: "Chưa rõ", color: "text-gray-400 bg-gray-100", icon: "❔" }

export const badgeOf = (v?: Visibility) => (v ? VISIBILITY_BADGE[v] : UNKNOWN_BADGE)
export const infoOf = (v?: Visibility) => (v ? VISIBILITY_INFO[v] : UNKNOWN_INFO)
