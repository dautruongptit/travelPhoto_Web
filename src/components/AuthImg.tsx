import { useEffect, useState, type ImgHTMLAttributes } from "react"
import { API_BASE_URL, getToken } from "../lib/apiClient"

// Backend yêu cầu đăng nhập khi tải ảnh (/api/photos/download/{id}), nhưng thẻ <img src>
// của trình duyệt không gửi được header Authorization -> 403. Tải ảnh bằng fetch kèm
// Bearer token rồi hiển thị qua blob URL. Cache theo URL để thumbnail/lightbox dùng lại.
const blobCache = new Map<string, Promise<string>>()

// Origin API của chính app: "/api" (qua nginx/Vite proxy) -> origin của web; hoặc URL tuyệt đối.
const API_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin

// Chỉ gắn token khi gọi tới API của app. URL ảnh do backend trả về có thể mang domain api
// riêng (app.api-base-url) -> lấy phần đường dẫn "/api/..." rồi gọi qua API_ORIGIN
// (cùng origin với web, không dính CORS). URL không thuộc /api/ thì tải KHÔNG kèm token
// để không gửi Bearer token tới origin lạ.
function resolveRequest(url: string): { href: string; token: string | null } {
  const target = new URL(url, window.location.href)
  if (target.pathname.startsWith("/api/")) {
    return { href: API_ORIGIN + target.pathname + target.search, token: getToken() }
  }
  return { href: target.href, token: null }
}

export function fetchAuthedBlobUrl(url: string): Promise<string> {
  let cached = blobCache.get(url)
  if (!cached) {
    const { href, token } = resolveRequest(url)
    cached = fetch(href, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "omit",
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.blob()
      })
      .then((blob) => URL.createObjectURL(blob))
    cached.catch(() => blobCache.delete(url)) // lỗi thì cho thử lại lần sau
    blobCache.set(url, cached)
  }
  return cached
}

/** Tải file có xác thực rồi lưu về máy (dùng cho nút "Tải ảnh gốc"). */
export async function downloadAuthed(url: string, filename: string) {
  const blobUrl = await fetchAuthedBlobUrl(url)
  const a = document.createElement("a")
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

/** Giống <img> nhưng tải ảnh qua fetch có Authorization. */
export default function AuthImg({
  src,
  onLoad,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [blobUrl, setBlobUrl] = useState<string | undefined>()

  useEffect(() => {
    if (!src) return
    let cancelled = false
    setBlobUrl(undefined)
    fetchAuthedBlobUrl(src)
      .then((u) => {
        if (!cancelled) setBlobUrl(u)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [src])

  return <img src={blobUrl} onLoad={onLoad} {...rest} />
}
