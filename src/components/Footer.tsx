interface Props {
  onOpenHelp: () => void
}

/**
 * Footer chuẩn CasaOS không viền (borderless) với đầy đủ thông tin gốc:
 * - Style: 1 thanh ngang thanh lịch duy nhất, dàn trải hai bên mép.
 * - Trái: Logo 2 chấm tròn + travelphoto + Bản quyền & Made with ❤️
 * - Phải: Trợ giúp & Hướng dẫn, Điều khoản dịch vụ, Chính sách bảo mật, support@travelphoto.site, 1900 1234
 * - Hoàn toàn không viền (bỏ toàn bộ border).
 */
export default function Footer({ onOpenHelp }: Props) {
  const year = new Date().getFullYear()

  return (
    <footer
      data-glass="footer"
      className="mt-auto mb-5 px-5 sm:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-3 select-none"
    >
      {/* Bên trái: Logo CasaOS-style + Made with ❤️ & Bản quyền */}
      <div className="flex items-center gap-2.5 sm:gap-3 text-xs min-w-0">
        <div className="flex items-center gap-1.5 font-bold tracking-tight text-white shrink-0">
          <span className="inline-flex items-center -space-x-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 opacity-90 shadow-sm shadow-cyan-400/50" />
            <span className="w-3.5 h-3.5 rounded-full bg-blue-600 opacity-95 shadow-sm shadow-blue-500/50 mix-blend-screen" />
          </span>
          <span className="text-sm font-semibold tracking-wide lowercase">travelphoto</span>
        </div>

        <span className="text-white/20 hidden sm:inline">|</span>

        <p className="text-white/75 truncate text-[11px] sm:text-xs">
          <span>Made with</span>
          <span className="text-rose-500 inline-block text-xs mx-1">❤️</span>
          <span>by</span>
          <span className="text-white/90 font-medium ml-1">TravelPhoto</span>
          <span className="mx-1">and</span>
          <span className="text-white font-bold tracking-wide">YOU!</span>
          <span className="text-white/40 ml-2 hidden lg:inline">· © {year}</span>
        </p>
      </div>

      {/* Bên phải: Toàn bộ thông tin & liên kết cũ */}
      <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-4 sm:gap-x-6 gap-y-1 text-xs text-white/70 shrink-0">
        <button
          onClick={onOpenHelp}
          className="hover:text-white transition-colors cursor-pointer"
        >
          Trợ giúp & Hướng dẫn
        </button>
        <span className="cursor-pointer hover:text-white transition-colors">
          Điều khoản dịch vụ
        </span>
        <span className="cursor-pointer hover:text-white transition-colors">
          Chính sách bảo mật
        </span>
        <a
          href="mailto:support@travelphoto.site"
          className="hover:text-white transition-colors hidden sm:inline"
        >
          support@travelphoto.site
        </a>
        <a
          href="tel:19001234"
          className="flex items-center gap-1.5 font-medium text-white/80 hover:text-blue-400 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span>1900 1234</span>
        </a>
      </div>
    </footer>
  )
}
