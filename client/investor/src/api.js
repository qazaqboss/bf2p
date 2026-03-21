const BASE = '/api';

function getToken() { return localStorage.getItem('inv_token'); }

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
  login: (email, password) => req('POST', '/auth/login', { email, password }),
  me: () => req('GET', '/auth/me'),

  // Investor analytics
  investorSummary: () => req('GET', '/analytics/investor'),
  dashboard: () => req('GET', '/analytics/dashboard'),
  portfolio: () => req('GET', '/analytics/portfolio'),
  aging: () => req('GET', '/analytics/aging'),
  commissions: () => req('GET', '/analytics/commissions-summary'),

  // Financings
  financings: (q = {}) => req('GET', '/financings?' + new URLSearchParams(q)),
  svod: () => req('GET', '/financings/svod'),
};
