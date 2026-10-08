import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { CreateForm } from './components/CreateForm.jsx';
import { RequestsTable } from './components/RequestsTable.jsx';
import { ErrorsList } from './components/ErrorsList.jsx';


function App() {

  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('all');
  const [listErrors, setListErrors] = useState([]);

  const load = useCallback(async () => {
    setListErrors([]);
    try {
      const qs = filter === 'all' ? '' : `?status=${encodeURIComponent(filter)}`;
      const items = await api('/requests' + qs);
      setRows(items);
    } catch (e) {
      setListErrors([e.message]);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);


  return (
    <main className="container">
      <h1>Заявки на отпуск</h1>

      <CreateForm onCreated={load} />

      <section className="card">
        <div className="list-header">
          <h2>Список заявок</h2>
          <label>Фильтр по статусу
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Все</option>
              <option value="pending">Ожидает</option>
              <option value="approved">Одобрена</option>
              <option value="rejected">Отклонена</option>
            </select>
          </label>
        </div>
        <ErrorsList messages={listErrors} />
        <RequestsTable rows={rows} onChanged={load} />
      </section>
    </main>
  );
}

export default App
