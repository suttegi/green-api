import { useEffect, useReducer, useState } from 'react'
import type { Credentials } from './api/greenApi'
import { sendMessage } from './api/greenApi'
import { Login } from './components/Login'
import { Sidebar } from './components/Sidebar'
import { ChatView } from './components/ChatView'
import { loadState, reducer, saveState } from './store'

const CREDS_KEY = 'green-tg-chat:creds'

function loadCreds(): Credentials | null {
  try {
    const raw = localStorage.getItem(CREDS_KEY)
    return raw ? (JSON.parse(raw) as Credentials) : null
  } catch {
    return null
  }
}

export default function App() {
  const [creds, setCreds] = useState<Credentials | null>(loadCreds)

  function login(c: Credentials) {
    try {
      localStorage.setItem(CREDS_KEY, JSON.stringify(c))
    } catch {}
    setCreds(c)
  }

  function logout() {
    try {
      localStorage.removeItem(CREDS_KEY)
    } catch {}
    setCreds(null)
  }

  if (!creds) return <Login onLogin={login} />
  return <Messenger key={creds.idInstance} creds={creds} onLogout={logout} />
}

function Messenger({ creds, onLogout }: { creds: Credentials; onLogout: () => void }) {
  const [state, dispatch] = useReducer(reducer, creds.idInstance, loadState)

  useEffect(() => saveState(creds.idInstance, state), [creds.idInstance, state])

  const activeChat = state.chats.find((c) => c.chatId === state.activeChatId) ?? null

  async function send(text: string) {
    if (!activeChat) return
    const chatId = activeChat.chatId
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
    dispatch({
      type: 'addLocal',
      chatId,
      message: { id: localId, text, out: true, timestamp: Date.now(), status: 'sending' },
    })
    try {
      const idMessage = await sendMessage(creds, chatId, text)
      dispatch({ type: 'updateLocal', chatId, localId, patch: { id: idMessage, status: 'sent' } })
    } catch (e) {
      console.error('sendMessage failed', e)
      dispatch({ type: 'updateLocal', chatId, localId, patch: { status: 'error' } })
    }
  }

  return (
    <div className={`app ${activeChat ? 'has-active' : ''}`}>
      <Sidebar
        chats={state.chats}
        activeChatId={state.activeChatId}
        idInstance={creds.idInstance}
        online
        onSelect={(chatId) => dispatch({ type: 'selectChat', chatId })}
        onCreate={(chatId, name, phone) => dispatch({ type: 'createChat', chatId, name, phone })}
        onLogout={onLogout}
      />
      {activeChat ? (
        <ChatView
          key={activeChat.chatId}
          chat={activeChat}
          onSend={send}
          onBack={() => dispatch({ type: 'selectChat', chatId: null })}
        />
      ) : (
        <section className="chat chat--placeholder">
          <div className="placeholder">Выберите чат или создайте новый</div>
        </section>
      )}
    </div>
  )
}
