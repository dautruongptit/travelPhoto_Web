import { useState, useRef, useCallback } from "react"
import {
  generateId,
  formatFileSize,
  ACCEPTED_TYPES,
  MAX_FILE_SIZE,
} from "../utils"
import { uploadPhotos } from "../api/photos"
import {
  extractExifFromBlob,
  compressImage,
  type ExtractedExif,
} from "../utils/imageProcessing"

interface FileEntry {
  file: File
  id: string
  preview: string
  status: "pending" | "compressing" | "uploading" | "done" | "error" | "skipped"
  progress: number
  error?: string
  duplicateAction?: "skip" | "rename" | "replace"
  isDuplicate?: boolean
  newName?: string
  exif?: ExtractedExif
  originalSize: number
  compressedSize?: number
}

interface Props {
  eventId: number
  existingPhotoNames: string[]
  onClose: () => void
  onUploaded: (uploadedCount: number) => void
}

const ACCEPTED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".heic"]

export default function UploadModal({
  eventId,
  existingPhotoNames,
  onClose,
  onUploaded,
}: Props) {
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [autoCompress, setAutoCompress] = useState(true)
  const [isPublic, setIsPublic] = useState(true)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files)
      const newEntries: FileEntry[] = []

      for (const f of arr) {
        const id = generateId()
        let error: string | undefined
        let isDuplicate = false

        if (
          !ACCEPTED_TYPES.includes(f.type) &&
          !ACCEPTED_EXT.some((ext) => f.name.toLowerCase().endsWith(ext))
        ) {
          error = "Định dạng không được hỗ trợ."
        } else if (f.size > MAX_FILE_SIZE) {
          error = "Ảnh vượt quá 10MB."
        } else if (existingPhotoNames.includes(f.name)) {
          isDuplicate = true
        }

        const preview = URL.createObjectURL(f)
        const entry: FileEntry = {
          id,
          file: f,
          preview,
          status: error ? "error" : "pending",
          progress: 0,
          error,
          isDuplicate,
          originalSize: f.size,
        }

        newEntries.push(entry)
      }

      setEntries((prev) => {
        const allNames = [
          ...existingPhotoNames,
          ...prev.map((e) => e.file.name),
        ]
        return [
          ...prev,
          ...newEntries.map((e) => ({
            ...e,
            isDuplicate: !e.error && allNames.includes(e.file.name),
          })),
        ]
      })

      // Trích xuất EXIF ngầm phía client cho từng ảnh
      for (const entry of newEntries) {
        if (!entry.error) {
          extractExifFromBlob(entry.file).then((exif) => {
            setEntries((prev) =>
              prev.map((e) => (e.id === entry.id ? { ...e, exif } : e)),
            )
          })
        }
      }
    },
    [existingPhotoNames],
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  const setAction = (
    id: string,
    action: "skip" | "rename" | "replace",
    newName?: string,
  ) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, duplicateAction: action, newName } : e,
      ),
    )
  }

  const setActionForAllDuplicates = (action: "skip" | "rename" | "replace") => {
    setEntries((prev) =>
      prev.map((e) => {
        if (!e.isDuplicate || e.duplicateAction) return e
        if (action === "rename") {
          const base = e.file.name.replace(/(\.[^.]+)$/, "")
          const ext = e.file.name.match(/(\.[^.]+)$/)?.[1] || ""
          return {
            ...e,
            duplicateAction: "rename",
            newName: `${base}_copy${ext}`,
          }
        }
        return { ...e, duplicateAction: action }
      }),
    )
  }

  const removeEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const pendingCount = entries.filter(
    (e) => e.status === "pending" && !e.isDuplicate,
  ).length
  const duplicateCount = entries.filter(
    (e) => e.isDuplicate && !e.duplicateAction,
  ).length
  const canUpload =
    pendingCount +
      entries.filter(
        (e) =>
          e.isDuplicate && e.duplicateAction && e.duplicateAction !== "skip",
      ).length >
      0 && !duplicateCount

  const startUpload = async () => {
    if (!canUpload) return
    setIsUploading(true)
    setUploadError(null)

    const uploadable = entries.filter(
      (e) =>
        (e.status === "pending" && !e.isDuplicate) ||
        (e.isDuplicate && e.duplicateAction === "rename") ||
        (e.isDuplicate && e.duplicateAction === "replace") ||
        e.status === "error",
    )
    const uploadableIds = new Set(uploadable.map((e) => e.id))

    // Nén ảnh nếu bật autoCompress
    let processedFiles: File[] = []

    if (autoCompress) {
      setEntries((prev) =>
        prev.map((e) =>
          uploadableIds.has(e.id)
            ? { ...e, status: "compressing", progress: 20 }
            : e,
        ),
      )

      for (const entry of uploadable) {
        const compressed = await compressImage(entry.file, 2560, 0.88)
        const fileToSend =
          entry.isDuplicate &&
          entry.duplicateAction === "rename" &&
          entry.newName
            ? new File([compressed.file], entry.newName, {
                type: compressed.file.type,
              })
            : compressed.file

        processedFiles.push(fileToSend)

        setEntries((prev) =>
          prev.map((e) =>
            e.id === entry.id
              ? {
                  ...e,
                  compressedSize: compressed.compressedSize,
                  progress: 40,
                }
              : e,
          ),
        )
      }
    } else {
      processedFiles = uploadable.map((entry) =>
        entry.isDuplicate && entry.duplicateAction === "rename" && entry.newName
          ? new File([entry.file], entry.newName, { type: entry.file.type })
          : entry.file,
      )
    }

    setEntries((prev) =>
      prev.map((e) =>
        uploadableIds.has(e.id)
          ? { ...e, status: "uploading", progress: 65 }
          : e,
      ),
    )

    try {
      const result = await uploadPhotos(eventId, processedFiles)

      setEntries((prev) =>
        prev.map((e) =>
          uploadableIds.has(e.id) ? { ...e, status: "done", progress: 100 } : e,
        ),
      )
      setEntries((prev) =>
        prev.map((e) =>
          (e.isDuplicate && e.duplicateAction === "skip") ||
          e.status === "error"
            ? { ...e, status: "skipped" }
            : e,
        ),
      )

      setIsUploading(false)
      setDone(true)
      if (result.uploaded > 0) onUploaded(result.uploaded)
    } catch (err) {
      setEntries((prev) =>
        prev.map((e) =>
          uploadableIds.has(e.id)
            ? { ...e, status: "error", progress: 0, error: "Tải lên thất bại" }
            : e,
        ),
      )
      setUploadError(
        err instanceof Error
          ? err.message
          : "Tải ảnh lên thất bại. Vui lòng thử lại.",
      )
      setIsUploading(false)
    }
  }

  const statusIcon = (e: FileEntry) => {
    if (e.status === "done")
      return (
        <span className="text-emerald-500 font-bold text-sm">✓ Hoàn tất</span>
      )
    if (e.status === "compressing")
      return (
        <span className="text-[#0063dc] text-xs animate-pulse">
          ⚡ Đang nén…
        </span>
      )
    if (e.status === "uploading")
      return (
        <svg
          className="animate-spin text-[#ff0084]"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="40 60"
          />
        </svg>
      )
    if (e.status === "error")
      return <span className="text-rose-500 text-xs font-medium">Lỗi</span>
    return null
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isUploading ? onClose : undefined}
      />

      <div className="slide-up relative bg-white dark:bg-[#18181b] rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2">
                <span>Tải ảnh lên</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#0063dc]/10 text-[#0063dc] font-semibold">
                  Flickr Upload
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Hỗ trợ chụp tức thời, tự đọc EXIF và nén thông minh
              </p>
            </div>
            {!isUploading && (
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Drop zone & Instant Camera Trigger */}
        {!done && (
          <div className="px-5 sm:px-6 pt-4 flex-shrink-0">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                isDragging
                  ? "border-[#0063dc] bg-[#0063dc]/5"
                  : "border-neutral-300 dark:border-neutral-700 hover:border-[#0063dc]/60 bg-neutral-50/50 dark:bg-neutral-800/30"
              } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                {/* Nút chụp camera trực tiếp trên điện thoại */}
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0063dc] text-white text-xs sm:text-sm font-semibold hover:bg-[#0052b8] transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>Chụp từ Camera</span>
                </button>

                {/* Nút chọn ảnh từ thư viện */}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs sm:text-sm font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all cursor-pointer"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      d="M12 4v16m8-8H4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>Chọn ảnh từ máy</span>
                </button>
              </div>

              <p className="text-xs text-neutral-400">
                hoặc kéo thả nhiều ảnh trực tiếp vào đây (JPG, PNG, WEBP, HEIC)
              </p>

              {/* Input file bình thường */}
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,.heic"
                hidden
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files)
                  e.target.value = ""
                }}
              />

              {/* Input camera tức thời trên thiết bị di động */}
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files)
                  e.target.value = ""
                }}
              />
            </div>

            {/* Tùy chọn Nén ảnh & Quyền riêng tư */}
            <div className="flex items-center justify-between mt-3 text-xs text-neutral-600 dark:text-neutral-400 px-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoCompress}
                  onChange={(e) => setAutoCompress(e.target.checked)}
                  className="rounded text-[#0063dc] focus:ring-0"
                />
                <span>Tối ưu nén ảnh client-side (Tải nhanh gấp 3x)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded text-[#0063dc] focus:ring-0"
                />
                <span>Chế độ: {isPublic ? "🌐 Công khai" : "🔒 Riêng tư"}</span>
              </label>
            </div>
          </div>
        )}

        {/* File Queue List */}
        {entries.length > 0 && (
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-3 space-y-2.5 min-h-0">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-800"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-200 dark:bg-neutral-700 flex-shrink-0 relative">
                  <img
                    src={entry.preview}
                    alt={entry.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* File Details & EXIF */}
                <div className="flex-1 min-w-0 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200 truncate max-w-[240px]">
                      {entry.file.name}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {statusIcon(entry)}
                      {!isUploading && !done && (
                        <button
                          onClick={() => removeEntry(entry.id)}
                          className="text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    <span>{formatFileSize(entry.originalSize)}</span>
                    {entry.compressedSize &&
                      entry.compressedSize < entry.originalSize && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          → {formatFileSize(entry.compressedSize)} (-
                          {Math.round(
                            (1 - entry.compressedSize / entry.originalSize) *
                              100,
                          )}
                          %)
                        </span>
                      )}
                    {entry.exif?.cameraModel && (
                      <span className="truncate">
                        · 📷 {entry.exif.cameraModel}
                      </span>
                    )}
                  </div>

                  {/* Duplicate warning */}
                  {entry.isDuplicate && !entry.duplicateAction && (
                    <div className="mt-1.5 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-700 dark:text-amber-300">
                      <p className="font-medium text-[11px] mb-1">
                        Ảnh đã tồn tại trên sự kiện:
                      </p>
                      <div className="flex gap-1.5">
                        {(["rename", "replace", "skip"] as const).map(
                          (action) => (
                            <button
                              key={action}
                              onClick={() => {
                                if (action === "rename") {
                                  const base = entry.file.name.replace(
                                    /(\.[^.]+)$/,
                                    "",
                                  )
                                  const ext =
                                    entry.file.name.match(/(\.[^.]+)$/)?.[1] ||
                                    ""
                                  setAction(
                                    entry.id,
                                    "rename",
                                    `${base}_copy${ext}`,
                                  )
                                } else {
                                  setAction(entry.id, action)
                                }
                              }}
                              className="px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-[10px] font-medium hover:border-[#0063dc] cursor-pointer"
                            >
                              {action === "rename"
                                ? "Đổi tên"
                                : action === "replace"
                                  ? "Ghi đè"
                                  : "Bỏ qua"}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Progress bar */}
                  {entry.status === "uploading" && (
                    <div className="mt-1.5 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#ff0084] rounded-full transition-all duration-200"
                        style={{ width: `${entry.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Done state */}
        {done && (
          <div className="flex-1 flex flex-col items-center justify-center py-10 gap-3">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center text-emerald-500 text-2xl font-bold">
              ✓
            </div>
            <p className="text-base font-bold text-neutral-900 dark:text-white">
              Đã tải lên thành công!
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {entries.filter((e) => e.status === "done").length} bức ảnh đã
              được thêm vào sự kiện.
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex-shrink-0 px-5 sm:px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
          {uploadError && (
            <p className="text-rose-500 text-xs mb-2 flex items-center gap-1">
              <span>⚠</span> {uploadError}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {entries.filter((e) => e.status !== "skipped").length} ảnh trong
              hàng đợi
            </span>

            <div className="flex items-center gap-2">
              {done ? (
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-full bg-[#0063dc] hover:bg-[#0052b8] text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                >
                  Xong
                </button>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    disabled={isUploading}
                    className="px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs sm:text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={startUpload}
                    disabled={!canUpload || isUploading || entries.length === 0}
                    className="px-5 py-2 rounded-full bg-[#ff0084] hover:bg-[#e00074] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                  >
                    {isUploading
                      ? "Đang xử lý & tải…"
                      : `Tải lên ${pendingCount} ảnh`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
