export interface Message {
  id: string
  text: string
  out: boolean
  timestamp: number
  status?: 'sending' | 'sent' | 'error'
}

export interface Chat {
  chatId: string
  phone?: string
  name: string
  messages: Message[]
  unread: number
}

export interface State {
  chats: Chat[]
  activeChatId: string | null
}

export type Action =
  | { type: 'createChat'; chatId: string; phone?: string; name: string }
  | { type: 'selectChat'; chatId: string | null }
  | { type: 'addLocal'; chatId: string; message: Message }
  | { type: 'updateLocal'; chatId: string; localId: string; patch: Partial<Message> }

export const emptyState: State = { chats: [], activeChatId: null }

const storageKey = (idInstance: string) => `green-tg-chat:${idInstance}`

export function loadState(idInstance: string): State {
  try {
    const raw = localStorage.getItem(storageKey(idInstance))
    if (raw) return { ...(JSON.parse(raw) as State), activeChatId: null }
  } catch {}
  return emptyState
}

export function saveState(idInstance: string, state: State) {
  try {
    localStorage.setItem(storageKey(idInstance), JSON.stringify(state))
  } catch {}
}

export function parseRecipient(input: string): { chatId: string; phone?: string } | null {
  const value = input.trim()
  if (!value) return null
  if (value.includes('@')) return { chatId: value, phone: value.split('@')[0].replace(/\D/g, '') }
  const digits = value.replace(/\D/g, '')
  if (value.startsWith('-') && digits) return { chatId: `-${digits}` }
  if (value.startsWith('+') || /^[78]\d{10}$/.test(digits)) {
    if (digits.length < 10 || digits.length > 15) return null
    const phone = digits.length === 11 && digits.startsWith('8') ? `7${digits.slice(1)}` : digits
    return { chatId: `${phone}@c.us`, phone }
  }
  if (digits.length >= 5 && digits === value) return { chatId: digits }
  return null
}

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'createChat': {
      const existing = state.chats.find(
        (c) => c.chatId === action.chatId || (action.phone && c.phone === action.phone),
      )
      if (existing) return { ...state, activeChatId: existing.chatId }
      const chat: Chat = { chatId: action.chatId, phone: action.phone, name: action.name, messages: [], unread: 0 }
      return { chats: [chat, ...state.chats], activeChatId: chat.chatId }
    }
    case 'selectChat':
      return {
        activeChatId: action.chatId,
        chats: state.chats.map((c) => (c.chatId === action.chatId ? { ...c, unread: 0 } : c)),
      }
    case 'addLocal':
      return {
        ...state,
        chats: state.chats.map((c) =>
          c.chatId === action.chatId ? { ...c, messages: [...c.messages, action.message] } : c,
        ),
      }
    case 'updateLocal':
      return {
        ...state,
        chats: state.chats.map((c) => {
          if (c.chatId !== action.chatId) return c
          const newId = action.patch.id
          if (newId && c.messages.some((m) => m.id === newId)) {
            return { ...c, messages: c.messages.filter((m) => m.id !== action.localId) }
          }
          return { ...c, messages: c.messages.map((m) => (m.id === action.localId ? { ...m, ...action.patch } : m)) }
        }),
      }
  }
}
