export interface User {
  id: string
  name: string
  email: string
  avatar: string
}

export interface Photo {
  id: string
  name: string
  url: string
  /** URL để hiển thị (RAW -> JPEG xem trước). Nếu thiếu thì dùng url. */
  previewUrl?: string
  // EXIF thật do backend đọc lúc upload (có thể thiếu)
  cameraModel?: string
  lensModel?: string
  focalLength?: string
  focalLength35mm?: string
  fNumber?: string
  shutterSpeed?: string
  iso?: number
  takenAt?: string
  raw?: boolean
  size: number
  width: number
  height: number
  uploadedAt: string
  uploadedBy: string
}

export type Visibility = "private" | "link" | "public"

export interface TravelEvent {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  location: string
  coverImage: string
  thumbnails?: string[]
  /** true khi sự kiện có ảnh bìa riêng (không phải ảnh mặc định) */
  hasCover?: boolean
  /** Quyền xem: riêng tư / có link chia sẻ / công khai (backend trả về) */
  visibility?: Visibility
  photos: Photo[]
  // Tổng số ảnh / dung lượng theo backend (EventResponse.photoCount/totalSize) —
  // dùng để hiển thị ở Dashboard/EventCard mà không cần tải hết `photos` của
  // MỌI event (photos chỉ được tải đầy đủ khi mở AlbumPage của event đó).
  photoCount?: number
  totalSizeBytes?: number
  createdBy: string
  ownerId: string
  createdAt: string
}

export interface ToastItem {
  id: string
  type: "success" | "error" | "warning" | "info"
  message: string
}

export interface StoragePlan {
  id: string
  durationMonths: 1 | 3 | 6 | 12
  label: string
  storageGB: number
  pricePerMonth: number // VNĐ/tháng đã áp ưu đãi
  originalPricePerMonth: number // VNĐ/tháng gốc (chưa giảm)
  totalPrice: number // VNĐ, thanh toán 1 lần cho cả kỳ
  discountPercent: number
  badge?: string
}

export interface PaymentOrder {
  orderId: string
  planId: string
  amount: number // VNĐ
}

export type AppView = "login" | "dashboard" | "album" | "help"
export type SortOption = "newest" | "oldest" | "name-az" | "name-za"

export interface FlickrPhoto extends Photo {
  title?: string
  description?: string
  likesCount?: number
  commentsCount?: number
  isLiked?: boolean
  aspectRatio?: number
}

export type FlickrNavTab = "explore" | "photostream" | "albums" | "trips"
