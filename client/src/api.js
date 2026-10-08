const API = '/api';

export async function api(path, options = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
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