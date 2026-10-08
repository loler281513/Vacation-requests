import { useState } from 'react';
import { ErrorsList } from './ErrorsList.jsx';

export function RejectModal({ onCancel, onConfirm, busy }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Причина отклонения обязательна');
      return;
    }
    onConfirm(trimmed);
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Причина отклонения</h2>
        <form onSubmit={handleSubmit}>
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(null); }}
          />
          <ErrorsList messages={error ? [error] : []} />
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onCancel} disabled={busy}>
              Отмена
            </button>
            <button type="submit" className="danger" disabled={busy}>
              Отклонить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}