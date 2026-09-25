import { Fragment, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Chat } from '../store'
import { Avatar } from './Avatar'
import { formatClock, formatDay } from '../format'

interface Props {
  chat: Chat
  onSend: (text: string) => void
  onBack: () => void
}

export function ChatView({ chat, onSend, onBack }: Props) {
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [chat.messages.length, chat.chatId])

  function submit(e?: FormEvent) {
    e?.preventDefault()
    const value = text.trim()
    if (!value) return
    onSend(value)
    setText('')
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <section className="chat">
      <header className="chat__header">
        <button className="icon-btn chat__back" onClick={onBack} title="Назад">
          ←
        </button>
        <Avatar name={chat.name} size={40} />
        <div>
          <div className="chat__name">{chat.name}</div>
          <div className="chat__sub">{chat.phone ? `+${chat.phone}` : chat.chatId}</div>
        </div>
      </header>

      <div className="chat__messages" ref={listRef}>
        {chat.messages.length === 0 && <div className="chat__empty">Напишите первое сообщение</div>}
        {chat.messages.map((m, i) => {
          const prev = chat.messages[i - 1]
          const newDay = !prev || new Date(prev.timestamp).toDateString() !== new Date(m.timestamp).toDateString()
          return (
            <Fragment key={m.id}>
              {newDay && <div className="day-sep">{formatDay(m.timestamp)}</div>}
              <div className={`bubble ${m.out ? 'bubble--out' : 'bubble--in'}`}>
                <span className="bubble__text">{m.text}</span>
                <span className="bubble__meta">
                  {formatClock(m.timestamp)}
                  {m.out && (
                    <span className={`bubble__status is-${m.status ?? 'sent'}`}>
                      {m.status === 'sending' ? '🕓' : m.status === 'error' ? '!' : '✓'}
                    </span>
                  )}
                </span>
              </div>
            </Fragment>
          )
        })}
      </div>

      <form className="composer" onSubmit={submit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Сообщение"
          rows={1}
          maxLength={4096}
          autoFocus
        />
        <button type="submit" className="composer__send" disabled={!text.trim()} title="Отправить">
          ➤
        </button>
      </form>
    </section>
  )
}
