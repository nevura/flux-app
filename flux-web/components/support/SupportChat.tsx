'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  getOrCreateConversation,
  getMessages,
  sendUserMessage,
  markReadByUser,
  type SupportConversation,
  type SupportMessage,
} from '@/actions/support-chat'

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hoy'
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
}

interface Props {
  onBack?: () => void
}

export default function SupportChat({ onBack }: Props = {}) {
  const [conv, setConv] = useState<SupportConversation | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [mounted, setMounted] = useState(false)
  const bottomRef    = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // Keep overlay sized to visual viewport so iOS keyboard doesn't scroll the header off-screen
  useEffect(() => {
    if (onBack === undefined) return
    const vv = window.visualViewport
    if (!vv) return
    function update() {
      if (!containerRef.current) return
      containerRef.current.style.height = vv!.height + 'px'
      containerRef.current.style.top    = vv!.offsetTop + 'px'
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update) }
  }, [onBack])

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any

    async function init() {
      const conversation = await getOrCreateConversation()
      if (!conversation) { setLoading(false); return }
      setConv(conversation)

      const msgs = await getMessages(conversation.id)
      setMessages(msgs)
      setLoading(false)
      scrollToBottom()

      if (conversation.unread_user > 0) markReadByUser(conversation.id)

      const supabase = createClient()
      channel = supabase
        .channel(`support-chat-${conversation.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `conversation_id=eq.${conversation.id}` },
          (payload) => {
            const msg = payload.new as SupportMessage
            setMessages(prev => {
              // Replace matching optimistic entry to avoid duplicates
              const withoutOpt = prev.filter(m =>
                !(m.id.startsWith('opt-') && m.sender === msg.sender && m.body === msg.body)
              )
              if (withoutOpt.find(m => m.id === msg.id)) return withoutOpt
              return [...withoutOpt, msg]
            })
            scrollToBottom()
            if (msg.sender === 'admin') markReadByUser(conversation.id)
          }
        )
        .subscribe()
    }

    init()
    return () => { channel?.unsubscribe?.() }
  }, [scrollToBottom])

  async function handleSend() {
    if (!conv || !input.trim() || sending) return
    const body = input.trim()
    setInput('')
    setSending(true)

    const optimistic: SupportMessage = {
      id: `opt-${Date.now()}`,
      conversation_id: conv.id,
      sender: 'user',
      body,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    scrollToBottom()

    const { error } = await sendUserMessage(conv.id, body)
    setSending(false)
    if (error) {
      toast.error(error)
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setInput(body)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Group messages by date
  const grouped: { date: string; msgs: SupportMessage[] }[] = []
  for (const msg of messages) {
    const d = fmtDate(msg.created_at)
    const last = grouped[grouped.length - 1]
    if (last?.date === d) last.msgs.push(msg)
    else grouped.push({ date: d, msgs: [msg] })
  }

  // ── Shared JSX fragments ──────────────────────────────────────────────────────

  const contactHeader = (
    <div className="flex items-center gap-3 px-1 py-4">
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(0,122,255,0.12)' }}>
        <i className="fa-solid fa-headset text-[15px]" style={{ color: 'var(--f-blue)' }} />
      </div>
      <div>
        <p className="text-[15px] font-bold" style={{ color: 'var(--f-text)' }}>FluxApp Finance</p>
        <p className="text-[12px] font-medium" style={{ color: 'var(--f-text-4)' }}>Soporte · respondemos a la brevedad</p>
      </div>
    </div>
  )

  const emptyState = (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(0,122,255,0.1)' }}>
        <i className="fa-solid fa-comments text-2xl" style={{ color: 'var(--f-blue)' }} />
      </div>
      <p className="text-[15px] font-bold text-center" style={{ color: 'var(--f-text)' }}>¿En qué te podemos ayudar?</p>
      <p className="text-[13px] font-medium text-center" style={{ color: 'var(--f-text-4)' }}>
        Escríbenos y te respondemos lo antes posible.
      </p>
    </div>
  )

  const messageList = (
    <>
      <div style={{ flex: 1 }} />
      {messages.length === 0 && emptyState}
      {grouped.map(group => (
        <div key={group.date}>
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ background: 'var(--f-line)' }} />
            <span className="text-[11px] font-bold px-2" style={{ color: 'var(--f-text-4)' }}>{group.date}</span>
            <div className="flex-1 h-px" style={{ background: 'var(--f-line)' }} />
          </div>
          {group.msgs.map((msg, i) => {
            const isUser = msg.sender === 'user'
            const prevSender = i > 0 ? group.msgs[i - 1].sender : null
            const showAvatar = !isUser && prevSender !== 'admin'
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-1`}>
                {!isUser && (
                  <div className="w-7 h-7 rounded-full flex-shrink-0 mr-2 mt-auto mb-0.5 flex items-center justify-center"
                    style={{
                      background: showAvatar ? 'rgba(0,122,255,0.12)' : 'transparent',
                      visibility: showAvatar ? 'visible' : 'hidden',
                    }}>
                    {showAvatar && <i className="fa-solid fa-headset text-[10px]" style={{ color: 'var(--f-blue)' }} />}
                  </div>
                )}
                <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div
                    className="px-4 py-2.5 rounded-[18px] text-[15px] font-medium leading-relaxed"
                    style={{
                      background: isUser ? 'var(--f-blue)' : 'var(--f-bg-card)',
                      color: isUser ? '#fff' : 'var(--f-text)',
                      border: isUser ? 'none' : '1px solid var(--f-line)',
                      borderBottomRightRadius: isUser ? 4 : 18,
                      borderBottomLeftRadius: isUser ? 18 : 4,
                    }}
                  >
                    {msg.body}
                  </div>
                  <span className="text-[10px] font-medium mt-0.5 px-1" style={{ color: 'var(--f-text-4)' }}>
                    {fmtTime(msg.created_at)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ))}
      <div ref={bottomRef} />
    </>
  )

  const inputBar = (
    <div className="flex items-end gap-2">
      <div className="flex-1 rounded-[20px] px-4 py-3 flex items-end gap-2"
        style={{ background: 'var(--f-bg-card)', border: '1px solid var(--f-line)' }}>
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={e => {
            setInput(e.target.value)
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
          onFocus={() => setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 350)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje…"
          className="flex-1 resize-none outline-none text-[15px] font-medium bg-transparent"
          style={{ color: 'var(--f-text)', maxHeight: 120, overflowY: 'auto' }}
        />
      </div>
      <button
        onClick={handleSend}
        disabled={!input.trim() || sending}
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-40"
        style={{ background: 'var(--f-blue)' }}
      >
        {sending
          ? <i className="fa-solid fa-spinner fa-spin text-white text-[13px]" />
          : <i className="fa-solid fa-arrow-up text-white text-[13px]" />
        }
      </button>
    </div>
  )

  // ── Full-screen mode via portal (bypasses stacking contexts + covers nav bar) ─

  if (onBack !== undefined) {
    if (!mounted) return null

    const overlay = (
      <div
        ref={containerRef}
        className="flex flex-col"
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          height: '100dvh',
          overflow: 'hidden',
          zIndex: 200,
          background: 'var(--f-bg)',
        }}
      >
        {/* Nav header — always fixed */}
        <header
          style={{
            flexShrink: 0,
            padding: '0 20px 16px',
            paddingTop: 'calc(1rem + var(--safe-top))',
            background: 'var(--f-bg-glass)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--f-accent-bg)',
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              onClick={onBack}
              style={{ color: 'var(--f-blue)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, position: 'relative', zIndex: 1 }}
            >
              <i className="fa-solid fa-chevron-left" style={{ fontSize: 12 }} />
              Ajustes
            </button>
            <h1
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--f-text)',
                pointerEvents: 'none',
              }}
            >
              Soporte
            </h1>
          </div>
          {/* Contact info — fixed below nav, not scrollable */}
          {contactHeader}
        </header>

        {/* Messages — scrollable only */}
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fa-solid fa-spinner fa-spin text-2xl" style={{ color: 'var(--f-text-4)' }} />
          </div>
        ) : (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px', overscrollBehavior: 'contain', display: 'flex', flexDirection: 'column' }}>
            {messageList}
          </div>
        )}

        {/* Input */}
        <div
          style={{
            flexShrink: 0,
            padding: '12px 16px',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
            background: 'var(--f-bg)',
            borderTop: '1px solid var(--f-line)',
          }}
        >
          {inputBar}
        </div>
      </div>
    )

    return createPortal(overlay, document.body)
  }

  // ── Embedded fallback ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <i className="fa-solid fa-spinner fa-spin text-2xl" style={{ color: 'var(--f-text-4)' }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 200px)', minHeight: 400 }}>
      {contactHeader}
      <div className="flex-1 overflow-y-auto px-1 space-y-1" style={{ overscrollBehavior: 'contain' }}>
        {messageList}
      </div>
      <div className="mt-3">
        {inputBar}
      </div>
    </div>
  )
}
