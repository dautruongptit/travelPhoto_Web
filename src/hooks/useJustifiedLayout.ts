import { useMemo } from "react"
import type { FlickrPhoto, Photo } from "../types"

export interface LayoutPhoto extends FlickrPhoto {
  computedWidth: number
  computedHeight: number
}

export interface LayoutRow {
  photos: LayoutPhoto[]
  height: number
}

export interface JustifiedLayoutOptions {
  containerWidth: number
  targetRowHeight?: number
  gap?: number
}

export function useJustifiedLayout(
  photos: (FlickrPhoto | Photo)[],
  options: JustifiedLayoutOptions,
): LayoutRow[] {
  const { containerWidth, targetRowHeight = 240, gap = 4 } = options

  return useMemo(() => {
    if (!containerWidth || containerWidth <= 0 || photos.length === 0) {
      return []
    }

    const rows: LayoutRow[] = []
    let currentRow: (FlickrPhoto | Photo)[] = []
    let currentAspectSum = 0

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      // Tính aspect ratio: width / height
      let ar = 1.333
      if (
        "aspectRatio" in photo &&
        typeof photo.aspectRatio === "number" &&
        photo.aspectRatio > 0
      ) {
        ar = photo.aspectRatio
      } else if (photo.width && photo.height && photo.height > 0) {
        ar = photo.width / photo.height
      }

      // Giới hạn tỷ lệ an toàn (panoramas / vertical portraits)
      ar = Math.max(0.4, Math.min(3.5, ar))

      currentRow.push(photo)
      currentAspectSum += ar

      const totalGaps = (currentRow.length - 1) * gap
      const proposedWidth = currentAspectSum * targetRowHeight + totalGaps

      // Khi hàng đạt hoặc vượt độ rộng container -> chốt hàng và co dãn chiều cao
      if (proposedWidth >= containerWidth) {
        const availableWidth = Math.max(10, containerWidth - totalGaps)
        const rowHeight = Math.max(
          120,
          Math.round(availableWidth / currentAspectSum),
        )

        const computedPhotos: LayoutPhoto[] = currentRow.map((p) => {
          let itemAr = 1.333
          if (
            "aspectRatio" in p &&
            typeof p.aspectRatio === "number" &&
            p.aspectRatio > 0
          ) {
            itemAr = p.aspectRatio
          } else if (p.width && p.height && p.height > 0) {
            itemAr = p.width / p.height
          }
          itemAr = Math.max(0.4, Math.min(3.5, itemAr))

          return {
            ...p,
            computedHeight: rowHeight,
            computedWidth: Math.floor(rowHeight * itemAr),
          }
        })

        // Bù trừ sai số làm tròn pixel lẻ ở bức ảnh cuối của hàng
        const totalCalculatedWidth = computedPhotos.reduce(
          (s, p) => s + p.computedWidth,
          0,
        )
        const diff = availableWidth - totalCalculatedWidth
        if (diff !== 0 && computedPhotos.length > 0) {
          computedPhotos[computedPhotos.length - 1].computedWidth += diff
        }

        rows.push({ photos: computedPhotos, height: rowHeight })
        currentRow = []
        currentAspectSum = 0
      }
    }

    // Xử lý hàng cuối cùng còn dư (không kéo dãn quá lớn nếu chưa đủ số ảnh)
    if (currentRow.length > 0) {
      const computedPhotos: LayoutPhoto[] = currentRow.map((p) => {
        let itemAr = 1.333
        if (
          "aspectRatio" in p &&
          typeof p.aspectRatio === "number" &&
          p.aspectRatio > 0
        ) {
          itemAr = p.aspectRatio
        } else if (p.width && p.height && p.height > 0) {
          itemAr = p.width / p.height
        }
        itemAr = Math.max(0.4, Math.min(3.5, itemAr))

        return {
          ...p,
          computedHeight: targetRowHeight,
          computedWidth: Math.round(targetRowHeight * itemAr),
        }
      })
      rows.push({ photos: computedPhotos, height: targetRowHeight })
    }

    return rows
  }, [photos, containerWidth, targetRowHeight, gap])
}
