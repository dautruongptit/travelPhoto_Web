interface Props {
  onOpenHelp: () => void
}

export default function Footer({ onOpenHelp }: Props) {
  const year = new Date().getFullYear()

  return (
    <footer
      data-glass="footer"
      className="mt-auto mx-4 sm:mx-8 md:mx-12 mb-6 rounded-2xl sm:rounded-3xl border border-white/10 bg-transparent overflow-hidden"
    >
      <div className="max-w-screen-2xl mx-auto px-5 sm:px-8 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm shadow-blue-500/25">
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
            <span className="text-sm font-semibold tracking-tight text-white">
              TravelPhoto
            </span>
            <span className="text-xs text-white/50 hidden sm:inline">
              · Lưu giữ khoảnh khắc chuyến đi
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/70">
            <button
              onClick={onOpenHelp}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Trợ giúp & Hướng dẫn
            </button>
            <span className="cursor-pointer hover:text-white transition-colors">
              Điều khoản
            </span>
            <span className="cursor-pointer hover:text-white transition-colors">
              Bảo mật
            </span>
            <a
              href="mailto:support@travelphoto.site"
              className="hover:text-white transition-colors"
            >
              support@travelphoto.site
            </a>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-4 pt-3 border-t border-white/10 text-[11px] text-white/50">
          <p>© {year} TravelPhoto. Nền tảng chia sẻ và lưu trữ album ảnh du lịch.</p>
          <p className="flex items-center gap-1.5">
            Made with <span className="text-rose-500 text-xs">❤️</span> for travelers
          </p>
        </div>
      </div>
    </footer>
  )
}
