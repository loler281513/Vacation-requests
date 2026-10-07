import { DatabaseSync } from 'node:sqlite';


// env, в будущем используем для тестов, чтобы каждый запуск работал со своей временной БД.
const dbPath = process.env.DB_PATH || 'vacations.db';
export const db = new DatabaseSync(dbPath);

db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
  CREATE TABLE IF NOT EXISTS requests (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name     TEXT    NOT NULL,
    date_from     TEXT    NOT NULL,
    date_to       TEXT    NOT NULL,
    days          INTEGER NOT NULL CHECK (days > 0),
    reason        TEXT    NOT NULL,
    status        TEXT    NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
    reject_reason TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    decided_at    TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
`);