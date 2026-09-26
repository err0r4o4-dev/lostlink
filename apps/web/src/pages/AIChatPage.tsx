import { useState } from 'react'
import { Send, MessageSquare, Loader2, Plus, Trash2, Sparkles, Copy, Check, Pencil } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageContainer, Card, Button, Input } from '../components/ui'
import { useAuth } from '../features/auth/auth-state'
import { listSessions, createSession, listMessages, sendMessage, deleteSession, rewindSession } from '../features/chat/chat-api'
import type { ChatSession, ChatMessage } from '../features/chat/chat-api'
import { useLanguage } from '../i18n/language'

export function AIChatPage() {
  const { request } = useAuth()
  const { translate } = useLanguage()
  const queryClient = useQueryClient()

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Fetch sessions
  const { data: sessionsData, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => listSessions(request!),
    enabled: !!request,
  })

  // Fetch active session messages
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['chat-messages', activeSessionId],
    queryFn: () => listMessages(request!, activeSessionId!),
    enabled: !!request && !!activeSessionId,
  })

  // Create new session mutation
  const createMutation = useMutation({
    mutationFn: (msg: string) => createSession(request!, msg),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
      setActiveSessionId(data.session.id)
      setInput('')
    },
    onSettled: () => {
      setPendingMessage(null)
    }
  })

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (msg: string) => sendMessage(request!, activeSessionId!, msg),
    onSuccess: (data) => {
      // Invalidate to fetch latest
      queryClient.invalidateQueries({ queryKey: ['chat-messages', activeSessionId] })
      // If title was generated/updated, we should refresh sessions too
      if (data.session.title !== sessionsData?.sessions?.find(s => s.id === activeSessionId)?.title) {
        queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
      }
    },
    onSettled: () => {
      setPendingMessage(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSession(request!, id),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] })
      if (activeSessionId === deletedId) {
        setActiveSessionId(null)
      }
    },
  })

  // Rewind chat mutation
  const rewindMutation = useMutation({
    mutationFn: (msgId: string) => rewindSession(request!, activeSessionId!, msgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', activeSessionId] })
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || createMutation.isPending || sendMutation.isPending) return

    if (!activeSessionId) {
      setPendingMessage(input)
      createMutation.mutate(input)
      setInput('')
    } else {
      // Optimistic UX for existing chat
      setPendingMessage(input)
      sendMutation.mutate(input)
      setInput('')
    }
  }

  const sessions = sessionsData?.sessions || []
  const messages = messagesData?.messages || []
  const isWaiting = createMutation.isPending || sendMutation.isPending
  const hasMessagesOrPending = messages.length > 0 || pendingMessage !== null

  const handleEditClick = (msg: ChatMessage) => {
    setEditingMessageId(msg.id)
    setEditContent(msg.content)
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditContent('')
  }

  const handleSaveEdit = async (msgId: string) => {
    if (!editContent.trim()) return

    const newText = editContent
    setEditingMessageId(null)
    setEditContent('')
    setPendingMessage(newText)

    // Fire rewind first, then send new message
    try {
      await rewindSession(request!, activeSessionId!, msgId)
      sendMutation.mutate(newText)
    } catch (e) {
      // Revert if rewind fails
      setPendingMessage(null)
    }
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
                    messages.map((msg) => {
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
                                <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
                                  {translate('Cancel')}
                                </Button>
                                <Button size="sm" onClick={() => handleSaveEdit(msg.id)} disabled={!editContent.trim()}>
                                  {translate('Save & Submit')}
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

                  {pendingMessage && (
                    <div className="ml-auto flex w-full max-w-[85%] items-start gap-3 flex-row-reverse">
                      <div className="flex flex-col items-end">
                        <div className="flex flex-col rounded-2xl bg-brand px-5 py-3.5 text-white shadow-sm">
                          <p className="whitespace-pre-wrap leading-relaxed">{pendingMessage}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isWaiting && (
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
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border-ui bg-surface p-4">
            <div className="mx-auto w-full max-w-3xl">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={translate('Type your message here...')}
                  className="flex-1"
                  disabled={isWaiting}
                />
                <Button type="submit" disabled={!input.trim() || isWaiting}>
                  <Send className="size-4" />
                  <span className="sr-only">{translate('Send')}</span>
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
