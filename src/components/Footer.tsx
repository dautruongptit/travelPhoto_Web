interface Props {
  onOpenHelp: () => void
}

/**
 * Footer chuẩn CasaOS:
 * - Trực tiếp là 1 thanh flex duy nhất (loại bỏ hoàn toàn div max-w-screen-2xl mx-auto bọc trong).
 * - Trái: Logo kép CasaOS/TravelPhoto + "travelphoto" + "Made with ❤️ by TravelPhoto and YOU!"
 * - Phải: Bộ icon chức năng tròn (Terminal/Help, Discord, GitHub, Web/Feedback).
 * - Kính trong suốt Midnight Indigo lơ lửng cách lề trái phải 20-50px.
 */
export default function Footer({ onOpenHelp }: Props) {
  return (
    <footer
      data-glass="footer"
      className="mt-auto mb-5 px-5 sm:px-7 py-3 flex items-center justify-between gap-4 border border-white/10 rounded-2xl select-none"
    >
      {/* Bên trái: Logo CasaOS-style + Made with ❤️ by TravelPhoto and YOU! */}
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
          Made with <span className="text-rose-500 inline-block text-xs mx-0.5">❤️</span> by{" "}
          <span className="text-white/90 font-medium">TravelPhoto</span> and{" "}
          <span className="text-white font-bold tracking-wide">YOU!</span>
        </p>
      </div>

      {/* Bên phải: Dãy icon chức năng tròn chuẩn CasaOS (Terminal, Discord, GitHub, Web) */}
      <div className="flex items-center gap-1 sm:gap-2 text-white/70 shrink-0">
        {/* Terminal / Hướng dẫn & Trợ giúp */}
        <button
          onClick={onOpenHelp}
          title="Trợ giúp & Hướng dẫn sử dụng"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
        </button>

        {/* Discord */}
        <a
          href="https://discord.com"
          target="_blank"
          rel="noopener noreferrer"
          title="Cộng đồng Discord"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
        </a>

        {/* GitHub */}
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub Repository"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
          </svg>
        </a>

        {/* Phản hồi & Liên hệ */}
        <a
          href="mailto:support@travelphoto.site"
          title="Liên hệ & Phản hồi"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </a>
      </div>
    </footer>
  )
}
