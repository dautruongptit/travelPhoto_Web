import { useState } from "react"

import type { StoragePlan } from "../types"

import { storagePlans } from "../mockData"

import { formatCurrency, formatTotalSize } from "../utils"

interface Props {
  usedBytes: number

  limitBytes: number

  onClose: () => void

  onProceedToCheckout: (plan: StoragePlan) => void
}

export default function UpgradeModal({
  usedBytes,
  limitBytes,
  onClose,
  onProceedToCheckout,
}: Props) {
  const [selectedId, setSelectedId] = useState<string>(
    storagePlans.find((p) => p.badge === "Phổ biến nhất")?.id ??
      storagePlans[0].id,
  )

  const usedPercent = Math.min(100, Math.round((usedBytes / limitBytes) * 100))

  const selectedPlan = storagePlans.find((p) => p.id === selectedId)!

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="slide-up relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                Nâng cấp dung lượng lưu trữ
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Lưu trữ nhiều ảnh hơn, không lo hết dung lượng.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xl"
            >
              ×
            </button>
          </div>

          {/* Storage usage bar */}
          <div className="mt-4 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mb-1.5">
              <span>
                Đã dùng {formatTotalSize(usedBytes)} /{" "}
                {formatTotalSize(limitBytes)}
              </span>
              <span className="font-medium">{usedPercent}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usedPercent >= 90
                    ? "bg-red-500"
                    : usedPercent >= 70
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                }`}
                style={{ width: `${usedPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {storagePlans.map((plan) => {
              const isSelected = plan.id === selectedId

              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedId(plan.id)}
                  className={`relative text-left rounded-2xl border-2 p-4 transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-md shadow-blue-100 dark:shadow-none"
                      : "border-gray-200 dark:border-gray-700 hover:border-blue-300 bg-white dark:bg-gray-900"
                  }`}
                >
                  {plan.badge && (
                    <span className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-semibold shadow-sm">
                      {plan.badge}
                    </span>
                  )}
                  {plan.discountPercent > 0 && (
                    <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-[11px] font-semibold">
                      -{plan.discountPercent}%
                    </span>
                  )}

                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                    {plan.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {plan.storageGB} GB lưu trữ
                  </p>

                  <div className="mt-3">
                    {plan.discountPercent > 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 line-through">
                        {formatCurrency(plan.originalPricePerMonth)}/tháng
                      </p>
                    )}
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(plan.pricePerMonth)}
                      <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                        /tháng
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Thanh toán {formatCurrency(plan.totalPrice)} /{" "}
                      {plan.durationMonths} tháng
                    </p>
                  </div>

                  <div
                    className={`mt-3 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-blue-600 bg-blue-600"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <ul className="mt-5 space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
            {[
              "Lưu trữ ảnh gốc, không nén chất lượng",

              "Chia sẻ album không giới hạn thành viên",

              "Ưu tiên hỗ trợ qua hotline",

              "Hủy bất kỳ lúc nào, không tự động gia hạn",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2">
                <svg
                  className="text-green-500 flex-shrink-0"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M20 6 9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Tổng thanh toán:{" "}
            </span>
            <span className="font-bold text-gray-900 dark:text-white">
              {formatCurrency(selectedPlan.totalPrice)}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Để sau
            </button>
            <button
              onClick={() => onProceedToCheckout(selectedPlan)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-all shadow-sm hover:shadow-md hover:shadow-blue-200 flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect
                  x="2"
                  y="5"
                  width="20"
                  height="14"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
              </svg>
              Thanh toán qua VNPay
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
