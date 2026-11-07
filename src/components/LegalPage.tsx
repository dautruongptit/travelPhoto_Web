interface Props {
  kind: "terms" | "privacy"
  onBack: () => void
  /** Chuyển sang trang pháp lý còn lại */
  onSwitch: () => void
}

interface Section {
  title: string
  body: string[]
}

const UPDATED_AT = "07/11/2026"

const TERMS: Section[] = [
  {
    title: "1. Chấp nhận điều khoản",
    body: [
      "Khi đăng nhập hoặc sử dụng TravelPhoto, bạn xác nhận đã đọc, hiểu và đồng ý với các điều khoản dưới đây. Nếu không đồng ý, vui lòng ngừng sử dụng dịch vụ.",
    ],
  },
  {
    title: "2. Dịch vụ cung cấp",
    body: [
      "TravelPhoto là nền tảng lưu trữ, sắp xếp và chia sẻ album ảnh chuyến đi. Ảnh được lưu ở chất lượng gốc, không nén khi tải lên hay tải xuống.",
      "Chúng tôi có thể thay đổi, tạm ngừng hoặc bổ sung tính năng để cải thiện dịch vụ và sẽ cố gắng thông báo trước khi thay đổi lớn.",
    ],
  },
  {
    title: "3. Tài khoản",
    body: [
      "Bạn đăng nhập bằng tài khoản Google. Bạn chịu trách nhiệm về mọi hoạt động diễn ra dưới tài khoản của mình và cần giữ an toàn cho tài khoản Google đó.",
      "Mỗi tài khoản chỉ có một phiên đăng nhập hoạt động. Đăng nhập ở thiết bị mới sẽ kết thúc phiên ở thiết bị cũ.",
    ],
  },
  {
    title: "4. Nội dung của bạn",
    body: [
      "Bạn giữ toàn bộ quyền sở hữu đối với ảnh và nội dung đã tải lên. Bạn cấp cho TravelPhoto quyền lưu trữ, xử lý (tạo ảnh thu nhỏ, đọc thông tin EXIF) và hiển thị nội dung đó cho những người bạn cho phép xem, chỉ nhằm vận hành dịch vụ.",
      "Bạn cam kết có quyền hợp pháp với ảnh tải lên và không tải lên nội dung vi phạm pháp luật, xâm phạm quyền riêng tư, bản quyền hoặc quyền hình ảnh của người khác.",
    ],
  },
  {
    title: "5. Chia sẻ album",
    body: [
      "Bạn quyết định ai được xem hoặc cộng tác trong album: riêng tư, công khai cho người đã đăng nhập, hoặc qua liên kết chia sẻ. Mỗi sự kiện chỉ có tối đa một liên kết chia sẻ hoạt động.",
      "Người nhận liên kết có thể xem (hoặc cộng tác, tùy vai trò bạn chọn). Khi bạn thu hồi liên kết, người đó mất toàn bộ quyền truy cập vào album, bao gồm cả ảnh họ đã đóng góp.",
    ],
  },
  {
    title: "6. Dung lượng và thanh toán",
    body: [
      "Mỗi tài khoản được cấp dung lượng miễn phí 2GB. Bạn có thể nâng cấp dung lượng theo các gói hiển thị trong mục \"Nâng cấp tài khoản\". Thanh toán được xử lý qua cổng VNPay; chúng tôi không lưu thông tin thẻ của bạn.",
      "Phí đã thanh toán cho gói nâng cấp không được hoàn lại, trừ trường hợp pháp luật yêu cầu hoặc lỗi phát sinh từ phía chúng tôi.",
    ],
  },
  {
    title: "7. Xóa dữ liệu",
    body: [
      "Thao tác xóa ảnh hoặc sự kiện là vĩnh viễn. Hiện tại hệ thống không có thùng rác, vì vậy hãy cân nhắc trước khi xóa. Nếu cần hỗ trợ khôi phục khẩn cấp, hãy liên hệ chúng tôi trong vòng 24 giờ.",
    ],
  },
  {
    title: "8. Hành vi bị cấm",
    body: [
      "Không được: tấn công, dò quét hoặc làm gián đoạn hệ thống; truy cập trái phép dữ liệu của người khác; dùng dịch vụ để phát tán mã độc, spam hoặc nội dung trái pháp luật; cố tình vượt giới hạn dung lượng hoặc cơ chế phân quyền.",
      "Chúng tôi có quyền khóa hoặc xóa tài khoản và nội dung vi phạm mà không cần báo trước trong các trường hợp nghiêm trọng.",
    ],
  },
  {
    title: "9. Giới hạn trách nhiệm",
    body: [
      "Dịch vụ được cung cấp trên cơ sở \"như hiện có\". Chúng tôi nỗ lực bảo vệ dữ liệu nhưng khuyến nghị bạn giữ bản sao ảnh quan trọng. Trong phạm vi pháp luật cho phép, TravelPhoto không chịu trách nhiệm cho thiệt hại gián tiếp hoặc mất mát dữ liệu ngoài khả năng kiểm soát hợp lý của chúng tôi.",
    ],
  },
  {
    title: "10. Thay đổi điều khoản & liên hệ",
    body: [
      "Chúng tôi có thể cập nhật điều khoản này; ngày cập nhật gần nhất được ghi ở đầu trang. Việc tiếp tục sử dụng sau khi cập nhật được hiểu là bạn chấp nhận nội dung mới.",
      "Mọi thắc mắc xin liên hệ support@travelphoto.site hoặc hotline 1900 1234 (8:00–21:00 hằng ngày).",
    ],
  },
]

const PRIVACY: Section[] = [
  {
    title: "1. Thông tin chúng tôi thu thập",
    body: [
      "Từ tài khoản Google: mã định danh Google, địa chỉ email, họ tên và ảnh đại diện.",
      "Nội dung bạn tải lên: ảnh cùng thông tin đi kèm trong tệp (EXIF như thời gian chụp, kiểu máy ảnh, ống kính, thông số chụp và vị trí nếu có), tên sự kiện, mô tả, địa điểm.",
      "Dữ liệu kỹ thuật & bảo mật: địa chỉ IP và trình duyệt (User-Agent) tại thời điểm đăng nhập, nhật ký thao tác quan trọng (đăng nhập, tạo/xóa, chia sẻ) phục vụ an ninh.",
      "Thanh toán: mã giao dịch và trạng thái do VNPay trả về. Chúng tôi không nhận hay lưu số thẻ.",
    ],
  },
  {
    title: "2. Mục đích sử dụng",
    body: [
      "Xác thực bạn và duy trì phiên đăng nhập; lưu trữ, hiển thị và chia sẻ album theo lựa chọn của bạn; tính dung lượng và xử lý nâng cấp; phát hiện, ngăn chặn truy cập trái phép và gian lận; hỗ trợ khi bạn liên hệ.",
      "Chúng tôi không bán dữ liệu cá nhân của bạn và không dùng ảnh của bạn cho quảng cáo.",
    ],
  },
  {
    title: "3. Ai có thể thấy ảnh của bạn",
    body: [
      "Chỉ bạn, và những người bạn cho phép: thành viên được mời, người đã đăng nhập (nếu bạn đặt album công khai), hoặc người có liên kết chia sẻ còn hiệu lực. Bạn có thể thu hồi liên kết hoặc đổi quyền riêng tư bất cứ lúc nào.",
      "Thông tin vị trí và EXIF trong ảnh gốc có thể hiển thị cho người xem được cấp quyền. Hãy cân nhắc khi chia sẻ ảnh có vị trí nhạy cảm.",
    ],
  },
  {
    title: "4. Lưu trữ và bảo mật",
    body: [
      "Ảnh được lưu trên máy chủ của TravelPhoto. Truy cập được kiểm soát bằng xác thực và phân quyền theo từng album; kết nối truyền tải dùng HTTPS.",
      "Phiên đăng nhập dùng token truy cập ngắn hạn và cookie làm mới (refresh) đặt ở chế độ httpOnly. Không có hệ thống nào an toàn tuyệt đối; nếu phát hiện sự cố nghiêm trọng ảnh hưởng đến bạn, chúng tôi sẽ thông báo theo quy định pháp luật.",
    ],
  },
  {
    title: "5. Bên thứ ba",
    body: [
      "Google: dùng để đăng nhập (chính sách riêng của Google áp dụng cho phần xác thực).",
      "VNPay: xử lý thanh toán khi bạn nâng cấp dung lượng.",
      "Chúng tôi chỉ chia sẻ dữ liệu với các bên này ở mức cần thiết để cung cấp tính năng tương ứng, hoặc khi pháp luật yêu cầu.",
    ],
  },
  {
    title: "6. Cookie và lưu trữ cục bộ",
    body: [
      "Chúng tôi dùng cookie và bộ nhớ trình duyệt để giữ đăng nhập và ghi nhớ một số lựa chọn giao diện. Bạn có thể xóa chúng trong trình duyệt, nhưng khi đó bạn sẽ phải đăng nhập lại.",
    ],
  },
  {
    title: "7. Thời gian lưu giữ và quyền của bạn",
    body: [
      "Dữ liệu được lưu cho đến khi bạn xóa nội dung hoặc yêu cầu xóa tài khoản. Nhật ký bảo mật có thể được giữ thêm một thời gian hợp lý để phục vụ an ninh và nghĩa vụ pháp lý.",
      "Bạn có quyền truy cập, chỉnh sửa tên hiển thị, tải về ảnh của mình, xóa nội dung và yêu cầu xóa tài khoản. Hãy liên hệ chúng tôi để thực hiện các yêu cầu này.",
    ],
  },
  {
    title: "8. Trẻ em",
    body: [
      "Dịch vụ không dành cho trẻ dưới 13 tuổi. Nếu bạn cho rằng một trẻ em đã tạo tài khoản, vui lòng liên hệ để chúng tôi xử lý.",
    ],
  },
  {
    title: "9. Thay đổi chính sách & liên hệ",
    body: [
      "Chính sách có thể được cập nhật; ngày cập nhật gần nhất ghi ở đầu trang. Thắc mắc hoặc yêu cầu về dữ liệu cá nhân: support@travelphoto.site, hotline 1900 1234.",
    ],
  },
]

export default function LegalPage({ kind, onBack, onSwitch }: Props) {
  const isTerms = kind === "terms"
  const sections = isTerms ? TERMS : PRIVACY

  return (
    <div className="max-w-screen-md mx-auto px-4 sm:px-6 py-8">
      <button onClick={onBack} className="btn btn-ghost mb-6">
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

      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
        {isTerms ? "Điều khoản dịch vụ" : "Chính sách bảo mật"}
      </h1>
      <p className="text-sm text-white/60 mt-1">
        Cập nhật lần cuối: {UPDATED_AT}
      </p>

      <div className="mt-6 space-y-3">
        {sections.map((s) => (
          <section key={s.title} className="blur-background p-5">
            <h2 className="text-base font-semibold text-white">{s.title}</h2>
            <div className="mt-2 space-y-2">
              {s.body.map((p) => (
                <p key={p} className="text-sm text-white/70 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-6 text-sm text-white/60">
        Xem thêm:{" "}
        <button
          onClick={onSwitch}
          className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
        >
          {isTerms ? "Chính sách bảo mật" : "Điều khoản dịch vụ"}
        </button>
      </p>
    </div>
  )
}
