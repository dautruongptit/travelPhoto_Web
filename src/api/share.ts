// src/api/share.ts

import { apiGet, apiPost, apiPut, apiDelete } from "./client"

import type { EventResponse } from "./events"

import type { PhotoResponse } from "./photos"

/**
 * Vai trò khi tham gia 1 Event qua share link / lời mời (Event Membership API,
 * shipped 2026-08-16). VIEWER chỉ xem, EDITOR được thêm quyền upload ảnh.
 */

export type EventMemberRole = "VIEWER" | "EDITOR"

export interface ShareLinkResponse {
  id: number

  token: string

  shareUrl: string

  expiredAt: string // ISO datetime

  active: boolean

  role: EventMemberRole

  createdAt: string // ISO datetime
}

export interface MemberResponse {
  id: number
  userId: number
  userName: string
  email: string
  avatarUrl: string | null
  role: EventMemberRole
  joinedAt: string // ISO datetime
}

interface Page<T> {
  content: T[]

  totalElements: number

  totalPages: number

  number: number

  size: number
}

/** role mặc định VIEWER nếu không truyền — khớp backend (query param "role" optional). */

export const createShareLink = (eventId: number, role?: EventMemberRole) =>
  apiPost<ShareLinkResponse>(
    `/events/${eventId}/share${role ? `?role=${role}` : ""}`,
  )

/** Public — không cần đăng nhập */

export const getSharedEvent = (token: string) =>
  apiGet<EventResponse>(`/share/${token}`)

export const getSharedPhotos = (token: string, page = 0, size = 20) =>
  apiGet<Page<PhotoResponse>>(
    `/share/${token}/photos?page=${page}&size=${size}`,
  )

export const revokeShareLink = (token: string) =>
  apiDelete<void>(`/share/${token}`)

/**
 * User đã đăng nhập bấm "tham gia" trên link chia sẻ -> trở thành member với
 * đúng role link đó được tạo. Gọi lại nhiều lần vô hại (no-op nếu đã là
 * member hoặc là chủ sự kiện). Trả về id của event vừa tham gia.
 */

export const joinShareLink = (token: string) =>
  apiPost<number>(`/share/${token}/join`)

export const listShareLinks = (eventId: number) =>
  apiGet<ShareLinkResponse[]>(`/events/${eventId}/shares`)

export const revokeShareLinkById = (eventId: number, linkId: number) =>
  apiDelete<void>(`/events/${eventId}/shares/${linkId}`)

export const listMembers = (eventId: number) =>
  apiGet<MemberResponse[]>(`/events/${eventId}/members`)

export const removeMember = (eventId: number, userId: number) =>
  apiDelete<void>(`/events/${eventId}/members/${userId}`)

export const changeMemberRole = (
  eventId: number,
  userId: number,
  role: EventMemberRole,
) => apiPut<void>(`/events/${eventId}/members/${userId}/role?role=${role}`)
