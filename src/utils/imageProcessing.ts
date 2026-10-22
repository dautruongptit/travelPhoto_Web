/**
 * Trích xuất thông tin EXIF cơ bản từ file ảnh JPEG (Client-side)
 * Không cần thư viện ngoài, chạy siêu nhẹ trên trình duyệt.
 */
export interface ExtractedExif {
  dateTime?: Date
  dateString?: string
  cameraModel?: string
  latitude?: number
  longitude?: number
  focalLength?: string
  fNumber?: string
  iso?: number
}

export async function extractExifFromBlob(file: File): Promise<ExtractedExif> {
  const result: ExtractedExif = {}

  try {
    const buffer = await file.slice(0, 128 * 1024).arrayBuffer() // Đọc 128KB đầu của file là đủ chứa EXIF
    const view = new DataView(buffer)

    // Kiểm tra định dạng JPEG (0xFFD8)
    if (view.getUint16(0, false) !== 0xffd8) {
      if (file.lastModified) {
        result.dateTime = new Date(file.lastModified)
        result.dateString = result.dateTime.toISOString().split("T")[0]
      }
      return result
    }

    let offset = 2
    const length = buffer.byteLength

    while (offset < length) {
      if (view.getUint8(offset) !== 0xff) break
      const marker = view.getUint8(offset + 1)

      // APP1 Marker chứa EXIF (0xFFE1)
      if (marker === 0xe1) {
        const app1Length = view.getUint16(offset + 2, false)
        const exifHeader = view.getUint32(offset + 4, false)

        // Header "Exif\0\0" (0x45786966)
        if (exifHeader === 0x45786966) {
          const tiffOffset = offset + 10
          const isLittleEndian = view.getUint16(tiffOffset, false) === 0x4949 // "II"

          const firstIfdOffset = view.getUint32(tiffOffset + 4, isLittleEndian)
          if (firstIfdOffset >= 8) {
            parseIFD(
              view,
              tiffOffset,
              tiffOffset + firstIfdOffset,
              isLittleEndian,
              result,
            )
          }
        }
        break
      } else {
        offset += 2 + view.getUint16(offset + 2, false)
      }
    }
  } catch {
    // Lỗi phân tích EXIF -> fallback về file metadata
  }

  if (!result.dateTime && file.lastModified) {
    result.dateTime = new Date(file.lastModified)
    result.dateString = result.dateTime.toISOString().split("T")[0]
  }

  return result
}

function parseIFD(
  view: DataView,
  tiffOffset: number,
  ifdOffset: number,
  littleEndian: boolean,
  result: ExtractedExif,
) {
  if (ifdOffset + 2 > view.byteLength) return
  const numEntries = view.getUint16(ifdOffset, littleEndian)

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = ifdOffset + 2 + i * 12
    if (entryOffset + 12 > view.byteLength) break

    const tag = view.getUint16(entryOffset, littleEndian)
    const type = view.getUint16(entryOffset + 2, littleEndian)
    const count = view.getUint32(entryOffset + 4, littleEndian)

    // Camera Model (Tag 0x0110)
    if (tag === 0x0110 && type === 2) {
      const valOffset =
        tiffOffset + view.getUint32(entryOffset + 8, littleEndian)
      result.cameraModel = readAsciiString(view, valOffset, count)
    }

    // Exif SubIFD Pointer (Tag 0x8769)
    if (tag === 0x8769 && type === 4) {
      const subIfdOffset =
        tiffOffset + view.getUint32(entryOffset + 8, littleEndian)
      parseSubIFD(view, tiffOffset, subIfdOffset, littleEndian, result)
    }
  }
}

function parseSubIFD(
  view: DataView,
  tiffOffset: number,
  subIfdOffset: number,
  littleEndian: boolean,
  result: ExtractedExif,
) {
  if (subIfdOffset + 2 > view.byteLength) return
  const numEntries = view.getUint16(subIfdOffset, littleEndian)

  for (let i = 0; i < numEntries; i++) {
    const entryOffset = subIfdOffset + 2 + i * 12
    if (entryOffset + 12 > view.byteLength) break

    const tag = view.getUint16(entryOffset, littleEndian)
    const type = view.getUint16(entryOffset + 2, littleEndian)
    const count = view.getUint32(entryOffset + 4, littleEndian)

    // DateTimeOriginal (Tag 0x9003) - "YYYY:MM:DD HH:MM:SS"
    if (tag === 0x9003 && type === 2) {
      const valOffset =
        tiffOffset + view.getUint32(entryOffset + 8, littleEndian)
      const str = readAsciiString(view, valOffset, count)
      if (str && str.length >= 10) {
        const parts = str.split(" ")[0].split(":")
        if (parts.length === 3) {
          result.dateString = `${parts[0]}-${parts[1]}-${parts[2]}`
          result.dateTime = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`)
        }
      }
    }

    // FNumber (Tag 0x829D)
    if (tag === 0x829d && type === 5) {
      const valOffset =
        tiffOffset + view.getUint32(entryOffset + 8, littleEndian)
      if (valOffset + 8 <= view.byteLength) {
        const num = view.getUint32(valOffset, littleEndian)
        const den = view.getUint32(valOffset + 4, littleEndian)
        if (den > 0) result.fNumber = `f/${(num / den).toFixed(1)}`
      }
    }

    // ISO (Tag 0x8827)
    if (tag === 0x8827 && type === 3) {
      result.iso = view.getUint16(entryOffset + 8, littleEndian)
    }

    // FocalLength (Tag 0x920A)
    if (tag === 0x920a && type === 5) {
      const valOffset =
        tiffOffset + view.getUint32(entryOffset + 8, littleEndian)
      if (valOffset + 8 <= view.byteLength) {
        const num = view.getUint32(valOffset, littleEndian)
        const den = view.getUint32(valOffset + 4, littleEndian)
        if (den > 0) result.focalLength = `${Math.round(num / den)}mm`
      }
    }
  }
}

function readAsciiString(
  view: DataView,
  offset: number,
  maxLen: number,
): string {
  let str = ""
  for (let i = 0; i < maxLen; i++) {
    if (offset + i >= view.byteLength) break
    const charCode = view.getUint8(offset + i)
    if (charCode === 0) break
    str += String.fromCharCode(charCode)
  }
  return str.trim()
}

/**
 * Nén ảnh phía client (Client-side Image Compression)
 * Giữ nguyên tỷ lệ, tối ưu kích thước để upload nhanh qua 4G/5G/Wifi yếu.
 */
export async function compressImage(
  file: File,
  maxDimension = 2560,
  quality = 0.86,
): Promise<{ file: File originalSize: number compressedSize: number }> {
  // Không cần nén nếu ảnh dung lượng nhỏ hơn 800KB hoặc không phải JPEG/PNG/WEBP
  if (
    file.size < 800 * 1024 ||
    (!file.type.includes("jpeg") &&
      !file.type.includes("png") &&
      !file.type.includes("webp"))
  ) {
    return { file, originalSize: file.size, compressedSize: file.size }
  }

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img

      // Tính tỷ lệ thu nhỏ nếu vượt quá maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        resolve({ file, originalSize: file.size, compressedSize: file.size })
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: file.lastModified,
            })
            resolve({
              file: compressedFile,
              originalSize: file.size,
              compressedSize: blob.size,
            })
          } else {
            resolve({
              file,
              originalSize: file.size,
              compressedSize: file.size,
            })
          }
        },
        "image/jpeg",
        quality,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ file, originalSize: file.size, compressedSize: file.size })
    }

    img.src = url
  })
}
