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

export function fmtPct(n) {
  if (n === null || n === undefined) return '—';
  return (parseFloat(n) * 100).toFixed(3).replace(/\.?0+$/, '') + '%';
}

export function fmtDate(s) {
  if (!s) return '—';
  const [y, m, d] = String(s).split('T')[0].split('-');
  return `${d}.${m}.${y}`;
}

export function fmtDateTime(s) {
  if (!s) return '—';
  const dt = new Date(s);
  return dt.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function daysUntil(dateStr, status) {
  if (!dateStr || status === 'closed') return { text: '—', cls: 'tag-gray' };
  const diff = Math.floor((new Date(dateStr) - new Date()) / 86400000);
  if (diff < 0)  return { text: `Просрочка ${Math.abs(diff)} дн.`, cls: 'tag-red' };
  if (diff === 0) return { text: 'Сегодня!', cls: 'tag-amber' };
  if (diff <= 7) return { text: `+${diff} дн.`, cls: 'tag-amber' };
  return { text: `+${diff} дн.`, cls: 'tag-green' };
}

export function statusTag(status) {
  return {
    draft:   { text: 'Черновик', cls: 'tag-gray' },
    open:    { text: 'Открыто',  cls: 'tag-blue' },
    overdue: { text: 'Просрочка', cls: 'tag-red' },
    default: { text: 'Дефолт',  cls: 'tag-red' },
    closed:  { text: 'Закрыто', cls: 'tag-green' },
  }[status] || { text: status, cls: 'tag-gray' };
}

export function ratingTag(r) {
  return {
    A: 'tag-green', B: 'tag-blue', C: 'tag-amber', D: 'tag-red'
  }[r] || 'tag-gray';
}

export function today() {
  return new Date().toISOString().split('T')[0];
}

export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}
