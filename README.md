# Telegram-чат на GREEN-API

## Запуск

Требуется Node.js 20.19+ или 22.12+.

```bash
npm install
npm run dev
```

Приложение откроется на http://localhost:5173.

Production-сборка:

```bash
npm run build
npm run preview
```

## Вход

1. В [личном кабинете GREEN-API](https://console.green-api.com) создайте и авторизуйте инстанс Telegram.
2. Включите в настройках инстанса уведомления о входящих и исходящих сообщениях, `webhookUrl` оставьте пустым.
3. Введите в приложении `apiUrl`, `idInstance` и `apiTokenInstance` из карточки инстанса.
