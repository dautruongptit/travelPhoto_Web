interface Props {
  onOpenHelp: () => void
}

export default function Footer({ onOpenHelp }: Props) {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 mt-auto">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" />
                <path
                  d="M2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              TripAlbum
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
            <button
              onClick={onOpenHelp}
              className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Trợ giúp
            </button>
            <span className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              Điều khoản dịch vụ
            </span>
            <span className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              Chính sách bảo mật
            </span>
            <a
              href="mailto:support@tripalbum.vn"
              className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              support@tripalbum.vn
            </a>
            <a
              href="tel:19001234"
              className="flex items-center gap-1.5 font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              1900 1234
            </a>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-4">
          © {year} TripAlbum. Bản quyền thuộc Công ty TNHH Công nghệ TripAlbum.
          Đã đăng ký bảo hộ.
        </p>
      </div>
    </footer>
  )
}
