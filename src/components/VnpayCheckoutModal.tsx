import { useEffect, useRef, useState } from "react"

import type { StoragePlan } from "../types"

import { formatCurrency } from "../utils"

import {
  createVnpayPayment,
  clearPendingOrder,
  type VnpayReturnResult,
} from "../lib/paymentApi"

type Step = "redirecting" | "qr" | "waiting" | "result"

interface Props {
  plan: StoragePlan

  customerName?: string

  onCancel: () => void

  onSuccess: (plan: StoragePlan, result: VnpayReturnResult) => void
}

const QR_DURATION = 10 * 60 // 10 phút, giống thời gian hết hạn mã QR thực tế của VNPay

const DEMO_BANK = "Vietcombank"

function formatCountdown(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0")

  const s = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0")

  return `${m}:${s}`
}

export default function VnpayCheckoutModal({
  plan,
  customerName,
  onCancel,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>("redirecting")

  const [orderId, setOrderId] = useState("")

  const [error, setError] = useState<string | null>(null)

  const [result, setResult] = useState<VnpayReturnResult | null>(null)

  const [qrSecondsLeft, setQrSecondsLeft] = useState(QR_DURATION)

  const [waitSecondsLeft, setWaitSecondsLeft] = useState(3)

  const waitTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Khởi tạo giao dịch

  useEffect(() => {
    let cancelled = false

    createVnpayPayment(plan)

      .then((res) => {
        if (cancelled) return

        setOrderId(res.orderId)

        setTimeout(() => !cancelled && setStep("qr"), 800)
      })

      .catch(() => {
        if (!cancelled)
          setError("Không thể khởi tạo giao dịch. Vui lòng thử lại.")
      })

    return () => {
      cancelled = true
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Đếm ngược thời hạn mã QR

  useEffect(() => {
    if (step !== "qr") return

    const id = setInterval(
      () => setQrSecondsLeft((s) => Math.max(0, s - 1)),
      1000,
    )

    return () => clearInterval(id)
  }, [step])

  // Mô phỏng chờ ngân hàng xác nhận rồi tự động báo thành công

  useEffect(() => {
    if (step !== "waiting") return

    setWaitSecondsLeft(3)

    waitTimer.current = setInterval(() => {
      setWaitSecondsLeft((s) => {
        if (s <= 1) {
          if (waitTimer.current) clearInterval(waitTimer.current)

          const mockResult: VnpayReturnResult = {
            success: true,

            orderId,

            planId: plan.id,

            message: "Giao dịch thành công",

            amount: plan.totalPrice,

            transactionNo: `VNP${Date.now().toString().slice(-9)}`,

            payDate: new Date().toLocaleString("vi-VN"),
          }

          setResult(mockResult)

          setStep("result")

          clearPendingOrder()

          return 0
        }

        return s - 1
      })
    }, 1000)

    return () => {
      if (waitTimer.current) clearInterval(waitTimer.current)
    }
  }, [step, orderId, plan])

  const handleConfirmedPayment = () => setStep("waiting")

  const handleDone = () => {
    if (result) onSuccess(plan, result)
  }

  return (
    <div className="fixed inset-0 z-[90] bg-[#F6F7FB] dark:bg-slate-950 overflow-y-auto fade-in">
      <div className="min-h-full flex flex-col items-center px-4 py-10 sm:py-14">
        {/* Header căn giữa trang */}
        <div className="w-full max-w-sm flex flex-col items-center text-center mb-6">
          <div className="w-11 h-11 rounded-2xl bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect
                x="2"
                y="6"
                width="20"
                height="14"
                rx="2.5"
                stroke="#4F46E5"
                strokeWidth="1.8"
              />
              <path
                d="M2 10h20M6 15h4"
                stroke="#4F46E5"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Thanh toán VNPay
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {step === "result"
              ? result?.success
                ? "Giao dịch đã hoàn tất"
                : "Giao dịch không thành công"
              : step === "waiting"
                ? "Đang chờ xác nhận từ ngân hàng"
                : "Quét mã QR để hoàn tất giao dịch"}
          </p>
        </div>

        {/* Card chính */}
        <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 sm:p-6">
          {/* Redirecting / lỗi khởi tạo */}
          {step === "redirecting" && (
            <div className="py-10 flex flex-col items-center gap-3">
              {error ? (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center text-red-500 text-xl">
                    !
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
                    {error}
                  </p>
                  <button
                    onClick={onCancel}
                    className="mt-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Đóng
                  </button>
                </>
              ) : (
                <>
                  <svg
                    className="animate-spin text-indigo-500"
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="40 60"
                    />
                  </svg>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Đang khởi tạo giao dịch…
                  </p>
                </>
              )}
            </div>
          )}

          {(step === "qr" || step === "waiting") && (
            <>
              {/* Thông tin đơn hàng */}
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl px-3.5 py-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z"
                      fill="white"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    Nâng cấp TripAlbum — Gói {plan.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    Mã ĐH: #{orderId.slice(-8)}
                    {customerName ? ` • ${customerName}` : ""}
                  </p>
                </div>
              </div>

              {/* Số tiền */}
              <div className="text-center mt-5">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Số tiền thanh toán
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(plan.totalPrice)}
                </p>
              </div>

              {/* QR / trạng thái chờ */}
              <div className="mt-5 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col items-center">
                {step === "qr" ? (
                  <div className="w-44 h-44 rounded-2xl bg-white border border-gray-100 shadow-sm p-2.5 grid grid-cols-9 grid-rows-9 gap-0.5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
                    {Array.from({ length: 81 }).map((_, i) => (
                      <div
                        key={i}
                        className={
                          (i * 41 + orderId.length) % 3 === 0
                            ? "bg-gray-900"
                            : "bg-transparent"
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className="w-44 h-44 flex flex-col items-center justify-center gap-2.5">
                    <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 2l8 3v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V5l8-3z"
                          stroke="#4F46E5"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M9 12l2 2 4-4"
                          stroke="#4F46E5"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      Đã nhận QR
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 -mt-1.5">
                      Chờ ngân hàng xác nhận…
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-full px-2.5 py-1 mt-1">
                      <svg
                        className="animate-spin"
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeDasharray="30 70"
                        />
                      </svg>
                      {waitSecondsLeft}s
                    </span>
                  </div>
                )}

                <div className="mt-4 flex items-center gap-1.5">
                  <span className="text-blue-600 font-black text-sm tracking-tight">
                    VNPAY
                  </span>
                  <span className="text-[10px] font-semibold text-red-500 border border-red-200 rounded px-1 py-px">
                    QR
                  </span>
                </div>

                {step === "qr" ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center">
                    Quét bằng ứng dụng ngân hàng hoặc VNPay
                  </p>
                ) : (
                  <p className="text-xs text-indigo-500 mt-1 text-center">
                    {DEMO_BANK} đang xử lý giao dịch…
                  </p>
                )}
              </div>

              {step === "qr" ? (
                <div className="mt-4 flex justify-center">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-full px-3 py-1.5">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="1.8"
                      />
                      <path
                        d="M12 7v5l3.5 2"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Còn lại {formatCountdown(qrSecondsLeft)}
                  </span>
                </div>
              ) : (
                <div className="mt-4 flex justify-center">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 rounded-full px-3 py-1.5">
                    <svg
                      className="animate-spin"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray="30 70"
                      />
                    </svg>
                    Đang xác nhận từ ngân hàng…
                  </span>
                </div>
              )}

              <button
                onClick={handleConfirmedPayment}
                disabled={step === "waiting"}
                className="mt-5 w-full py-3 rounded-2xl bg-gray-700 hover:bg-gray-800 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                Tôi đã thanh toán
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 18l6-6-6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                onClick={onCancel}
                disabled={step === "waiting"}
                className="mt-1 w-full py-2 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-40 transition-colors"
              >
                Hủy
              </button>
            </>
          )}

          {/* Kết quả giao dịch */}
          {step === "result" && result && (
            <div className="flex flex-col items-center text-center py-2">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  result.success
                    ? "bg-green-50 dark:bg-green-950/30 shadow-[0_0_0_10px_rgba(34,197,94,0.08)]"
                    : "bg-red-50 dark:bg-red-950/30"
                }`}
              >
                {result.success ? (
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="#16A34A"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M8 12.5l2.5 2.5L16 9.5"
                      stroke="#16A34A"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="#DC2626"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>

              <p className="text-lg font-bold text-gray-900 dark:text-white mt-4">
                {result.success
                  ? "Thanh toán thành công"
                  : "Thanh toán thất bại"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {result.success
                  ? "Cảm ơn bạn! Giao dịch đã được xác nhận."
                  : "Vui lòng thử lại hoặc chọn phương thức khác."}
              </p>

              {result.success && (
                <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mt-5 text-left text-sm space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 dark:text-gray-500 text-xs flex items-center gap-1.5">
                      <span className="text-gray-300 dark:text-gray-600">
                        #
                      </span>{" "}
                      Mã giao dịch
                    </span>
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      #{result.orderId.slice(-8)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 dark:text-gray-500 text-xs">
                      Mã VNPay
                    </span>
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      {result.transactionNo}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 dark:text-gray-500 text-xs">
                      Thời gian
                    </span>
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      {result.payDate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 dark:text-gray-500 text-xs">
                      Ngân hàng
                    </span>
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      {DEMO_BANK}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2.5 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                      Số tiền
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(result.amount ?? plan.totalPrice)}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleDone}
                className="mt-6 w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-sm font-semibold text-white transition-colors"
              >
                Tiếp tục
              </button>
              {result.success && (
                <button
                  onClick={() => {}}
                  className="mt-2 w-full py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3v13M8 12l4 4 4-4M4 21h16"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Tải hóa đơn
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
