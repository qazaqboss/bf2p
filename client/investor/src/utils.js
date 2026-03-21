export function fmt(n, compact = false) {
  if (n === null || n === undefined || n === '') return '—';
  const v = parseFloat(n);
  if (isNaN(v)) return '—';
  if (compact) {
    if (Math.abs(v) >= 1e9) return '₸\u00a0' + (v/1e9).toFixed(2) + '\u00a0млрд';
    if (Math.abs(v) >= 1e6) return '₸\u00a0' + (v/1e6).toFixed(1) + '\u00a0млн';
    if (Math.abs(v) >= 1e3) return '₸\u00a0' + (v/1e3).toFixed(0) + '\u00a0тыс.';
  }
  return '₸\u00a0' + Math.round(v).toLocaleString('ru-RU');
}

export function fmtPct(n, decimals = 2) {
  if (n === null || n === undefined) return '—';
  return (parseFloat(n)).toFixed(decimals) + '%';
}

export function fmtDate(s) {
  if (!s) return '—';
  const [y, m, d] = String(s).split('T')[0].split('-');
  return `${d}.${m}.${y}`;
}

export function fmtMonth(s) {
  if (!s) return '—';
  const months = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
  const [y, m] = s.split('-');
  return `${months[+m-1]} ${y}`;
}

export function statusTag(status) {
  return {
    draft:   { text: 'Черновик', cls: 'tag-gray' },
    open:    { text: 'Активно',  cls: 'tag-green' },
    overdue: { text: 'Просрочка', cls: 'tag-red' },
    default: { text: 'Дефолт',  cls: 'tag-red' },
    closed:  { text: 'Закрыто', cls: 'tag-blue' },
  }[status] || { text: status, cls: 'tag-gray' };
}

export function ratingTag(r) {
  return { A:'tag-green', B:'tag-blue', C:'tag-amber', D:'tag-red' }[r] || 'tag-gray';
}

export function today() {
  return new Date().toISOString().split('T')[0];
}

export function calcYield(commissions, financed) {
  if (!financed || financed <= 0) return 0;
  return (commissions / financed * 100).toFixed(2);
}
