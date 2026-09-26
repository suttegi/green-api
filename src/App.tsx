import { useCallback, useEffect, useReducer, useState } from 'react'
import type { Credentials } from './api/greenApi'
import { REQUIRED_SETTINGS, canReceive, getSettings, sendMessage, setSettings } from './api/greenApi'
import { Login } from './components/Login'
import { Sidebar } from './components/Sidebar'
import { ChatView } from './components/ChatView'
import { loadState, reducer, saveState } from './store'
import { usePolling } from './usePolling'

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

  const status = usePolling(
    creds,
    useCallback((body) => dispatch({ type: 'notification', body }), []),
  )

  const [settingsState, setSettingsState] = useState<'ok' | 'disabled' | 'saving' | 'saved'>('ok')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      for (let attempt = 0; attempt < 4 && !cancelled; attempt++) {
        try {
          const s = await getSettings(creds)
          if (!cancelled && !canReceive(s)) setSettingsState('disabled')
          return
        } catch (e) {
          console.error('getSettings failed', e)
          await new Promise((r) => setTimeout(r, 3000))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [creds])

  async function enableNotifications() {
    setSettingsState('saving')
    try {
      await setSettings(creds, REQUIRED_SETTINGS)
      setSettingsState('saved')
    } catch (e) {
      console.error('setSettings failed', e)
      setSettingsState('disabled')
    }
  }

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
        online={status === 'online'}
        onSelect={(chatId) => dispatch({ type: 'selectChat', chatId })}
        onCreate={(chatId, name, phone) => dispatch({ type: 'createChat', chatId, name, phone })}
        onLogout={onLogout}
        notice={
          settingsState === 'ok' ? null : (
            <div className="notice">
              {settingsState === 'saved' ? (
                'Уведомления включены. Настройки применяются до 5 минут.'
              ) : (
                <>
                  В инстансе выключены уведомления — входящие сообщения не будут приходить.
                  <button onClick={enableNotifications} disabled={settingsState === 'saving'}>
                    {settingsState === 'saving' ? 'Сохранение…' : 'Включить'}
                  </button>
                </>
              )}
            </div>
          )
        }
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
