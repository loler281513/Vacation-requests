import { useState } from 'react';
import { api } from '../api.js';
import { STATUS_LABELS, formatDate } from '../utils.js';
import { RejectModal } from './RejectModal.jsx';

function StatusCell({ row }) {
  return (
    <>
      <span className={`badge ${row.status}`}>{STATUS_LABELS[row.status]}</span>
      {row.status === 'rejected' && row.rejectReason && (
        <div className="muted">Причина отказа: {row.rejectReason}</div>
      )}
    </>
  );
}

function Actions({ row, onApprove, onReject }) {
  if (row.status !== 'pending') return <span className="muted">—</span>;
  return (
    <div className="actions">
      <button onClick={() => onApprove(row.id)}>Одобрить</button>
      <button className="danger" onClick={() => onReject(row.id)}>Отклонить</button>
    </div>
  );
}

export function RequestsTable({ rows, onChanged }) {
  const [rejectingId, setRejectingId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function approve(id) {
    setBusyId(id);
    try {
      await api(`/requests/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ status: 'approved' }),
      });
      await onChanged();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject(reason) {
    const id = rejectingId;
    setBusyId(id);
    try {
      await api(`/requests/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ status: 'rejected', rejectReason: reason }),
      });
      setRejectingId(null);
      await onChanged();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  if (!rows.length) {
    return (
      <table>
        <thead>
          <tr>
            <th>ФИО</th><th>Период</th><th>Дней</th>
            <th>Причина</th><th>Статус</th><th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colSpan="6" className="muted">Заявок пока нет</td></tr>
        </tbody>
      </table>
    );
  }

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>ФИО</th><th>Период</th><th>Дней</th>
            <th>Причина</th><th>Статус</th><th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.fullName}</td>
              <td>{formatDate(r.dateFrom)} — {formatDate(r.dateTo)}</td>
              <td>{r.days}</td>
              <td>{r.reason}</td>
              <td><StatusCell row={r} /></td>
              <td>
                <Actions
                  row={r}
                  onApprove={(id) => busyId === id ? null : approve(id)}
                  onReject={(id) => busyId === id ? null : setRejectingId(id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rejectingId != null && (
        <RejectModal
          onCancel={() => setRejectingId(null)}
          onConfirm={confirmReject}
          busy={busyId === rejectingId}
        />
      )}
    </>
  );
}