import { useEffect, useRef } from "react"

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string

            callback: (response: { credential: string }) => void

            auto_select?: boolean
          }) => void

          renderButton: (
            parent: HTMLElement,

            options: {
              type?: "standard" | "icon"

              theme?: "outline" | "filled_blue" | "filled_black"

              size?: "large" | "medium" | "small"

              shape?: "rectangular" | "pill" | "circle" | "square"

              width?: number

              text?: "signin_with" | "signup_with" | "continue_with" | "signin"

              logo_alignment?: "left" | "center"

              locale?: string
            },
          ) => void

          prompt?: () => void
        }
      }
    }
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

interface Options {
  onCredential: (idToken: string) => void

  disabled?: boolean
}

/**
 * Gắn nút "Đăng nhập với Google" chính chủ (Google Identity Services) vào containerRef.
 * Khi người dùng đăng nhập thành công, Google trả về một ID token (JWT) qua callback,
 * cần gửi token đó lên backend để backend verify + tạo phiên đăng nhập nội bộ.
 */

export function useGoogleSignInButton({ onCredential, disabled }: Options) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (disabled) return

    let cancelled = false

    function render() {
      if (cancelled || !containerRef.current || !window.google) return

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,

        callback: (response) => onCredential(response.credential),
      })

      containerRef.current.innerHTML = ""

      window.google.accounts.id.renderButton(containerRef.current, {
        type: "standard",

        theme: "outline",

        size: "large",

        shape: "pill",

        width: 360,

        text: "continue_with",

        logo_alignment: "left",

        locale: "vi",
      })
    }

    if (window.google) {
      render()
    } else {
      // Script accounts.google.com/gsi/client tải async, poll tới khi sẵn sàng

      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval)

          render()
        }
      }, 100)

      return () => {
        cancelled = true

        clearInterval(interval)
      }
    }
  }, [onCredential, disabled])

  return containerRef
}
