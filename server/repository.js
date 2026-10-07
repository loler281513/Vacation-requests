import { db } from './db.js';

function calcDays(dateFrom, dateTo) {
  const from = new Date(dateFrom + 'T00:00:00Z');
  const to   = new Date(dateTo   + 'T00:00:00Z');
  return Math.round((to - from) / 86400000) + 1;
}

const insertStmt = db.prepare(`
  INSERT INTO requests (full_name, date_from, date_to, days, reason, status)
  VALUES (:fullName, :dateFrom, :dateTo, :days, :reason, 'pending')
`);

const listAllStmt = db.prepare(`
  SELECT * FROM requests ORDER BY created_at DESC, id DESC
`);

const listByStatusStmt = db.prepare(`
  SELECT * FROM requests WHERE status = ? ORDER BY created_at DESC, id DESC
`);

const getByIdStmt = db.prepare(`SELECT * FROM requests WHERE id = ?`);
const getStatusStmt = db.prepare(`SELECT status FROM requests WHERE id = ?`);

const decideStmt = db.prepare(`
  UPDATE requests
     SET status = :status,
         reject_reason = :rejectReason,
         decided_at = datetime('now')
   WHERE id = :id AND status = 'pending'
`);

export const repo = {
  create(payload) {
    const days = calcDays(payload.dateFrom, payload.dateTo);
    const info = insertStmt.run({
      fullName: payload.fullName,
      dateFrom: payload.dateFrom,
      dateTo: payload.dateTo,
      days,
      reason: payload.reason
    });
    return this.getById(info.lastInsertRowid);
  },

  list(status) {
    return status ? listByStatusStmt.all(status) : listAllStmt.all();
  },

  getById(id) {
    return getByIdStmt.get(id) ?? null;
  },

  decide(id, status, rejectReason) {
    // Проверка существование и текущий статус.
    const row = getStatusStmt.get(id);
    if (!row) {
      return { ok: false, reason: 'not_found' };
    }
    if (row.status !== 'pending') {
      return { ok: false, reason: 'already_decided' };
    }

    // UPDATE по-прежнему защищён условием status = 'pending'
    const info = decideStmt.run({
      id,
      status,
      rejectReason: status === 'rejected' ? rejectReason : null
    });

    if (info.changes === 0) {
      // Между SELECT и UPDATE кто-то успел решить заявку.
      return { ok: false, reason: 'already_decided' };
    }

    return { ok: true };
  }
};