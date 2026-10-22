export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const formatTotalSize = (bytes: number): string => {
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",

    month: "2-digit",

    year: "numeric",
  })
}

export const formatDateShort = (dateString: string): string => {
  const d = new Date(dateString)

  return `${d.getUTCDate().toString().padStart(2, "0")}/${(d.getUTCMonth() + 1).toString().padStart(2, "0")}/${d.getUTCFullYear()}`
}

export const formatDateRange = (start: string, end: string): string => {
  if (start === end) return formatDateShort(start)

  const s = new Date(start)

  const e = new Date(end)

  return `${s.getUTCDate().toString().padStart(2, "0")}/${(s.getUTCMonth() + 1).toString().padStart(2, "0")} – ${e.getUTCDate().toString().padStart(2, "0")}/${(e.getUTCMonth() + 1).toString().padStart(2, "0")}/${e.getUTCFullYear()}`
}

export const formatTimeAgo = (dateString: string): string => {
  const diff = Date.now() - new Date(dateString).getTime()

  const days = Math.floor(diff / 86400000)

  if (days === 0) return "Hôm nay"

  if (days === 1) return "Hôm qua"

  if (days < 30) return `${days} ngày trước`

  if (days < 365) return `${Math.floor(days / 30)} tháng trước`

  return `${Math.floor(days / 365)} năm trước`
}

export const generateId = (): string => Math.random().toString(36).slice(2, 11)

export const formatCurrency = (vnd: number): string =>
  vnd.toLocaleString("vi-VN") + "₫"

export const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
]

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export const FREE_STORAGE_BYTES = 2 * 1024 * 1024 * 1024 // 2 GB miễn phí
