import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Send, MessageSquare, Loader2, Plus, Trash2, Sparkles, Copy, Check, Pencil } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageContainer, Card, Button } from '../components/ui'
import { ApiError } from '../api/client'
import { useAuth } from '../features/auth/auth-state'
import { listSessions, createSession, listMessages, sendMessage, deleteSession, editMessage } from '../features/chat/chat-api'
import type { ChatMessage } from '../features/chat/chat-api'
import { useLanguage } from '../i18n/language'

interface CreateTurn {
  kind: 'create'
  content: string
  clientTurnId: string
}

interface SendTurn {
  kind: 'send'
  content: string
  clientTurnId: string
  sessionId: string
}

interface EditTurn {
  kind: 'edit'
  content: string
  clientTurnId: string
  sessionId: string
  messageId: string
}

type LocalTurn = CreateTurn | SendTurn | EditTurn
type AbortableTurn<T extends LocalTurn> = T & { controller: AbortController }

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function failedTurnMessage(error: unknown) {
  return error instanceof ApiError && error.code === 'ai_temporarily_unavailable'
    ? 'Sorry, AI is temporarily unavailable. This message was not sent or saved. Please try again.'
    : 'Sorry, this message could not be sent. It was not saved. Please try again.'
}

export function AIChatPage() {
  const { request } = useAuth()
  const { translate } = useLanguage()
  const queryClient = useQueryClient()

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [localTurn, setLocalTurn] = useState<LocalTurn | null>(null)
  const [failedTurn, setFailedTurn] = useState<LocalTurn | null>(null)
  const [failureMessage, setFailureMessage] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const activeRequestControllerRef = useRef<AbortController | null>(null)

  useEffect(() => () => activeRequestControllerRef.current?.abort(), [])

  const beginRequest = () => {
    const controller = new AbortController()
    activeRequestControllerRef.current = controller
    return controller
  }

  const finishRequest = (controller: AbortController) => {
    if (activeRequestControllerRef.current === controller) {
      activeRequestControllerRef.current = null
    }
  }

  const handleCopy = (text: string, id: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Fetch sessions
  const { data: sessionsData, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => listSessions(request),
    enabled: !!request,
  })

  // Fetch active session messages
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['chat-messages', activeSessionId],
    queryFn: () => listMessages(request, activeSessionId!),
    enabled: !!request && !!activeSessionId,
  })

  const createMutation = useMutation({
    mutationFn: ({ content, clientTurnId, controller }: AbortableTurn<CreateTurn>) => (
      createSession(request, content, clientTurnId, controller.signal)
    ),
    onSuccess: (data) => {
      queryClient.setQueryData<{ messages: ChatMessage[] }>(['chat-messages', data.session.id], {
        messages: [data.user_message, data.ai_message],
      })
      void queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
      setActiveSessionId(data.session.id)
      setLocalTurn(null)
      setFailedTurn(null)
      setFailureMessage(null)
    },
    onError: async (error, { content, clientTurnId }) => {
      await queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
      if (isAbortError(error)) {
        setInput(content)
        setLocalTurn(null)
        setFailedTurn(null)
        setFailureMessage(null)
        return
      }
      setFailedTurn({ kind: 'create', content, clientTurnId })
      setFailureMessage(failedTurnMessage(error))
    },
    onSettled: (_, __, { controller }) => finishRequest(controller),
  })

  const sendMutation = useMutation({
    mutationFn: ({ sessionId, content, clientTurnId, controller }: AbortableTurn<SendTurn>) => (
      sendMessage(request, sessionId, content, clientTurnId, controller.signal)
    ),
    onSuccess: (data, { sessionId }) => {
      queryClient.setQueryData<{ messages: ChatMessage[] }>(['chat-messages', sessionId], (current) => {
        const messages = (current?.messages ?? []).filter((message) => (
          message.id !== data.user_message.id && message.id !== data.ai_message.id
        ))
        return { messages: [...messages, data.user_message, data.ai_message] }
      })
      if (data.session.title !== sessionsData?.sessions?.find(s => s.id === sessionId)?.title) {
        void queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
      }
      setLocalTurn(null)
      setFailedTurn(null)
      setFailureMessage(null)
    },
    onError: async (error, { sessionId, content, clientTurnId }) => {
      await queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] })
      const committed = queryClient.getQueryData<{ messages: ChatMessage[] }>(['chat-messages', sessionId])
        ?.messages.some((message) => message.id === clientTurnId)
      if (committed) {
        setLocalTurn(null)
        setFailedTurn(null)
        setFailureMessage(null)
        return
      }
      if (isAbortError(error)) {
        setInput(content)
        setLocalTurn(null)
        setFailedTurn(null)
        setFailureMessage(null)
        return
      }
      setFailedTurn({ kind: 'send', sessionId, content, clientTurnId })
      setFailureMessage(failedTurnMessage(error))
    },
    onSettled: (_, __, { controller }) => finishRequest(controller),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSession(request, id),
    onSuccess: (_, deletedId) => {
      void queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
      if (activeSessionId === deletedId) {
        setActiveSessionId(null)
      }
    },
  })

  const editMutation = useMutation({
    mutationFn: ({ sessionId, messageId, content, clientTurnId, controller }: AbortableTurn<EditTurn>) => (
      editMessage(request, sessionId, messageId, content, clientTurnId, controller.signal)
    ),
    onSuccess: (data, { sessionId, messageId }) => {
      queryClient.setQueryData<{ messages: ChatMessage[] }>(['chat-messages', sessionId], (current) => {
        if (!current) return current

        if (current.messages.some((message) => message.id === data.user_message.id)) return current

        const cutoffIndex = current.messages.findIndex((message) => message.id === messageId)
        const retainedMessages = cutoffIndex >= 0 ? current.messages.slice(0, cutoffIndex) : current.messages
        return { messages: [...retainedMessages, data.user_message, data.ai_message] }
      })

      if (data.session.title !== sessionsData?.sessions?.find((session) => session.id === sessionId)?.title) {
        void queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
      }
      setLocalTurn(null)
      setFailedTurn(null)
      setFailureMessage(null)
    },
    onError: async (error, { sessionId, messageId, content, clientTurnId }) => {
      await queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] })
      const committed = queryClient.getQueryData<{ messages: ChatMessage[] }>(['chat-messages', sessionId])
        ?.messages.some((message) => message.id === clientTurnId)
      if (committed) {
        setLocalTurn(null)
        setFailedTurn(null)
        setFailureMessage(null)
        return
      }
      if (isAbortError(error)) {
        setEditingMessageId(messageId)
        setEditContent(content)
        setLocalTurn(null)
        setFailedTurn(null)
        setFailureMessage(null)
        return
      }
      setFailedTurn({ kind: 'edit', sessionId, messageId, content, clientTurnId })
      setFailureMessage(failedTurnMessage(error))
    },
    onSettled: (_, __, { controller }) => finishRequest(controller),
  })

  const submitLocalTurn = (turn: LocalTurn) => {
    const controller = beginRequest()
    setLocalTurn(turn)
    setFailedTurn(null)
    setFailureMessage(null)
    if (turn.kind === 'create') createMutation.mutate({ ...turn, controller })
    if (turn.kind === 'send') sendMutation.mutate({ ...turn, controller })
    if (turn.kind === 'edit') editMutation.mutate({ ...turn, controller })
  }

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault()
    if (!input.trim() || isWaiting) return

    const content = input
    setInput('')
    // Reset height of textarea back to single line when sending
    const textarea = document.getElementById('chat-input') as HTMLTextAreaElement
    if (textarea) textarea.style.height = '48px'
    const clientTurnId = crypto.randomUUID()
    submitLocalTurn(activeSessionId
      ? { kind: 'send', sessionId: activeSessionId, content, clientTurnId }
      : { kind: 'create', content, clientTurnId })
  }

  const sessions = sessionsData?.sessions || []
  const messages = messagesData?.messages || []
  const visibleLocalTurn = localTurn && (
    (localTurn.kind === 'create' && activeSessionId === null)
    || (localTurn.kind !== 'create' && localTurn.sessionId === activeSessionId)
  ) ? localTurn : null
  const visibleFailedTurn = visibleLocalTurn && failedTurn?.clientTurnId === visibleLocalTurn.clientTurnId
    ? failedTurn
    : null
  const optimisticCutoffMessageId = visibleLocalTurn?.kind === 'edit' ? visibleLocalTurn.messageId : null
  const cutoffIndex = optimisticCutoffMessageId
    ? messages.findIndex((message) => message.id === optimisticCutoffMessageId)
    : -1
  const visibleMessages = cutoffIndex >= 0 ? messages.slice(0, cutoffIndex) : messages
  const isWaiting = createMutation.isPending || sendMutation.isPending || editMutation.isPending
  const hasMessagesOrPending = visibleMessages.length > 0 || visibleLocalTurn !== null

  const handleEditClick = (msg: ChatMessage) => {
    setEditingMessageId(msg.id)
    setEditContent(msg.content)
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditContent('')
  }

  const handleSaveEdit = (msgId: string) => {
    if (!activeSessionId || !editContent.trim() || isWaiting) return

    const newText = editContent
    setEditingMessageId(null)
    setEditContent('')
    submitLocalTurn({
      kind: 'edit',
      sessionId: activeSessionId,
      messageId: msgId,
      content: newText,
      clientTurnId: crypto.randomUUID(),
    })
  }

  const handleCancelRequest = () => activeRequestControllerRef.current?.abort()

  const handleRetryFailedTurn = () => {
    if (failedTurn) submitLocalTurn(failedTurn)
  }

  const handleEditFailedTurn = () => {
    if (!failedTurn) return
    const turn = failedTurn
    setLocalTurn(null)
    setFailedTurn(null)
    setFailureMessage(null)
    if (turn.kind === 'edit') {
      setEditingMessageId(turn.messageId)
      setEditContent(turn.content)
    } else {
      setInput(turn.content)
    }
  }

  const handleDiscardFailedTurn = () => {
    setLocalTurn(null)
    setFailedTurn(null)
    setFailureMessage(null)
  }

  return (
    <PageContainer>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Sidebar */}
        <div className="hidden w-64 flex-col gap-4 md:flex">
          <Button
            variant="primary"
            className="w-full justify-start"
            onClick={() => setActiveSessionId(null)}
          >
            <Plus className="mr-2 size-4" />
            {translate('New Chat')}
          </Button>

          <div className="flex-1 overflow-y-auto pr-2">
            <h3 className="mb-2 text-xs font-semibold uppercase text-text-secondary">
              {translate('Recent Chats')}
            </h3>
            {isLoadingSessions ? (
              <div className="flex items-center justify-center p-4"><Loader2 className="size-4 animate-spin text-brand" /></div>
            ) : sessions.length === 0 ? (
              <p className="text-caption text-text-secondary">{translate('No recent chats')}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {sessions.map(session => (
                  <button
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`group flex w-full items-center justify-between gap-2 rounded-md p-2 text-left text-sm transition-colors ${
                      activeSessionId === session.id
                        ? 'bg-fill-ui font-medium text-text-primary'
                        : 'text-text-secondary hover:bg-fill-hover hover:text-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <MessageSquare className="size-4 shrink-0" />
                      <span className="truncate">{session.title}</span>
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteMutation.mutate(session.id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation()
                          deleteMutation.mutate(session.id)
                        }
                      }}
                      className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-error-strong"
                      title={translate('Delete chat')}
                    >
                      <Trash2 className="size-4" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <Card className="flex flex-1 flex-col overflow-hidden bg-surface">
          {/* Chat Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border-ui px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  {activeSessionId
                    ? sessions.find(s => s.id === activeSessionId)?.title || translate('AI Assistant')
                    : translate('New Chat')}
                </h2>
                <p className="text-xs text-text-secondary">{translate('AI-assisted discovery')}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="flex w-full flex-col">
              {!hasMessagesOrPending ? (
                <div className="mx-auto flex min-h-[50vh] flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-full bg-brand/10 p-4 text-brand">
                    <MessageSquare className="size-8" />
                  </div>
                  <h2 className="mb-2 text-card font-semibold">{translate('How can I help you find your item?')}</h2>
                  <p className="mb-8 max-w-md text-text-secondary">
                    {translate('Describe the item you are looking for. AI only assists with discovery and similarity ranking.')}
                  </p>

                  {/* Suggested Prompts */}
                  <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2 text-left">
                    {[
                      translate('I lost my black leather wallet at the cafeteria.'),
                      translate('Did anyone find a Honda car key today?'),
                      translate('Looking for a student ID card lost yesterday.'),
                      translate('How does the item claiming process work?'),
                    ].map(text => (
                      <button
                        key={text}
                        onClick={() => {
                          setInput(text)
                          // Optional: focus input or auto-submit here
                        }}
                        className="flex items-start gap-3 rounded-xl border border-border-ui p-4 transition-colors hover:bg-fill-hover"
                      >
                        <MessageSquare className="mt-0.5 size-4 shrink-0 text-brand/60" />
                        <span className="text-sm text-text-secondary">{text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {isLoadingMessages ? (
                     <div className="flex justify-center p-4"><Loader2 className="size-6 animate-spin text-brand" /></div>
                  ) : (
                    visibleMessages.map((msg) => {
                      if (editingMessageId === msg.id) {
                        return (
                          <div key={msg.id} className="ml-auto flex w-full max-w-[85%] flex-row-reverse items-start gap-3">
                            <div className="flex flex-col w-full items-end gap-2">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full min-h-[100px] resize-y rounded-2xl border border-border-ui bg-surface p-4 text-text-primary shadow-sm outline-none focus:border-brand"
                                autoFocus
                              />
                              <div className="flex items-center gap-2">
                                <Button variant="secondary" size="compact" onClick={handleCancelEdit}>
                                  {translate('Cancel')}
                                </Button>
                                <Button size="compact" onClick={() => handleSaveEdit(msg.id)} disabled={!editContent.trim()}>
                                  {translate('Send')}
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      }

                      return (
                      <div
                        key={msg.id}
                        className={`flex w-full items-start gap-3 ${
                          msg.role === 'user' ? 'ml-auto max-w-[85%] flex-row-reverse' : 'mr-auto max-w-[90%]'
                        }`}
                      >
                        {/* Avatar */}
                        {msg.role !== 'user' && (
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full mt-1 bg-brand/10 text-brand">
                            <Sparkles className="size-5" />
                          </div>
                        )}

                        {/* Message Bubble */}
                        <div className={`flex flex-col group ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`flex flex-col rounded-2xl px-5 py-3.5 ${
                              msg.role === 'user'
                                ? 'bg-brand text-white shadow-sm'
                                : 'bg-fill-ui text-text-primary'
                            }`}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>

                          {/* Copy / Edit Button Container */}
                          <div className={`mt-1 flex items-center gap-2 h-6 transition-opacity ${
                            msg.role === 'ai' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}>
                            <button
                              onClick={() => handleCopy(msg.content, msg.id)}
                              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-fill-hover ${
                                copiedId === msg.id ? 'text-success' : 'text-text-tertiary hover:text-text-secondary'
                              }`}
                              title={translate('Copy message')}
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="size-3" />
                                  <span>{translate('Copied!')}</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3" />
                                  <span>{translate('Copy')}</span>
                                </>
                              )}
                            </button>

                            {msg.role === 'user' && (
                              <button
                                onClick={() => handleEditClick(msg)}
                                className="flex items-center gap-1 rounded px-2 py-1 text-xs text-text-tertiary transition-colors hover:bg-fill-hover hover:text-text-secondary"
                                title={translate('Edit message')}
                              >
                                <Pencil className="size-3" />
                                <span>{translate('Edit')}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )})
                  )}

                  {visibleLocalTurn && (
                    <div className="ml-auto flex w-full max-w-[85%] items-start gap-3 flex-row-reverse">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex flex-col rounded-2xl bg-brand px-5 py-3.5 text-white shadow-sm">
                          <p className="whitespace-pre-wrap leading-relaxed">{visibleLocalTurn.content}</p>
                        </div>
                        {visibleFailedTurn && (
                          <p className="text-xs font-semibold text-error-strong" role="status">
                            {translate('Could not send · Not saved')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {isWaiting && visibleLocalTurn && (
                    <div className="mr-auto flex w-full max-w-[90%] items-start gap-3">
                      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                        <Sparkles className="size-5" />
                      </div>
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2 rounded-2xl bg-fill-ui px-5 py-3.5 text-text-secondary">
                          <span className="text-sm font-medium">{translate('Thinking')}</span>
                          <span className="animate-typing-dot text-sm font-medium"></span>
                        </div>
                      </div>
                    </div>
                  )}

                  {visibleFailedTurn && !isWaiting && (
                    <div className="mr-auto flex w-full max-w-[90%] items-start gap-3" role="alert">
                      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-error/10 text-error-strong">
                        <AlertCircle aria-hidden="true" className="size-5" />
                      </div>
                      <div className="flex min-w-0 flex-col items-start gap-3">
                        <div className="rounded-2xl border border-error-strong/20 bg-error/10 px-5 py-3.5 text-text-primary">
                          <p className="text-sm font-medium">
                            {translate(failureMessage ?? 'Sorry, this message could not be sent. It was not saved. Please try again.')}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="compact" onClick={handleRetryFailedTurn}>
                            {translate('Try again')}
                          </Button>
                          <Button variant="secondary" size="compact" onClick={handleEditFailedTurn}>
                            {translate('Edit message')}
                          </Button>
                          <Button variant="ghost" size="compact" onClick={handleDiscardFailedTurn}>
                            {translate('Cancel')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border-ui bg-surface p-4">
            <div className="mx-auto w-full max-w-3xl">
              <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                <label className="min-w-0 flex-1 relative">
                  <span className="sr-only">{translate('Type your message here...')}</span>
                  <textarea
                    id="chat-input"
                    value={input}
                    onChange={e => {
                      setInput(e.target.value);
                      e.target.style.height = '48px'; // Reset height briefly to get true scrollHeight
                      const newHeight = Math.min(e.target.scrollHeight, 200);
                      e.target.style.height = `${newHeight}px`;
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    placeholder={translate('Type your message here...')}
                    rows={1}
                    className="ui-transition block w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-body text-text-primary shadow-card outline-none placeholder:text-text-secondary focus:border-brand disabled:cursor-not-allowed disabled:bg-surface-secondary disabled:text-text-tertiary disabled:shadow-none"
                    style={{
                      height: '48px',
                      minHeight: '48px',
                      maxHeight: '200px',
                      overflowY: input.length === 0 ? 'hidden' : 'auto'
                    }}
                    disabled={isWaiting}
                  />
                </label>
                <Button
                  className="mb-[1px]"
                  type={isWaiting ? 'button' : 'submit'}
                  onClick={isWaiting ? handleCancelRequest : undefined}
                  disabled={!isWaiting && !input.trim()}
                  title={translate(isWaiting ? 'Cancel' : 'Send')}
                >
                  {isWaiting
                    ? <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                    : <Send aria-hidden="true" className="size-4" />}
                  <span className="sr-only">{translate(isWaiting ? 'Cancel' : 'Send')}</span>
                </Button>
              </form>
              <p className="mt-3 text-center text-[11px] text-text-tertiary">
                {translate('AI can make mistakes. Please verify important information with staff.')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
