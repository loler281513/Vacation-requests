import { useState } from 'react';
import { api } from '../api.js';
import { ErrorsList } from './ErrorsList.jsx';

const EMPTY = { fullName: '', dateFrom: '', dateTo: '', reason: '' };

export function CreateForm({ onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);

    const payload = {
      fullName: form.fullName.trim(),
      dateFrom: form.dateFrom,
      dateTo: form.dateTo,
      reason: form.reason.trim(),
    };

    const clientErrors = [];
    if (!payload.fullName) clientErrors.push('ФИО обязательно');
    if (!payload.dateFrom) clientErrors.push('Дата начала обязательна');
    if (!payload.dateTo) clientErrors.push('Дата окончания обязательна');
    if (!payload.reason) clientErrors.push('Причина обязательна');
    if (payload.dateFrom && payload.dateTo && payload.dateTo < payload.dateFrom) {
      clientErrors.push('Дата окончания не может быть раньше даты начала');
    }
    if (clientErrors.length) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      await api('/requests', { method: 'POST', body: JSON.stringify(payload) });
      setForm(EMPTY);
      await onCreated();
    } catch (err) {
      setErrors(err.message.split('\n'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card">
      <h2>Новая заявка</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label>ФИО
          <input
            name="fullName"
            type="text"
            required
            value={form.fullName}
            onChange={update('fullName')}
          />
        </label>
        <div className="row">
          <label>Дата с
            <input
              name="dateFrom"
              type="date"
              required
              value={form.dateFrom}
              onChange={update('dateFrom')}
            />
          </label>
          <label>Дата по
            <input
              name="dateTo"
              type="date"
              required
              value={form.dateTo}
              onChange={update('dateTo')}
            />
          </label>
        </div>
        <label>Причина
          <textarea
            name="reason"
            rows="2"
            required
            value={form.reason}
            onChange={update('reason')}
          />
        </label>
        <ErrorsList messages={errors} />
        <button type="submit" disabled={submitting}>Отправить</button>
      </form>
    </section>
  );
}