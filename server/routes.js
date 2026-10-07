import { Router } from 'express';
import { repo } from './repository.js';
import {
  validateCreatePayload,
  validateDecisionPayload,
  validateStatusFilter
} from './validation.js';

export const router = Router();

// Маппинг строки БД → JSON
function toDto(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    dateFrom: row.date_from,
    dateTo: row.date_to,
    days: row.days,
    reason: row.reason,
    status: row.status,
    rejectReason: row.reject_reason,
    createdAt: row.created_at,
    decidedAt: row.decided_at
  };
}

// GET /api/requests?status=pending
router.get('/requests', (req, res) => {
  const filter = validateStatusFilter(req.query.status);
  if (!filter.ok) {
    return res.status(400).json({ error: 'Недопустимый статус в фильтре' });
  }
  const rows = repo.list(filter.value);
  res.json(rows.map(toDto));
});

// POST /api/requests
router.post('/requests', (req, res) => {
  const { errors, data } = validateCreatePayload(req.body ?? {});
  if (errors.length) return res.status(400).json({ errors });

  const created = repo.create(data);
  res.status(201).json(toDto(created));
});

// POST /api/requests/:id/decision
router.post('/requests/:id/decision', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Некорректный id' });
  }

  const { errors, data } = validateDecisionPayload(req.body ?? {});
  if (errors.length) return res.status(400).json({ errors });

  const result = repo.decide(id, data.status, data.rejectReason);

  if (!result.ok) {
    if (result.reason === 'not_found') {
      return res.status(404).json({ error: 'Заявка не найдена' });
    }
    return res.status(409).json({ error: 'Заявка уже рассмотрена' });
  }

  res.json(toDto(repo.getById(id)));
});