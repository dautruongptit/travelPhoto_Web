import { apiFetch } from "./apiClient"

import type { PaymentOrder, StoragePlan } from "../types"

import { generateId } from "../utils"

const PAYMENT_MODE = import.meta.env.VITE_PAYMENT_MODE ?? "mock"

interface CreatePaymentResponse {
  paymentUrl: string

  orderId: string
}

export interface VnpayReturnResult {
  success: boolean

  orderId: string

  planId?: string

  message: string

  amount?: number

  transactionNo?: string

  payDate?: string
}

const PENDING_ORDER_KEY = "phototrip-pending-order"

export function savePendingOrder(order: PaymentOrder) {
  sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(order))
}

export function readPendingOrder(): PaymentOrder | null {
  const raw = sessionStorage.getItem(PENDING_ORDER_KEY)

  return raw ? JSON.parse(raw) as PaymentOrder : null
}

export function clearPendingOrder() {
  sessionStorage.removeItem(PENDING_ORDER_KEY)
}

/**
 * Tạo giao dịch thanh toán VNPay.
 *
 * Chế độ "real": gọi backend để backend tạo URL thanh toán VNPay hợp lệ (có chữ ký
 * bảo mật vnp_SecureHash — BẮT BUỘC phải làm ở backend vì cần secret key merchant,
 * không được làm ở frontend). Trả về paymentUrl để frontend chuyển hướng toàn trang
 * (window.location.href), đúng theo yêu cầu kỹ thuật của VNPay (không dùng iframe).
 *
 * Contract kỳ vọng ở backend:
 *   POST {API_BASE_URL}/payments/vnpay/create-payment
 *   Body:   { "planId": "plan-6m" }
 *   200 OK: { "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...", "orderId": "PT17...": }
 *
 * Chế độ "mock": không gọi backend, chỉ tạo orderId giả để hiển thị màn hình mô
 * phỏng VNPay ngay trong app — dùng khi chưa có backend/tài khoản merchant thật.
 */

export async function createVnpayPayment(
  plan: StoragePlan,
): Promise<CreatePaymentResponse | { orderId: string }> {
  if (PAYMENT_MODE === "mock") {
    const orderId = `MOCK${Date.now()}${generateId().slice(0, 4).toUpperCase()}`

    savePendingOrder({ orderId, planId: plan.id, amount: plan.totalPrice })

    return { orderId }
  }

  const res = await apiFetch<CreatePaymentResponse>(
    "/payments/vnpay/create-payment",
    {
      method: "POST",

      body: { planId: plan.id },
    },
  )

  savePendingOrder({
    orderId: res.orderId,
    planId: plan.id,
    amount: plan.totalPrice,
  })

  return res
}

/**
 * Xác thực kết quả trả về từ VNPay sau khi người dùng thanh toán xong và bị
 * chuyển hướng ngược lại app (chỉ dùng ở chế độ "real").
 *
 * VNPay redirect kèm query string (vnp_ResponseCode, vnp_TxnRef, vnp_SecureHash...)
 * về đúng "URL nhận kết quả thanh toán" đã khai báo lúc tạo link. Frontend chuyển
 * tiếp toàn bộ query string đó cho backend để backend verify chữ ký (không tự tin
 * vào vnp_ResponseCode hiển thị trên URL vì có thể bị giả mạo).
 *
 * Contract kỳ vọng ở backend:
 *   GET {API_BASE_URL}/payments/vnpay/return?vnp_...（nguyên query string VNPay gửi về)
 *   200 OK: { "success": true, "orderId": "...", "planId": "...", "message": "..." }
 *
 * Lưu ý: đây chỉ là xác nhận để HIỂN THỊ cho người dùng. Nguồn xác nhận đáng tin cậy
 * duy nhất để thực sự cộng dung lượng là endpoint IPN (server-to-server) — xem
 * backend-reference/README.md.
 */

export async function verifyVnpayReturn(
  queryString: string,
): Promise<VnpayReturnResult> {
  return apiFetch<VnpayReturnResult>(`/payments/vnpay/return${queryString}`, {
    method: "GET",
  })
}

export const isMockPaymentMode = PAYMENT_MODE === "mock"
