export const STATUS_LABELS = {
  pending: 'Ожидает',
  approved: 'Одобрена',
  rejected: 'Отклонена',
};

export function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}