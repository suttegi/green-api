import { useState, type FormEvent } from 'react'
import type { Credentials } from '../api/greenApi'
import { getStateInstance } from '../api/greenApi'

interface Props {
  onLogin: (creds: Credentials) => void
}

export function Login({ onLogin }: Props) {
  const [apiUrl, setApiUrl] = useState('https://api.green-api.com')
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const creds = { apiUrl: apiUrl.trim(), idInstance: idInstance.trim(), apiTokenInstance: apiTokenInstance.trim() }
    setError(null)
    setLoading(true)
    try {
      const state = await getStateInstance(creds)
      if (state !== 'authorized') {
        setError(`Инстанс не авторизован (stateInstance: ${state}). Авторизуйте его в личном кабинете GREEN-API.`)
        return
      }
      onLogin(creds)
    } catch (err) {
      setError(`Не удалось подключиться: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={submit}>
        <div className="login__logo">✈</div>
        <h1>Вход в чат</h1>
        <p className="login__hint">Введите данные инстанса Telegram из личного кабинета GREEN-API</p>

        <label>
          apiUrl
          <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder="https://api.green-api.com" required />
        </label>
        <label>
          idInstance
          <input value={idInstance} onChange={(e) => setIdInstance(e.target.value)} placeholder="4100000000" inputMode="numeric" required />
        </label>
        <label>
          apiTokenInstance
          <input
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            placeholder="d75b3a66374942c5b3c019c698abc2067e151558acbd412345"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>

        {error && <div className="login__error">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'Проверка…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
