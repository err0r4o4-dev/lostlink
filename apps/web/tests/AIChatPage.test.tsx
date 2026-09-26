import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '../src/api/client'
import type { ChatMessage, ChatSession } from '../src/features/chat/chat-api'
import { AuthContext, type AuthContextValue, type AuthorizedRequest } from '../src/features/auth/auth-state'
import { AIChatPage } from '../src/pages/AIChatPage'

interface TurnResponse {
  session: ChatSession
  user_message: ChatMessage
  ai_message: ChatMessage
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}

function renderChat(requestMock: ReturnType<typeof vi.fn>) {
  const authValue: AuthContextValue = {
    accessToken: 'test-access',
    user: { id: 'user-1', identifier: 'student@example.edu', role: 'user', created_at: '2026-09-26T08:00:00Z' },
    isLoading: false,
    request: requestMock as AuthorizedRequest,
    requestBlob: () => Promise.resolve(new Blob()),
    authenticate: () => Promise.resolve(),
    logout: () => Promise.resolve(),
  }
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })

  render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>
        <MemoryRouter>
          <AIChatPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )
  return queryClient
}

function requestBody(init?: RequestInit) {
  if (typeof init?.body !== 'string') throw new Error('Expected a JSON request body')
  return JSON.parse(init.body) as { message: string; client_turn_id: string }
}

function chatFixture(id = 'session-1') {
  const session: ChatSession = {
    id,
    user_id: 'user-1',
    title: 'Timeline test',
    created_at: '2026-09-26T08:00:00Z',
    updated_at: '2026-09-26T08:00:00Z',
  }
  const messages: ChatMessage[] = [
    { id: 'user-1', session_id: session.id, role: 'user', content: 'First question', created_at: '2026-09-26T08:00:00Z' },
    { id: 'ai-1', session_id: session.id, role: 'ai', content: 'First reply', created_at: '2026-09-26T08:00:01Z' },
    { id: 'user-2', session_id: session.id, role: 'user', content: 'Future question', created_at: '2026-09-26T08:00:02Z' },
    { id: 'ai-2', session_id: session.id, role: 'ai', content: 'Future reply', created_at: '2026-09-26T08:00:03Z' },
  ]
  return { session, messages }
}

describe('AIChatPage message turns', () => {
  it('keeps future messages while editing, then uses one atomic request after optimistic cutoff', async () => {
    const user = userEvent.setup()
    const { session, messages } = chatFixture()
    const editRequest = deferred<TurnResponse>()
    const requestMock = vi.fn((path: string, init?: RequestInit): Promise<unknown> => {
      if (path === '/v1/chats' && !init) return Promise.resolve({ sessions: [session] })
      if (path === `/v1/chats/${session.id}/messages` && !init) return Promise.resolve({ messages })
      if (path === `/v1/chats/${session.id}/messages/${messages[0].id}` && init?.method === 'PUT') return editRequest.promise
      return Promise.reject(new Error(`Unexpected request: ${init?.method ?? 'GET'} ${path}`))
    })
    renderChat(requestMock)

    await user.click(await screen.findByRole('button', { name: session.title }))
    expect(await screen.findByText('Future reply')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    const editBox = screen.getByDisplayValue('First question')
    expect(screen.getByText('First reply')).toBeInTheDocument()
    expect(screen.getByText('Future question')).toBeInTheDocument()
    expect(screen.getByText('Future reply')).toBeInTheDocument()

    await user.clear(editBox)
    await user.type(editBox, 'Edited first question')
    await user.click(within(editBox.parentElement!).getByRole('button', { name: 'Send' }))

    expect(screen.queryByText('First reply')).not.toBeInTheDocument()
    expect(screen.queryByText('Future question')).not.toBeInTheDocument()
    expect(screen.queryByText('Future reply')).not.toBeInTheDocument()
    expect(screen.getByText('Edited first question')).toBeInTheDocument()
    expect(screen.getByText('Thinking')).toBeInTheDocument()

    const editCall = requestMock.mock.calls.find(([path, init]) => (
      path === `/v1/chats/${session.id}/messages/${messages[0].id}` && init?.method === 'PUT'
    ))
    expect(editCall?.[1]?.signal).toBeInstanceOf(AbortSignal)
    expect(requestBody(editCall?.[1]).message).toBe('Edited first question')
    expect(requestMock.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false)

    const body = requestBody(editCall?.[1])
    await act(() => {
      editRequest.resolve({
        session,
        user_message: { id: body.client_turn_id, session_id: session.id, role: 'user', content: body.message, created_at: '2026-09-26T08:00:04Z' },
        ai_message: { id: 'ai-edited', session_id: session.id, role: 'ai', content: 'Edited reply', created_at: '2026-09-26T08:00:05Z' },
      })
      return editRequest.promise
    })

    expect(await screen.findByText('Edited reply')).toBeInTheDocument()
    expect(screen.queryByText('Thinking')).not.toBeInTheDocument()
    expect(screen.queryByText('Future reply')).not.toBeInTheDocument()
  })

  it('turns the submit button into a loading control that cancels the active request', async () => {
    const user = userEvent.setup()
    const { session, messages } = chatFixture('session-cancel')
    let sentSignal: AbortSignal | null = null
    const requestMock = vi.fn((path: string, init?: RequestInit): Promise<unknown> => {
      if (path === '/v1/chats' && !init) return Promise.resolve({ sessions: [session] })
      if (path === `/v1/chats/${session.id}/messages` && !init) return Promise.resolve({ messages })
      if (path === `/v1/chats/${session.id}/messages` && init?.method === 'POST') {
        sentSignal = init.signal instanceof AbortSignal ? init.signal : null
        return new Promise((_, reject) => {
          if (!sentSignal) {
            reject(new Error('Expected an AbortSignal'))
            return
          }
          const rejectAbort = () => reject(new DOMException('The request was aborted', 'AbortError'))
          if (sentSignal.aborted) rejectAbort()
          else sentSignal.addEventListener('abort', rejectAbort, { once: true })
        })
      }
      return Promise.reject(new Error(`Unexpected request: ${init?.method ?? 'GET'} ${path}`))
    })
    renderChat(requestMock)

    await user.click(await screen.findByRole('button', { name: session.title }))
    expect(await screen.findByText('Future reply')).toBeInTheDocument()
    const messageInput = screen.getByRole('textbox', { name: 'Type your message here...' })
    await user.type(messageInput, 'Cancel this request')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    const cancelButton = await screen.findByRole('button', { name: 'Cancel' })
    expect(cancelButton).toBeEnabled()
    expect(cancelButton.querySelector('.animate-spin')).toBeInTheDocument()
    expect(screen.getByText('Thinking')).toBeInTheDocument()
    await user.click(cancelButton)

    await waitFor(() => expect(sentSignal?.aborted).toBe(true))
    expect(await screen.findByRole('button', { name: 'Send' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Cancel this request')).toBeInTheDocument()
    expect(screen.queryByText('Thinking')).not.toBeInTheDocument()
    expect(screen.queryByText('Could not send · Not saved')).not.toBeInTheDocument()
  })

  it('cancels an edited request without losing the draft or original future', async () => {
    const user = userEvent.setup()
    const { session, messages } = chatFixture('session-cancel-edit')
    const requestMock = vi.fn((path: string, init?: RequestInit): Promise<unknown> => {
      if (path === '/v1/chats' && !init) return Promise.resolve({ sessions: [session] })
      if (path === `/v1/chats/${session.id}/messages` && !init) return Promise.resolve({ messages })
      if (path === `/v1/chats/${session.id}/messages/${messages[0].id}` && init?.method === 'PUT') {
        return new Promise((_, reject) => {
          if (!(init.signal instanceof AbortSignal)) {
            reject(new Error('Expected an AbortSignal'))
            return
          }
          const rejectAbort = () => reject(new DOMException('The request was aborted', 'AbortError'))
          if (init.signal.aborted) rejectAbort()
          else init.signal.addEventListener('abort', rejectAbort, { once: true })
        })
      }
      return Promise.reject(new Error(`Unexpected request: ${init?.method ?? 'GET'} ${path}`))
    })
    renderChat(requestMock)

    await user.click(await screen.findByRole('button', { name: session.title }))
    expect(await screen.findByText('Future reply')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    const editBox = screen.getByDisplayValue('First question')
    await user.clear(editBox)
    await user.type(editBox, 'Keep this edited draft')
    await user.click(within(editBox.parentElement!).getByRole('button', { name: 'Send' }))

    expect(screen.queryByText('Future reply')).not.toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(await screen.findByDisplayValue('Keep this edited draft')).toBeInTheDocument()
    expect(screen.getByText('Future reply')).toBeInTheDocument()
    expect(screen.queryByText('Could not send · Not saved')).not.toBeInTheDocument()
  })

  it('keeps a failed turn local-only and retries with the same client turn id', async () => {
    const user = userEvent.setup()
    const { session, messages } = chatFixture('session-retry')
    const retryRequest = deferred<TurnResponse>()
    const sentBodies: Array<{ message: string; client_turn_id: string }> = []
    let attempts = 0
    const requestMock = vi.fn((path: string, init?: RequestInit): Promise<unknown> => {
      if (path === '/v1/chats' && !init) return Promise.resolve({ sessions: [session] })
      if (path === `/v1/chats/${session.id}/messages` && !init) return Promise.resolve({ messages })
      if (path === `/v1/chats/${session.id}/messages` && init?.method === 'POST') {
        attempts++
        sentBodies.push(requestBody(init))
        if (attempts === 1) {
          return Promise.reject(new ApiError(503, 'ai_temporarily_unavailable', 'AI is temporarily unavailable'))
        }
        return retryRequest.promise
      }
      return Promise.reject(new Error(`Unexpected request: ${init?.method ?? 'GET'} ${path}`))
    })
    const queryClient = renderChat(requestMock)

    await user.click(await screen.findByRole('button', { name: session.title }))
    expect(await screen.findByText('Future reply')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Type your message here...' }), 'Retry this message')
    await user.click(screen.getByRole('button', { name: 'Send' }))

    expect(await screen.findByText('Could not send · Not saved')).toBeInTheDocument()
    expect(screen.getByText(/AI is temporarily unavailable/)).toBeInTheDocument()
    const cached = queryClient.getQueryData<{ messages: ChatMessage[] }>(['chat-messages', session.id])
    expect(cached?.messages).toEqual(messages)

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.getByText('Thinking')).toBeInTheDocument()
    expect(sentBodies).toHaveLength(2)
    expect(sentBodies[1].client_turn_id).toBe(sentBodies[0].client_turn_id)

    await act(() => {
      retryRequest.resolve({
        session,
        user_message: { id: sentBodies[0].client_turn_id, session_id: session.id, role: 'user', content: 'Retry this message', created_at: '2026-09-26T08:00:04Z' },
        ai_message: { id: 'ai-retry', session_id: session.id, role: 'ai', content: 'Retry succeeded', created_at: '2026-09-26T08:00:05Z' },
      })
      return retryRequest.promise
    })

    expect(await screen.findByText('Retry succeeded')).toBeInTheDocument()
    expect(screen.getAllByText('Retry this message')).toHaveLength(1)
    expect(screen.queryByText('Could not send · Not saved')).not.toBeInTheDocument()
  })

  it('restores the original future when a failed edit is discarded', async () => {
    const user = userEvent.setup()
    const { session, messages } = chatFixture('session-edit-failure')
    const requestMock = vi.fn((path: string, init?: RequestInit): Promise<unknown> => {
      if (path === '/v1/chats' && !init) return Promise.resolve({ sessions: [session] })
      if (path === `/v1/chats/${session.id}/messages` && !init) return Promise.resolve({ messages })
      if (path === `/v1/chats/${session.id}/messages/${messages[0].id}` && init?.method === 'PUT') {
        return Promise.reject(new ApiError(503, 'ai_temporarily_unavailable', 'AI is temporarily unavailable'))
      }
      return Promise.reject(new Error(`Unexpected request: ${init?.method ?? 'GET'} ${path}`))
    })
    renderChat(requestMock)

    await user.click(await screen.findByRole('button', { name: session.title }))
    expect(await screen.findByText('Future reply')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    const editBox = screen.getByDisplayValue('First question')
    await user.clear(editBox)
    await user.type(editBox, 'Failed edited question')
    await user.click(within(editBox.parentElement!).getByRole('button', { name: 'Send' }))

    expect(await screen.findByText('Could not send · Not saved')).toBeInTheDocument()
    expect(screen.queryByText('Future reply')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(await screen.findByText('Future reply')).toBeInTheDocument()
    expect(screen.queryByText('Failed edited question')).not.toBeInTheDocument()
    expect(screen.queryByText('Could not send · Not saved')).not.toBeInTheDocument()
  })
})
