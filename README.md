
# Vacation Requests

Fullstack-приложение для подачи и согласования заявок на отпуск.

## Стек

- Backend: Node.js, Express 5, node:sqlite (встроенный модуль).
- Frontend: React 19 + Vite (сборка в статику, раздаётся Express)
- Тесты: встроенный node:test.

  

## Требования

- Node.js >= 22 (нужен node:sqlite).

## Установка

```bash
# зависимости сервера
cd  server
npm  install

# зависимости клиента
cd  ../client
npm  install
```

## Запуск (production-режим, один порт)

```bash
cd  server
npm  run  prod
```

Команда соберёт React в `client/dist` и запустит Express, который раздаёт и API, и статику.

Открыть: <http://localhost:3000>

## Разработка

Для разработки удобнее держать два процесса: Vite с hot reload на `5173` и Express на `3000`. Vite проксирует `/api` на Express (см. `client/vite.config.js`).

 
В двух терминалах:

```bash
# терминал 1 — API
cd  server
npm  start

# терминал 2 — UI с hot reload
cd  client
npm  run  dev
```

Открыть: <http://localhost:5173>

## API

Базовый префикс: `/api`

### `GET /api/requests?status=pending|approved|rejected`

Список заявок.

### `POST /api/requests`

Создать заявку.

```json
{
"fullName": "Иван Иванов",
"dateFrom": "2026-01-10",
"dateTo": "2026-01-24",
"reason": "Ежегодный отпуск"
}
```

Ответ — `201` и объект заявки. Поле `days` считается автоматически (включительно обе даты).

### `POST /api/requests/:id/decision`

Рассмотреть заявку.

```json
{ "status": "approved" }
```
или
```json
{ "status": "rejected", "rejectReason": "Не согласовано с руководителем" }
```

Коды ответа:
-  `200` — успешно
-  `400` — ошибка валидации
-  `404` — заявка не найдена
-  `409` — заявка уже рассмотрена (повторное решение запрещено)

## Тесты
```bash
cd  server
npm  test
```
Каждый запуск использует свою временную БД и не трогает vacations.db.

  

## Структура
```
├── server/ # Express API + раздача собранного фронта
│	├── tests/
│	│	├── api.test.js # тесты
│	├── app.js # создание приложения, монтирование роутов и статики
│	├── db.js # подключение к SQLite, схема
│	├── index.js # точка входа
│	├── repository.js # доступ к данным
│	├── routes.js # HTTP-роуты /api/*
│	└── validation.js # валидация входных данных
└── client/ # React + Vite
	├── dist/ # результат `npm run build`
	├── src/
	└── index.html
```