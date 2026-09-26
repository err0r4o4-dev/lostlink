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
  analysis_data?: unknown
  created_at: string
}

interface ChatTurnResponse {
  session: ChatSession
  user_message: ChatMessage
  ai_message: ChatMessage
}

function turnBody(message: string, clientTurnId: string) {
  return JSON.stringify({ message, client_turn_id: clientTurnId })
}

export function listSessions(request: AuthorizedRequest) {
  return request<{ sessions: ChatSession[] }>('/v1/chats')
}

export function createSession(request: AuthorizedRequest, message: string, clientTurnId: string, signal?: AbortSignal) {
  return request<ChatTurnResponse>('/v1/chats', {
    method: 'POST',
    body: turnBody(message, clientTurnId),
    signal,
  })
}

export function deleteSession(request: AuthorizedRequest, sessionId: string) {
  return request(`/v1/chats/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  })
}

export function listMessages(request: AuthorizedRequest, sessionId: string) {
  return request<{ messages: ChatMessage[] }>(`/v1/chats/${encodeURIComponent(sessionId)}/messages`)
}

export function sendMessage(
  request: AuthorizedRequest,
  sessionId: string,
  message: string,
  clientTurnId: string,
  signal?: AbortSignal,
) {
  return request<ChatTurnResponse>(`/v1/chats/${encodeURIComponent(sessionId)}/messages`, {
    method: 'POST',
    body: turnBody(message, clientTurnId),
    signal,
  })
}

export function editMessage(
  request: AuthorizedRequest,
  sessionId: string,
  messageId: string,
  message: string,
  clientTurnId: string,
  signal?: AbortSignal,
) {
  return request<ChatTurnResponse>(
    `/v1/chats/${encodeURIComponent(sessionId)}/messages/${encodeURIComponent(messageId)}`,
    {
      method: 'PUT',
      body: turnBody(message, clientTurnId),
      signal,
    },
  )
}
