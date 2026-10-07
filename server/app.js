import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { router } from './routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  app.use('/', express.static(path.join(__dirname, '..', 'client')));

  // Обработчик ошибок. Ловит:
  //   - синхронные throw из хендлеров (например, SQLITE_CONSTRAINT);
  //   - next(err) от middleware (express.json() на невалидном JSON).
  app.use((err, req, res, next) => {
    const isClientError = err.status && err.status >= 400 && err.status < 500;
    if (!isClientError) {
      console.error('[error]', err);
    }

    if (isClientError) {
      return res.status(err.status).json({ error: err.message || 'Некорректный запрос' });
    }
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  });

  return app;
}