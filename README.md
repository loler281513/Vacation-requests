# Vacation Requests

Fullstack-приложение для подачи и согласования заявок на отпуск.

## Стек

- Backend: Node.js, Express 5, node:sqlite (встроенный модуль).
- Frontend: HTML/CSS/JS, без сборки.
- Тесты: встроенный node:test.

## Требования

- Node.js >= 22 (нужен node:sqlite).

## Установка и запуск

    cd server
    npm i
    npm start


Порт и путь к БД переопределяются переменными окружения:

- PORT — порт HTTP-сервера (по умолчанию 3000).
- DB_PATH — путь к файлу SQLite (по умолчанию vacations.db рядом с процессом).

## Тесты
    cd server
    npm test

Каждый запуск использует свою временную БД и не трогает vacations.db.

## API
Базовый префикс — /api.

### GET /api/requests?status=pending

Список заявок. Параметр status необязателен; допустимы pending, approved, rejected.

### POST /api/requests

Создать заявку.

Тело:

    {
      "fullName": "Иванов Иван Иванович",
      "dateFrom": "2026-10-01",
      "dateTo": "2026-10-07",
      "reason": "Ежегодный отпуск"
    }

Ответ 201 — созданная заявка с посчитанным полем days (включительно).

### POST /api/requests/:id/decision

Согласовать или отклонить заявку.

Тело (одобрение):

    { "status": "approved" }

Тело (отклонение):

    { "status": "rejected", "rejectReason": "Не согласовано с руководителем" }

Ответы:

- 200 — обновлённая заявка.
- 400 — ошибки валидации.
- 404 — заявка не найдена.
- 409 — заявка уже рассмотрена.

## Структура

    server/
      app.js         — сборка Express-приложения и error-middleware
      db.js          — подключение к SQLite и схема
      index.js       — точка входа
      repository.js  — слой доступа к данным
      routes.js      — HTTP-роуты
      validation.js  — валидация входных данных
      api.test.js    — интеграционные тесты
    client/
      index.html
      app.js
      styles.css