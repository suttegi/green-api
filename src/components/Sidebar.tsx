import { useState, type FormEvent, type ReactNode } from 'react'
import type { Chat } from '../store'
import { parseRecipient } from '../store'
import { Avatar } from './Avatar'
import { formatTime } from '../format'

interface Props {
  chats: Chat[]
  activeChatId: string | null
  idInstance: string
  online: boolean
  onSelect: (chatId: string) => void
  onCreate: (chatId: string, name: string, phone?: string) => void
  onLogout: () => void
  notice?: ReactNode
}

export function Sidebar({ chats, activeChatId, idInstance, online, onSelect, onCreate, onLogout, notice }: Props) {
  const [creating, setCreating] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    const parsed = parseRecipient(value)
    if (!parsed) {
      setError('Введите номер в формате +7 900 123-45-67')
      return
    }
    onCreate(parsed.chatId, parsed.phone ? `+${parsed.phone}` : parsed.chatId, parsed.phone)
    setValue('')
    setError(null)
    setCreating(false)
  }

  const sorted = [...chats].sort((a, b) => lastTs(b) - lastTs(a))

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <div>
          <div className="sidebar__title">Чаты</div>
          <div className={`sidebar__status ${online ? 'is-online' : 'is-error'}`}>
            {online ? 'в сети' : 'нет соединения…'} · {idInstance}
          </div>
        </div>
        <div className="sidebar__actions">
          <button className="icon-btn" title="Новый чат" onClick={() => setCreating((v) => !v)}>
            {creating ? '×' : '✎'}
          </button>
          <button className="icon-btn" title="Выйти" onClick={onLogout}>
            ⏻
          </button>
        </div>
      </header>

      {notice}

      {creating && (
        <form className="new-chat" onSubmit={submit}>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Номер телефона, напр. +79001234567"
            inputMode="tel"
          />
          <button type="submit">Создать</button>
          {error && <div className="new-chat__error">{error}</div>}
        </form>
      )}

      <ul className="chat-list">
        {sorted.length === 0 && <li className="chat-list__empty">Нет чатов. Нажмите ✎, чтобы начать новый.</li>}
        {sorted.map((chat) => {
          const last = chat.messages[chat.messages.length - 1]
          return (
            <li
              key={chat.chatId}
              className={`chat-item ${chat.chatId === activeChatId ? 'is-active' : ''}`}
              onClick={() => onSelect(chat.chatId)}
            >
              <Avatar name={chat.name} />
              <div className="chat-item__body">
                <div className="chat-item__row">
                  <span className="chat-item__name">{chat.name}</span>
                  {last && <span className="chat-item__time">{formatTime(last.timestamp)}</span>}
                </div>
                <div className="chat-item__row">
                  <span className="chat-item__preview">
                    {last ? `${last.out ? 'Вы: ' : ''}${last.text}` : 'Нет сообщений'}
                  </span>
                  {chat.unread > 0 && <span className="badge">{chat.unread}</span>}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}

function lastTs(chat: Chat): number {
  return chat.messages[chat.messages.length - 1]?.timestamp ?? Number.MAX_SAFE_INTEGER
}
