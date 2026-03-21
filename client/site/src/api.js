const BASE = '/api';

function getToken() { return localStorage.getItem('site_token'); }

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
  login:      (email, password) => req('POST', '/auth/login', { email, password }),
  me:         () => req('GET', '/auth/me'),

  // Client portal endpoints
  profile:    () => req('GET', '/portal/me'),
  stats:      () => req('GET', '/portal/stats'),
  financings: (q = {}) => req('GET', '/portal/financings?' + new URLSearchParams(q)),
  financing:  (id) => req('GET', `/portal/financings/${id}`),
  debtors:    () => req('GET', '/portal/debtors'),
  submitRequest: (data) => req('POST', '/portal/request', data),
};
