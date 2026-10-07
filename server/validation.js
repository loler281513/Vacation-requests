export const STATUSES = ['pending', 'approved', 'rejected'];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Проверка
function isRealDate(s) {
  const d = new Date(s + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === s;
}

export function validateCreatePayload(body) {
  const errors = [];
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  const dateFrom = typeof body.dateFrom === 'string' ? body.dateFrom.trim() : '';
  const dateTo   = typeof body.dateTo   === 'string' ? body.dateTo.trim()   : '';
  const reason   = typeof body.reason   === 'string' ? body.reason.trim()   : '';

  if (!fullName) errors.push('ФИО обязательно');
  if (fullName.length > 200) errors.push('ФИО слишком длинное');

  if (!dateFrom) errors.push('Дата начала обязательна');
  else if (!ISO_DATE.test(dateFrom)) errors.push('Дата начала в неверном формате');
  else if (!isRealDate(dateFrom))    errors.push('Дата начала не существует');

  if (!dateTo) errors.push('Дата окончания обязательна');
  else if (!ISO_DATE.test(dateTo)) errors.push('Дата окончания в неверном формате');
  else if (!isRealDate(dateTo))    errors.push('Дата окончания не существует');

  if (!reason) errors.push('Причина обязательна');
  if (reason.length > 1000) errors.push('Причина слишком длинная');

  if (!errors.length && dateTo < dateFrom) {
    errors.push('Дата окончания не может быть раньше даты начала');
  }

  return {
    errors,
    data: { fullName, dateFrom, dateTo, reason }
  };
}

export function validateDecisionPayload(body) {
  const errors = [];
  const status = body.status;
  const rejectReason = typeof body.rejectReason === 'string'
    ? body.rejectReason.trim()
    : '';

  if (status !== 'approved' && status !== 'rejected') {
    errors.push('Недопустимый статус решения');
  }
  if (status === 'rejected' && !rejectReason) {
    errors.push('При отклонении причина обязательна');
  }
  if (rejectReason.length > 1000) {
    errors.push('Причина отклонения слишком длинная');
  }

  return { errors, data: { status, rejectReason } };
}

export function validateStatusFilter(value) {
  if (value === undefined || value === null || value === '') {
    return { ok: true, value: null };
  }
  if (!STATUSES.includes(value)) {
    return { ok: false };
  }
  return { ok: true, value };
}