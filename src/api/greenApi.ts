export interface Credentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

function url(c: Credentials, method: string, suffix = ''): string {
  const base = c.apiUrl.replace(/\/+$/, '')
  return `${base}/waInstance${c.idInstance}/${method}/${c.apiTokenInstance}${suffix}`
}

async function request<T>(input: string, init?: RequestInit): Promise<T | null> {
  const res = await fetch(input, init)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}${text ? `: ${text}` : ''}`)
  }
  const text = await res.text()
  return text ? (JSON.parse(text) as T) : null
}

export async function getStateInstance(c: Credentials): Promise<string> {
  const data = await request<{ stateInstance: string }>(url(c, 'getStateInstance'))
  return data?.stateInstance ?? 'unknown'
}

export async function sendMessage(c: Credentials, chatId: string, message: string): Promise<string> {
  const data = await request<{ idMessage: string }>(url(c, 'sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message }),
  })
  if (!data?.idMessage) throw new Error('Пустой ответ от sendMessage')
  return data.idMessage
}
