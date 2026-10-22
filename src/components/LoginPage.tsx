import { useGoogleLoginPopup } from "../hooks/useGoogleLoginPopup"

interface Props {
  theme: "light" | "dark"
  onToggleTheme: () => void
  /** Gọi khi Google OAuth2 trả về token thành công — App.tsx sẽ lưu token & fetch user */
  onLogin: (token: string) => void
  /** Gọi khi đăng nhập thất bại — App.tsx hiện toast lỗi */
  onLoginError: (message: string) => void
}

export default function LoginPage({
  theme,
  onToggleTheme,
  onLogin,
  onLoginError,
}: Props) {
  const { signIn, loading } = useGoogleLoginPopup({
    onSuccess: onLogin,
    onError: onLoginError,
  })

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden bg-[#1b1646]">
      {/* Ảnh nền toàn trang (bản đồ nằm bên trái, phần trống bên phải dành cho form) */}
      <picture>
        <source srcSet="/images/login-hero.avif" type="image/avif" />
        <source srcSet="/images/login-hero.webp" type="image/webp" />
        <img
          src="/images/login-hero.png"
          alt=""
          aria-hidden="true"
          loading="eager"
          decoding="async"
          style={{ objectPosition: "left center" }}
          className="hero-zoom absolute inset-0 w-full h-full object-cover"
        />
      </picture>
      {/* Theme toggle */}
      <button
        onClick={onToggleTheme}
        aria-label={
          theme === "dark"
            ? "Chuyển sang giao diện sáng"
            : "Chuyển sang giao diện tối"
        }
        title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
        className="absolute top-5 right-5 z-20 w-9 h-9 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 bg-white/70 dark:bg-gray-900/70 backdrop-blur hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        {theme === "dark" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="4.5"
              stroke="currentColor"
              strokeWidth="1.8"
            />
            <path
              d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Left panel: chỉ còn logo — ảnh nền nằm ở lớp toàn trang phía sau */}
      <div className="flex lg:w-3/5 relative">
        <div className="relative z-10 flex flex-col justify-between p-5 lg:p-12 xl:p-16 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#2563EB" />
                <path
                  d="M2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="#2563EB"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              Travel Photo
            </span>
          </div>
        </div>
      </div>

      {/* Right login panel */}
      <div className="dark relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-8">
        {/* Thẻ kính mờ để chữ luôn dễ đọc trên ảnh nền */}
        <div className="w-full max-w-md rounded-3xl bg-[#111827]/50 backdrop-blur-md border border-white/10 shadow-2xl p-6 sm:p-9">

        <div className="w-full slide-up">
          {/* Giới thiệu: tiêu đề -> mô tả -> số liệu, rồi ngăn cách với phần đăng nhập */}
          <section aria-label="Giới thiệu">
            <h1 className="hero-in text-gray-900 dark:text-[#FFF3E0] text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight">
              Lưu giữ từng
              <br />
              <span className="bg-gradient-to-r from-[#FFB48A] to-[#FF7A9C] bg-clip-text text-transparent">
                khoảnh khắc
              </span>
              <br />
              du lịch
            </h1>
            <p
              style={{ "--d": "100ms" } as React.CSSProperties}
              className="hero-in mt-4 text-gray-500 dark:text-[#CFCBEA] text-base leading-relaxed"
            >
              Tạo album, chia sẻ ảnh với bạn bè và lưu giữ những chuyến đi đáng
              nhớ — mãi mãi.
            </p>
            <dl
              style={{ "--d": "200ms" } as React.CSSProperties}
              className="hero-in mt-6 grid grid-cols-3 divide-x divide-gray-200 dark:divide-white/10 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 py-4"
            >
              {[
                ["4K+", "Ảnh được tải lên"],
                ["120+", "Sự kiện"],
                ["98%", "Hài lòng"],
              ].map(([num, label]) => (
                <div key={label} className="text-center px-2">
                  <dt className="sr-only">{label}</dt>
                  <dd className="text-[#FF8A5B] dark:text-[#FFB48A] text-2xl font-bold">
                    {num}
                  </dd>
                  <p className="text-gray-500 dark:text-[#CFCBEA] text-xs mt-0.5" aria-hidden="true">
                    {label}
                  </p>
                </div>
              ))}
            </dl>
          </section>

          <div className="my-10 h-px bg-gray-100 dark:bg-gray-800" />

          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
            Chào mừng!
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-base mb-10">
            Đăng nhập để quản lý và chia sẻ album ảnh du lịch của bạn.
          </p>

          {/* Google login button — mở popup, KHÔNG chuyển trang */}
          <button
            onClick={signIn}
            disabled={loading}
            aria-busy={loading}
            className="w-full flex items-center justify-center gap-3 h-[52px] rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:border-blue-400 hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin shrink-0"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="40 60"
                  />
                </svg>
                <span>Đang xác thực…</span>
              </>
            ) : (
              <>
                {/* Google "G" logo */}
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Tiếp tục với Google</span>
              </>
            )}
          </button>

          {/* Hint khi đang loading */}
          {loading && (
            <p className="mt-3 text-xs text-center text-gray-400 dark:text-gray-500">
              Cửa sổ Google đang mở — hãy chọn tài khoản của bạn.
            </p>
          )}

          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
            <span className="text-xs text-gray-400 dark:text-gray-500">
              hoặc
            </span>
            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
          </div>

          <p className="mt-6 text-sm text-center text-gray-500 dark:text-gray-400">
            Bạn có album được chia sẻ?{" "}
            <button className="text-blue-600 font-medium hover:underline">
              Xem không cần đăng nhập
            </button>
          </p>

          <p className="mt-10 text-xs text-gray-400 dark:text-gray-500 text-center leading-relaxed">
            Khi đăng nhập, bạn đồng ý với{" "}
            <span className="text-gray-600 dark:text-gray-300 cursor-pointer hover:underline">
              Điều khoản dịch vụ
            </span>{" "}
            và{" "}
            <span className="text-gray-600 dark:text-gray-300 cursor-pointer hover:underline">
              Chính sách bảo mật
            </span>
            .
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}
