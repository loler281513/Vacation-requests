const API = '/api';

const $ = (sel) => document.querySelector(sel);
const form = $('#create-form');
const formErrors = $('#form-errors');
const listErrors = $('#list-errors');
const tbody = $('#requests-table tbody');
const statusFilter = $('#status-filter');

const STATUS_LABELS = {
  pending: 'Ожидает',
  approved: 'Одобрена',
  rejected: 'Отклонена'
};

async function api(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message =
      data?.errors?.join('\n') || data?.error || `Ошибка ${res.status}`;
    throw new Error(message);
  }
  return data;
}

function showErrors(el, messages) {
  if (!messages || !messages.length) {
    el.hidden = true;
    el.innerHTML = '';
    return;
  }
  el.innerHTML = `<ul>${messages.map(m => `<li>${escapeHtml(m)}</li>`).join('')}</ul>`;
  el.hidden = false;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function formatDate(iso) {
  // ISO YYYY-MM-DD → DD.MM.YYYY
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function renderRow(r) {
  const tr = document.createElement('tr');
  tr.dataset.id = r.id;

  const statusBadge = `<span class="badge ${r.status}">${STATUS_LABELS[r.status]}</span>`;

  const rejectInfo = r.status === 'rejected' && r.rejectReason
    ? `<div class="muted">Причина отказа: ${escapeHtml(r.rejectReason)}</div>`
    : '';

  const actions = r.status === 'pending'
    ? `<div class="actions">
         <button data-action="approve">Одобрить</button>
         <button data-action="reject" class="danger">Отклонить</button>
       </div>`
    : '<span class="muted">—</span>';

  tr.innerHTML = `
    <td>${escapeHtml(r.fullName)}</td>
    <td>${formatDate(r.dateFrom)} — ${formatDate(r.dateTo)}</td>
    <td>${r.days}</td>
    <td>${escapeHtml(r.reason)}</td>
    <td>${statusBadge}${rejectInfo}</td>
    <td>${actions}</td>
  `;
  return tr;
}

async function loadRequests() {
  try {
    showErrors(listErrors, []);
    const status = statusFilter.value;
    const qs = status === 'all' ? '' : `?status=${encodeURIComponent(status)}`;
    const items = await api('/requests' + qs);
    tbody.innerHTML = '';
    if (!items.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="6" class="muted">Заявок пока нет</td>`;
      tbody.appendChild(tr);
      return;
    }
    items.forEach(r => tbody.appendChild(renderRow(r)));
  } catch (e) {
    showErrors(listErrors, [e.message]);
  }
}

// --- Создание заявки ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  showErrors(formErrors, []);

  const fd = new FormData(form);
  const payload = {
    fullName: (fd.get('fullName') || '').toString().trim(),
    dateFrom: (fd.get('dateFrom') || '').toString(),
    dateTo: (fd.get('dateTo') || '').toString(),
    reason: (fd.get('reason') || '').toString().trim()
  };

  // Клиентская валидация — только для UX. Источник истины — сервер.
  const clientErrors = [];
  if (!payload.fullName) clientErrors.push('ФИО обязательно');
  if (!payload.dateFrom) clientErrors.push('Дата начала обязательна');
  if (!payload.dateTo) clientErrors.push('Дата окончания обязательна');
  if (!payload.reason) clientErrors.push('Причина обязательна');
  if (payload.dateFrom && payload.dateTo && payload.dateTo < payload.dateFrom) {
    clientErrors.push('Дата окончания не может быть раньше даты начала');
  }
  if (clientErrors.length) {
    showErrors(formErrors, clientErrors);
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  try {
    await api('/requests', { method: 'POST', body: JSON.stringify(payload) });
    form.reset();
    await loadRequests();
  } catch (err) {
    showErrors(formErrors, err.message.split('\n'));
  } finally {
    submitBtn.disabled = false;
  }
});

// --- Решения по заявке (делегирование) ---
tbody.addEventListener('click', async (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;

  const tr = btn.closest('tr');
  const id = tr.dataset.id;
  const action = btn.dataset.action;

  let status, rejectReason;
  if (action === 'approve') {
    status = 'approved';
  } else {
    const input = prompt('Укажите причину отклонения:');
    if (input === null) return;               // отмена
    const trimmed = input.trim();
    if (!trimmed) {
      alert('Причина отклонения обязательна');
      return;
    }
    status = 'rejected';
    rejectReason = trimmed;
  }

  btn.disabled = true;
  try {
    await api(`/requests/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ status, rejectReason })
    });
    await loadRequests();
  } catch (err) {
    alert(err.message);
    btn.disabled = false;
  }
});

statusFilter.addEventListener('change', loadRequests);

loadRequests();