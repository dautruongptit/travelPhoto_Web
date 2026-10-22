import { useEffect, useRef, useState } from "react"
import { getGoogleLoginUrl } from "../lib/authApi"

export type GoogleAuthResult =
  | { type: "success"; token: string }
  | { type: "error"; error: string }

interface UseGoogleLoginPopupOptions {
  /** Gọi khi đăng nhập thành công — nhận token thô từ backend */
  onSuccess: (token: string) => void
  /** Gọi khi đăng nhập thất bại hoặc người dùng đóng popup */
  onError: (message: string) => void
}

/**
 * Hook mở popup Google OAuth2.
 *
 * Flow:
 *  1. `signIn()` mở window nhỏ trỏ đến `/oauth2/authorization/google`.
 *  2. Spring Security redirect người dùng đến Google, người dùng chọn tài khoản.
 *  3. Backend redirect popup về `/oauth2/callback?token=<jwt>`.
 *  4. Trang `/oauth2/callback` (public/oauth2-callback.html) gọi
 *     `window.opener.postMessage({ type: "GOOGLE_AUTH_SUCCESS", token })` rồi đóng.
 *  5. Hook nhận message → gọi `onSuccess(token)`.
 *
 * Nếu người dùng đóng popup trước khi chọn xong → phát hiện qua polling
 * `popup.closed` mỗi 500 ms → gọi `onError`.
 */
export function useGoogleLoginPopup({
  onSuccess,
  onError,
}: UseGoogleLoginPopupOptions) {
  const [loading, setLoading] = useState(false)
  const popupRef = useRef<Window | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /** Dọn dẹp: xóa polling + message listener */
  const cleanup = useRef<() => void>(() => {})

  useEffect(() => {
    return () => {
      cleanup.current()
    }
  }, [])

  const signIn = () => {
    // Đóng popup cũ nếu vẫn còn mở
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.close()
    }

    // Kích thước popup giống Google sign-in thật
    const width = 500
    const height = 620
    const left = Math.round(window.screenX + (window.outerWidth - width) / 2)
    const top = Math.round(window.screenY + (window.outerHeight - height) / 2)

    const popup = window.open(
      getGoogleLoginUrl(),
      "google-login",
      `width=${width},height=${height},left=${left},top=${top},` +
        "scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no",
    )

    if (!popup || popup.closed) {
      onError(
        "Popup bị chặn. Vui lòng cho phép popup từ trang này trong cài đặt trình duyệt.",
      )
      return
    }

    popupRef.current = popup
    setLoading(true)

    /** Xử lý message từ oauth2-callback.html */
    const handleMessage = (event: MessageEvent) => {
      // Chỉ nhận message từ cùng origin (bảo mật)
      if (event.origin !== window.location.origin) return

      const data = event.data as GoogleAuthResult | undefined
      if (!data) return

      if (data.type === "GOOGLE_AUTH_SUCCESS") {
        done()
        onSuccess(data.token)
      } else if (data.type === "GOOGLE_AUTH_ERROR") {
        done()
        onError(mapOAuthError(data.error))
      }
    }

    /** Polling: phát hiện người dùng tự đóng popup */
    const poll = setInterval(() => {
      if (popup.closed) {
        done()
        onError("Đăng nhập bị hủy. Vui lòng thử lại.")
      }
    }, 500)

    pollRef.current = poll
    window.addEventListener("message", handleMessage)

    cleanup.current = () => {
      clearInterval(poll)
      window.removeEventListener("message", handleMessage)
    }

    function done() {
      setLoading(false)
      cleanup.current()
      cleanup.current = () => {}
      if (!popup.closed) popup.close()
    }
  }

  return { signIn, loading }
}

function mapOAuthError(error: string): string {
  switch (error) {
    case "access_denied":
      return "Bạn đã từ chối quyền truy cập. Vui lòng thử lại và chấp nhận để đăng nhập."
    case "popup_closed_by_user":
      return "Đăng nhập bị hủy. Vui lòng thử lại."
    default:
      return `Đăng nhập Google thất bại (${error}). Vui lòng thử lại.`
  }
}
