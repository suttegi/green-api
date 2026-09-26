export interface Credentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export interface SenderData {
  chatId: string
  chatName?: string
  sender?: string
  senderName?: string
  senderContactName?: string
  senderPhoneNumber?: number
}

export interface MessageData {
  typeMessage: string
  textMessageData?: { textMessage: string }
  extendedTextMessageData?: { text: string }
}

export interface NotificationBody {
  typeWebhook: string
  timestamp: number
  idMessage?: string
  senderData?: SenderData
  messageData?: MessageData
}

export interface Notification {
  receiptId: number
  body: NotificationBody
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

export interface InstanceSettings {
  webhookUrl?: string
  incomingWebhook?: 'yes' | 'no'
  outgoingMessageWebhook?: 'yes' | 'no'
  outgoingAPIMessageWebhook?: 'yes' | 'no'
}

export const REQUIRED_SETTINGS: InstanceSettings = {
  webhookUrl: '',
  incomingWebhook: 'yes',
  outgoingMessageWebhook: 'yes',
  outgoingAPIMessageWebhook: 'yes',
}

export async function getSettings(c: Credentials): Promise<InstanceSettings> {
  return (await request<InstanceSettings>(url(c, 'getSettings'))) ?? {}
}

export async function setSettings(c: Credentials, settings: InstanceSettings): Promise<void> {
  await request(url(c, 'setSettings'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  })
}

export function canReceive(s: InstanceSettings): boolean {
  return (Object.keys(REQUIRED_SETTINGS) as (keyof InstanceSettings)[]).every(
    (k) => (s[k] ?? '') === REQUIRED_SETTINGS[k],
  )
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

export async function receiveNotification(
  c: Credentials,
  signal: AbortSignal,
  receiveTimeout = 20,
): Promise<Notification | null> {
  try {
    return await request<Notification>(url(c, 'receiveNotification', `?receiveTimeout=${receiveTimeout}`), { signal })
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('HTTP 408')) return null
    throw e
  }
}

export async function deleteNotification(c: Credentials, receiptId: number): Promise<void> {
  await request(url(c, 'deleteNotification', `/${receiptId}`), { method: 'DELETE' })
}

export function extractText(data?: MessageData): string | null {
  if (!data) return null
  if (data.typeMessage === 'textMessage') return data.textMessageData?.textMessage ?? null
  if (data.typeMessage === 'extendedTextMessage') return data.extendedTextMessageData?.text ?? null
  return null
}
