const BASE = '/api';

function getToken() { return localStorage.getItem('sf_token'); }

async function req(method, path, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(BASE + path, opts);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
  return data;
}

export const api = {
  // Auth
  login: (email, password) => req('POST', '/auth/login', { email, password }),
  me: () => req('GET', '/auth/me'),

  // Financings
  financings: (q = {}) => req('GET', '/financings?' + new URLSearchParams(q)),
  svod: () => req('GET', '/financings/svod'),
  financing: (id) => req('GET', `/financings/${id}`),
  createFinancing: (data) => req('POST', '/financings', data),
  openFinancing: (id, date_financing) => req('POST', `/financings/${id}/open`, { date_financing }),
  applyPayment: (id, data) => req('POST', `/financings/${id}/payment`, data),
  previewCalc: (id, date) => req('GET', `/financings/${id}/preview?date=${date}`),
  correctFinancing: (id, data) => req('POST', `/financings/${id}/correct`, data),
  patchFinancing: (id, data) => req('PATCH', `/financings/${id}`, data),
  deleteFinancing: (id) => req('DELETE', `/financings/${id}`),

  // Clients
  clients: (q = {}) => req('GET', '/clients?' + new URLSearchParams(q)),
  client: (id) => req('GET', `/clients/${id}`),
  createClient: (data) => req('POST', '/clients', data),
  patchClient: (id, data) => req('PATCH', `/clients/${id}`, data),

  // Debtors
  debtors: (q = {}) => req('GET', '/debtors?' + new URLSearchParams(q)),
  debtor: (id) => req('GET', `/debtors/${id}`),
  createDebtor: (data) => req('POST', '/debtors', data),
  patchDebtor: (id, data) => req('PATCH', `/debtors/${id}`, data),

  // Tariffs
  tariffs: (q = {}) => req('GET', '/tariff-plans?' + new URLSearchParams(q)),
  tariff: (id) => req('GET', `/tariff-plans/${id}`),
  createTariff: (data) => req('POST', '/tariff-plans', data),

  // Payments
  payments: (q = {}) => req('GET', '/payments?' + new URLSearchParams(q)),
  createPayment: (data) => req('POST', '/payments', data),
  executePayment: (id) => req('PATCH', `/payments/${id}/execute`),

  // Analytics
  dashboard: () => req('GET', '/analytics/dashboard'),
  analyticsPortfolio: () => req('GET', '/analytics/portfolio'),
  analyticsAging: () => req('GET', '/analytics/aging'),
  analyticsCommissions: (q = {}) => req('GET', '/analytics/commissions?' + new URLSearchParams(q)),
};
