// src/api/photos.ts

import { apiGet, apiDelete, apiPostForm } from "./client"

export interface PhotoResponse {
  id: number

  originalName: string

  url: string

  thumbnailUrl: string

  /** URL ảnh để HIỂN THỊ (RAW -> JPEG xem trước; ảnh thường -> ảnh gốc) */
  previewUrl: string

  /** true nếu file gốc là RAW (chỉ tải về, không hiển thị trực tiếp) */
  raw: boolean

  size: number // bytes

  width: number

  height: number

  uploadedBy: string

  uploadedTime: string // ISO datetime
}

interface Page<T> {
  content: T[]

  totalElements: number

  totalPages: number

  number: number

  size: number
}

export const listPhotosByEvent = (eventId: number, page = 0, size = 20) =>
  apiGet<Page<PhotoResponse>>(
    `/events/${eventId}/photos?page=${page}&size=${size}`,
  )

export const searchPhotos = (keyword: string, page = 0, size = 20) =>
  apiGet<Page<PhotoResponse>>(
    `/photos/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`,
  )

export const deletePhoto = (id: number) => apiDelete<void>(`/photos/${id}`)

// Cloudflare giới hạn ~100MB mỗi request -> chia thành nhiều request, mỗi lô tối đa ~80MB / 20 file.
const MAX_BATCH_BYTES = 80 * 1024 * 1024
const MAX_BATCH_FILES = 20

function splitBatches(files: File[]): File[][] {
  const batches: File[][] = []
  let current: File[] = []
  let bytes = 0
  for (const f of files) {
    if (current.length > 0 && (bytes + f.size > MAX_BATCH_BYTES || current.length >= MAX_BATCH_FILES)) {
      batches.push(current)
      current = []
      bytes = 0
    }
    current.push(f)
    bytes += f.size
  }
  if (current.length > 0) batches.push(current)
  return batches
}

export const uploadPhotos = async (eventId: number, files: File[]) => {
  let uploaded = 0
  const failed: unknown[] = []
  for (const batch of splitBatches(files)) {
    const form = new FormData()
    batch.forEach((f) => form.append("files", f))
    const res = await apiPostForm<{
      uploaded: number
      failed: unknown[]
    }>(`/events/${eventId}/photos`, form)
    uploaded += res.uploaded
    if (Array.isArray(res.failed)) failed.push(...res.failed)
  }
  return { uploaded, failed }
}

/** Dùng thẳng làm href="" download, KHÔNG gọi qua apiGet (response là file raw, không phải JSON) */

export const photoDownloadUrl = (id: number) =>
  `${import.meta.env.VITE_API_BASE_URL}/photos/download/${id}`

export const photosDownloadZipUrl = (ids: number[]) =>
  `${import.meta.env.VITE_API_BASE_URL}/photos/download-zip?${ids

    .map((i) => `ids=${i}`)

    .join("&")}`
