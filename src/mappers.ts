import type { Photo, TravelEvent } from "./types"
import type { EventResponse } from "./api/events"
import type { PhotoResponse } from "./api/photos"

// Chuyển DTO backend -> model của web (dùng chung cho App và trang chia sẻ).
const FALLBACK_COVER_IMAGE =
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=500&fit=crop&auto=format"

export function mapEventResponse(
  dto: EventResponse,
  photos: Photo[] = [],
): TravelEvent {
  return {
    id: String(dto.id),
    name: dto.name,
    description: dto.description ?? "",
    startDate: dto.startDate,
    endDate: dto.endDate || dto.startDate,
    location: dto.location,
    coverImage: dto.coverImageUrl || FALLBACK_COVER_IMAGE,
    thumbnails: dto.previewImageUrls ?? [],
    hasCover: !!dto.coverImageUrl,
    visibility: dto.visibility, // thiếu = chưa rõ (không giả định "riêng tư")
    photos,
    photoCount: dto.photoCount,
    totalSizeBytes: dto.totalSize,
    createdBy: dto.ownerName,
    ownerId: String(dto.ownerId),
    createdAt: dto.createdAt,
    userRole: dto.userRole,
  }
}

export function mapPhotoResponse(dto: PhotoResponse): Photo {
  return {
    id: String(dto.id),
    name: dto.originalName,
    url: dto.url,
    previewUrl: dto.previewUrl,
    cameraModel: dto.cameraModel ?? undefined,
    lensModel: dto.lensModel ?? undefined,
    focalLength: dto.focalLength ?? undefined,
    focalLength35mm: dto.focalLength35mm ?? undefined,
    fNumber: dto.aperture ?? undefined,
    shutterSpeed: dto.shutterSpeed ?? undefined,
    iso: dto.iso ?? undefined,
    takenAt: dto.takenAt ?? undefined,
    raw: dto.raw,
    size: dto.size,
    width: dto.width,
    height: dto.height,
    uploadedAt: dto.uploadedTime,
    uploadedBy: dto.uploadedBy,
  }
}
