import { useCallback, useEffect, useRef } from "react"

type NavState = { view: "login" } | { view: "dashboard" } | {
  view: "album"
  eventId: string
} | { view: "help" }

interface Options {
  onNavigate: (state: NavState) => void
}

/**
 * Đồng bộ điều hướng nội bộ (Dashboard <-> Album <-> Login) với lịch sử trình duyệt,
 * để nút Back/Forward hoạt động như một app thật thay vì thoát ra ngoài trang.
 *
 * Cách dùng: gọi push(state) mỗi khi chuyển màn hình bằng hành động của người dùng
 * (click vào event, bấm về trang chủ...). Khi người dùng bấm Back/Forward của trình
 * duyệt, onNavigate sẽ được gọi lại với state tương ứng để component tự setView/...
 */

export function useHistoryNavigation({ onNavigate }: Options) {
  const onNavigateRef = useRef(onNavigate)

  onNavigateRef.current = onNavigate

  useEffect(() => {
    const handler = (e: PopStateEvent) => {
      const state = e.state as NavState | null ?? { view: "login" }

      onNavigateRef.current(state)
    }

    window.addEventListener("popstate", handler)

    return () => window.removeEventListener("popstate", handler)
  }, [])

  // Tạo entry lịch sử mới (cho phép back về trạng thái trước đó)

  const push = useCallback((state: NavState) => {
    window.history.pushState(state, "")
  }, [])

  // Ghi đè entry hiện tại, không tạo entry mới (dùng cho login/logout)

  const replace = useCallback((state: NavState) => {
    window.history.replaceState(state, "")
  }, [])

  return { push, replace }
}
