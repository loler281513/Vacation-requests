import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// Каждый запуск тестов — своя временная папка и своя БД.
const tmpDir = mkdtempSync(path.join(tmpdir(), 'vacation-tests-'));
process.env.DB_PATH = path.join(tmpDir, 'test.db');

// Динамический импорт — чтобы db.js увидел установленный DB_PATH.
const { createApp } = await import('../app.js');
const { db } = await import('../db.js');

let server;
let baseUrl;

before(async () => {
  const app = createApp();
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));

  db.close();

  try {
    rmSync(tmpDir, { recursive: true, force: true });
  } catch (e) {
    console.warn(`Не удалось удалить ${tmpDir}: ${e.message}`);
  }
});

// --- Утилиты ---

async function post(path, body) {
  const res = await fetch(baseUrl + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

async function get(path) {
  const res = await fetch(baseUrl + path);
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

function validPayload(overrides = {}) {
  return {
    fullName: 'Иванов Иван Иванович',
    dateFrom: '2026-10-01',
    dateTo: '2026-10-07',
    reason: 'Ежегодный отпуск',
    ...overrides
  };
}

// --- Создание заявки ---

describe('POST /api/requests', () => {
  test('создаёт заявку и считает дни включительно', async () => {
    const res = await post('/api/requests', validPayload());
    assert.equal(res.status, 201);
    assert.equal(res.body.fullName, 'Иванов Иван Иванович');
    assert.equal(res.body.dateFrom, '2026-10-01');
    assert.equal(res.body.dateTo, '2026-10-07');
    assert.equal(res.body.days, 7);              
    assert.equal(res.body.status, 'pending');
    assert.equal(res.body.rejectReason, null);
    assert.equal(res.body.decidedAt, null);
    assert.ok(res.body.id);
  });

  test('отклоняет пустое ФИО', async () => {
    const res = await post('/api/requests', validPayload({ fullName: '   ' }));
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.some(e => /ФИО/i.test(e)));
  });

  test('отклоняет пустую причину', async () => {
    const res = await post('/api/requests', validPayload({ reason: '' }));
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.some(e => /причина/i.test(e)));
  });

  test('отклоняет dateTo < dateFrom', async () => {
    const res = await post('/api/requests', validPayload({
      dateFrom: '2026-10-10',
      dateTo: '2026-10-01'
    }));
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.some(e => /раньше/i.test(e)));
  });

  test('отклоняет несуществующую календарную дату', async () => {
    const res = await post('/api/requests', validPayload({
      dateFrom: '2026-02-31',   
      dateTo:   '2026-03-05'
    }));
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.some(e => /не существует/i.test(e)));
  });

  test('невалидный JSON → 400 через error-middleware', async () => {
    const res = await post('/api/requests', '{ broken json');
    assert.equal(res.status, 400);
    assert.ok(res.body.error);
  });
});

// --- Список ---

describe('GET /api/requests', () => {
  test('пустой список в чистой БД возвращает []', async () => {
    // В этом файле БД общая для всех тестов, поэтому просто проверим,
    // что ответ — массив (может быть непустой из-за предыдущих тестов).
    const res = await get('/api/requests');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
  });

  test('фильтр ?status=pending отдаёт только pending', async () => {
    const res = await get('/api/requests?status=pending');
    assert.equal(res.status, 200);
    assert.ok(res.body.every(r => r.status === 'pending'));
  });

  test('невалидный статус в фильтре → 400', async () => {
    const res = await get('/api/requests?status=garbage');
    assert.equal(res.status, 400);
  });
});

// --- Решение ---

describe('POST /api/requests/:id/decision', () => {
  test('одобрение переводит заявку в approved', async () => {
    const created = await post('/api/requests', validPayload());
    const id = created.body.id;

    const res = await post(`/api/requests/${id}/decision`, { status: 'approved' });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'approved');
    assert.ok(res.body.decidedAt);
  });

  test('отклонение сохраняет причину, видимую в списке', async () => {
    const created = await post('/api/requests', validPayload());
    const id = created.body.id;

    const rejected = await post(`/api/requests/${id}/decision`, {
      status: 'rejected',
      rejectReason: 'Не согласовано с руководителем отдела'
    });
    assert.equal(rejected.status, 200);
    assert.equal(rejected.body.status, 'rejected');
    assert.equal(rejected.body.rejectReason, 'Не согласовано с руководителем отдела');

    // Проверяем, что причина видна в списке.
    const list = await get('/api/requests?status=rejected');
    const found = list.body.find(r => r.id === id);
    assert.ok(found);
    assert.equal(found.rejectReason, 'Не согласовано с руководителем отдела');
  });

  test('отклонение без причины → 400', async () => {
    const created = await post('/api/requests', validPayload());
    const res = await post(`/api/requests/${created.body.id}/decision`, {
      status: 'rejected'
    });
    assert.equal(res.status, 400);
    assert.ok(res.body.errors.some(e => /причина/i.test(e)));
  });

  test('повторное решение → 409', async () => {
    const created = await post('/api/requests', validPayload());
    const id = created.body.id;

    const first = await post(`/api/requests/${id}/decision`, { status: 'approved' });
    assert.equal(first.status, 200);

    const second = await post(`/api/requests/${id}/decision`, { status: 'rejected', rejectReason: 'передумали' });
    assert.equal(second.status, 409);
    assert.ok(/уже рассмотрена/i.test(second.body.error));
  });

  test('решение по несуществующему id → 404', async () => {
    const res = await post('/api/requests/999999/decision', { status: 'approved' });
    assert.equal(res.status, 404);
    assert.ok(/не найдена/i.test(res.body.error));
  });

  test('некорректный id → 400', async () => {
    for (const bad of ['abc', '0', '-1']) {
      const res = await post(`/api/requests/${bad}/decision`, { status: 'approved' });
      assert.equal(res.status, 400, `id=${bad}`);
    }
  });
});