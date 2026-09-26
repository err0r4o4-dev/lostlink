import type { AuthorizedRequest } from '../auth/auth-state'

export interface ChatSession {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: 'user' | 'ai' | 'system'
  content: string
  analysis_data?: any
  created_at: string
}

export function listSessions(request: AuthorizedRequest) {
  return request<{ sessions: ChatSession[] }>('/v1/chats')
}

export function createSession(request: AuthorizedRequest, message: string) {
  return request<{
    session: ChatSession
    user_message: ChatMessage
    ai_message: ChatMessage
  }>('/v1/chats', {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}

export function deleteSession(request: AuthorizedRequest, sessionId: string) {
  return request(`/v1/chats/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  })
}

export function rewindSession(request: AuthorizedRequest, sessionId: string, messageId: string) {
  return request(`/v1/chats/${encodeURIComponent(sessionId)}/messages/${encodeURIComponent(messageId)}/rewind`, {
    method: 'DELETE',
  })
}

export function listMessages(request: AuthorizedRequest, sessionId: string) {
  return request<{ messages: ChatMessage[] }>(`/v1/chats/${encodeURIComponent(sessionId)}/messages`)
}

export function sendMessage(request: AuthorizedRequest, sessionId: string, message: string) {
  return request<{
    session: ChatSession
    user_message: ChatMessage
    ai_message: ChatMessage
  }>(`/v1/chats/${encodeURIComponent(sessionId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
}
