import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Credentials, NotificationBody } from './api/greenApi'
import { deleteNotification, receiveNotification } from './api/greenApi'

export type PollingStatus = 'online' | 'error'

export function usePolling(creds: Credentials, onNotification: (body: NotificationBody) => void): PollingStatus {
  const [status, setStatus] = useState<PollingStatus>('online')
  const handler = useRef(onNotification)
  useLayoutEffect(() => {
    handler.current = onNotification
  })

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(resolve, ms)
        signal.addEventListener('abort', () => (clearTimeout(t), resolve()), { once: true })
      })

    ;(async () => {
      while (!signal.aborted) {
        try {
          const notification = await receiveNotification(creds, signal)
          if (signal.aborted) break
          setStatus('online')
          if (!notification) continue
          try {
            handler.current(notification.body)
          } finally {
            await deleteNotification(creds, notification.receiptId)
          }
        } catch (e) {
          if (signal.aborted) break
          console.error('receiveNotification failed', e)
          setStatus('error')
          await wait(5000)
        }
      }
    })()

    return () => controller.abort()
  }, [creds])

  return status
}
