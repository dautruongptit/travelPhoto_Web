import { apiFetch, API_BASE_URL, setToken, clearToken } from "./apiClient"

import type { User } from "../types"

// Endpoint bắt đầu OAuth2 KHÔNG nằm dưới "/api" (đây là route mặc định của Spring

// Security OAuth2 Client, ở gốc domain), nên phải tách lấy origin ra khỏi

// VITE_API_BASE_URL (bỏ phần "/api") thay vì dùng chung base như các API khác.

// Dùng window.location.origin làm base thứ 2 để new URL() không lỗi khi

// VITE_API_BASE_URL là đường dẫn tương đối (vd "/api" lúc chạy qua Nginx proxy).

const API_ORIGIN = new URL(API_BASE_URL, window.location.origin).origin

const OAUTH2_LOGIN_PATH =
  import.meta.env.VITE_OAUTH2_LOGIN_PATH ?? "/oauth2/authorization/google"

/** Field thật trả về từ GET /api/auth/me (UserResponse.java) */

interface UserResponseDto {
  id: number

  email: string

  emailVerified: boolean

  fullName: string

  avatarUrl: string

  role: string

  lastLoginAt?: string

  lastLoginIp?: string
}

function mapUser(dto: UserResponseDto): User {
  return {
    id: String(dto.id),

    name: dto.fullName,

    email: dto.email,

    avatar: dto.avatarUrl,
  }
}

/**
 * URL để CHUYỂN HƯỚNG TOÀN TRANG sang Google đăng nhập — không phải popup.
 * Dùng: window.location.href = getGoogleLoginUrl()
 *
 * Backend sẽ tự xử lý toàn bộ OAuth2 với Google, sau đó redirect trình duyệt về
 * "{FRONTEND_URL}/oauth2/callback?token=<accessToken>" — App.tsx cần đọc token
 * từ query string ở route này (xem xử lý trong App.tsx).
 */

export function getGoogleLoginUrl(): string {
  return `${API_ORIGIN}${OAUTH2_LOGIN_PATH}`
}

/** GET /api/auth/me — lấy thông tin user hiện tại từ access token. */

export async function fetchCurrentUser(): Promise<User> {
  const dto = await apiFetch<UserResponseDto>("/auth/me", { method: "GET" })

  return mapUser(dto)
}

/**
 * POST /api/auth/refresh — dùng cookie httpOnly "refresh_token" (trình duyệt tự
 * gửi kèm nhờ credentials: 'include' trong apiClient) để lấy access token mới.
 * Gọi khi access token hết hạn (JWT access token chỉ sống 30 phút ở backend này).
 */

export async function refreshAccessToken(): Promise<string> {
  const data = await apiFetch<{ accessToken: string }>("/auth/refresh", {
    method: "POST",

    auth: false,
  })

  setToken(data.accessToken)

  return data.accessToken
}

/** POST /api/auth/logout — thu hồi refresh token ở backend, rồi xóa access token local. */

export async function logout(): Promise<void> {
  try {
    await apiFetch("/auth/logout", { method: "POST" })
  } finally {
    clearToken()
  }
}
