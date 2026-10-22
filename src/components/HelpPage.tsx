import { useState } from "react"

interface Props {
  onBack: () => void
}

const FAQ: { q: string; a: string }[] = [
  {
    q: "Làm sao để tải nhiều ảnh lên cùng lúc?",

    a: 'Vào một sự kiện, bấm "Tải ảnh lên", sau đó chọn nhiều ảnh cùng lúc trong hộp thoại chọn file (giữ Ctrl/Shift để chọn nhiều), hoặc kéo-thả cả một thư mục ảnh trực tiếp vào khung tải lên.',
  },

  {
    q: "Dung lượng lưu trữ miễn phí là bao nhiêu?",

    a: 'Mỗi tài khoản được 2GB miễn phí. Khi gần hết dung lượng, bạn có thể nâng cấp lên các gói 100–200GB theo tháng/quý/năm trong mục "Nâng cấp tài khoản".',
  },

  {
    q: "Tôi có thể chia sẻ album cho người không có tài khoản không?",

    a: "Có. Mỗi sự kiện đều có thể tạo link chia sẻ xem-trước, người nhận không cần đăng nhập vẫn xem được ảnh (tùy theo quyền riêng tư bạn đặt trong Cài đặt).",
  },

  {
    q: "Ảnh của tôi có bị nén, giảm chất lượng không?",

    a: "Không. Ảnh được lưu trữ nguyên bản chất lượng gốc, không nén khi tải lên hay tải xuống.",
  },

  {
    q: "Làm sao để đổi tên hiển thị hoặc ảnh đại diện?",

    a: 'Mở menu tài khoản ở góc phải → "Hồ sơ của tôi" → bấm biểu tượng bút cạnh tên để đổi tên hiển thị. Ảnh đại diện được đồng bộ từ tài khoản Google của bạn.',
  },

  {
    q: "Tôi lỡ xóa nhầm ảnh, có khôi phục được không?",

    a: "Hiện tại thao tác xóa ảnh là vĩnh viễn, vui lòng thao tác cẩn thận. Nếu cần khôi phục gấp, hãy liên hệ hotline hỗ trợ bên dưới trong vòng 24 giờ.",
  },
]

export default function HelpPage({ onBack }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="max-w-screen-md mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mb-6"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M15 18l-6-6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Quay lại
      </button>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
        Trung tâm trợ giúp
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Câu hỏi thường gặp và cách liên hệ với đội ngũ hỗ trợ TripAlbum.
      </p>

      {/* FAQ */}
      <div className="mt-6 space-y-2">
        {FAQ.map((item, i) => {
          const open = openIndex === i

          return (
            <div
              key={item.q}
              className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(open ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-4 py-3.5 text-left bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {item.q}
                </span>
                <svg
                  className={`flex-shrink-0 text-gray-400 dark:text-gray-500 transition-transform ${
                    open ? "rotate-180" : ""
                  }`}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {open && (
                <div className="px-4 pb-4 -mt-0.5">
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    {item.a}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Contact */}
      <div className="mt-8 rounded-2xl bg-gray-50 dark:bg-gray-800 p-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Vẫn cần trợ giúp?
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Đội ngũ hỗ trợ TripAlbum sẵn sàng giải đáp mọi lúc.
        </p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="tel:19001234"
            className="flex items-center gap-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-4 py-3 hover:border-blue-300 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
                  stroke="#2563EB"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                1900 1234
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hotline · 8:00–21:00 hằng ngày
              </p>
            </div>
          </a>

          <a
            href="mailto:support@tripalbum.vn"
            className="flex items-center gap-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-4 py-3 hover:border-blue-300 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 6 12 13 2 6"
                  stroke="#2563EB"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="2"
                  y="4"
                  width="20"
                  height="16"
                  rx="2"
                  stroke="#2563EB"
                  strokeWidth="1.8"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                support@tripalbum.vn
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Phản hồi trong 24 giờ
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
