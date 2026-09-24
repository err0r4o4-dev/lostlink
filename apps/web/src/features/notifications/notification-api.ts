import type { PageOptions, Pagination } from '../../api/types'
import { pageQuery } from '../../api/types'
import type { AuthorizedRequest } from '../auth/auth-state'

export interface NotificationRecord {
  id: string
  notification_type: string
  title: string
  message: string
  related_path?: string
  read_at?: string
  created_at: string
}

export interface NotificationPage {
  notifications: NotificationRecord[]
  pagination: Pagination
}

export function listNotifications(request: AuthorizedRequest, options?: PageOptions) {
  return request<NotificationPage>(`/v1/notifications${pageQuery(options)}`)
}

export function markNotificationRead(request: AuthorizedRequest, notificationId: string) {
  return request<{ notification: NotificationRecord }>(`/v1/notifications/${encodeURIComponent(notificationId)}/read`, { method: 'POST' })
}

export function markAllNotificationsRead(request: AuthorizedRequest) {
  return request<void>('/v1/notifications/read-all', { method: 'POST' })
}
