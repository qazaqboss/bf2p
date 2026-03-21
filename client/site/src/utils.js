export function fmt(n, compact = false) {
  if (n === null || n === undefined || n === '') return '—';
  const v = parseFloat(n);
  if (isNaN(v)) return '—';
  if (compact) {
    if (Math.abs(v) >= 1e9) return '₸\u00a0' + (v / 1e9).toFixed(2) + '\u00a0млрд';
    if (Math.abs(v) >= 1e6) return '₸\u00a0' + (v / 1e6).toFixed(1) + '\u00a0млн';
    if (Math.abs(v) >= 1e3) return '₸\u00a0' + (v / 1e3).toFixed(0) + '\u00a0тыс.';
  }
  return '₸\u00a0' + Math.round(v).toLocaleString('ru-RU');
}

export function fmtPct(n, d = 2) {
  if (n == null) return '—';
  return parseFloat(n).toFixed(d) + '%';
}

export function fmtDate(s) {
  if (!s) return '—';
  const [y, m, d] = String(s).split('T')[0].split('-');
  return `${d}.${m}.${y}`;
}

export function fmtMonth(s) {
  if (!s) return '—';
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
  const [y, m] = s.split('-');
  return `${months[+m - 1]} ${y}`;
}

export function today() {
  return new Date().toISOString().split('T')[0];
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / 86400000);
}
