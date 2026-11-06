import type { StoragePlan } from "./types"

const BASE_PRICE = 25000 // VNĐ/tháng gốc, dùng để tính giá gạch ngang của các gói dài hơn

export const storagePlans: StoragePlan[] = [
  {
    id: "plan-1w",

    durationDays: 7,

    label: "1 tuần",

    storageGB: 100,

    totalPrice: 10000,

    originalPrice: 10000,

    discountPercent: 0,
  },

  {
    id: "plan-1m",

    durationDays: 30,

    label: "1 tháng",

    storageGB: 100,

    totalPrice: BASE_PRICE,

    originalPrice: BASE_PRICE,

    discountPercent: 0,
  },

  {
    id: "plan-6m",

    durationDays: 180,

    label: "6 tháng",

    storageGB: 200,

    totalPrice: Math.round(BASE_PRICE * 0.8) * 6,

    originalPrice: BASE_PRICE * 6,

    discountPercent: 20,

    badge: "Phổ biến nhất",
  },

  {
    id: "plan-1y",

    durationDays: 365,

    label: "1 năm",

    storageGB: 200,

    totalPrice: Math.round(BASE_PRICE * 0.65) * 12,

    originalPrice: BASE_PRICE * 12,

    discountPercent: 35,

    badge: "Tiết kiệm nhất",
  },
]
