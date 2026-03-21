'use strict';
const router = require('express').Router();
const db = require('../db');
const { auth } = require('./auth');

router.get('/dashboard', auth, (req, res) => {
  const portfolio = db.prepare(`
    SELECT COUNT(*) as count, ROUND(SUM(current_od),2) as total_od,
           ROUND(SUM(k1_accrued_net+k2_accrued_net),2) as total_commissions
    FROM financings WHERE status IN ('open','overdue','default')
  `).get();

  const overdue = db.prepare(`
    SELECT COUNT(*) as count, ROUND(SUM(current_od),2) as total_od
    FROM financings WHERE status IN ('overdue','default')
  `).get();

  const by_status = db.prepare(`
    SELECT status, COUNT(*) as cnt, ROUND(SUM(current_od),2) as od
    FROM financings GROUP BY status
  `).all();

  const top_clients = db.prepare(`
    SELECT c.name, COUNT(f.id) as deals, ROUND(SUM(f.current_od),2) as od
    FROM financings f JOIN clients c ON f.client_id=c.id
    WHERE f.status IN ('open','overdue','default')
    GROUP BY f.client_id ORDER BY od DESC LIMIT 10
  `).all();

  const upcoming = db.prepare(`
    SELECT f.number, f.current_od, f.planned_repayment, f.status, f.days_overdue,
           c.name as client_name, d.name as debtor_name
    FROM financings f
    LEFT JOIN clients c ON f.client_id=c.id
    LEFT JOIN debtors d ON f.debtor_id=d.id
    WHERE f.status IN ('open','overdue','default') AND f.planned_repayment IS NOT NULL
    ORDER BY f.planned_repayment ASC LIMIT 10
  `).all();

  const commissions_by_month = db.prepare(`
    SELECT strftime('%Y-%m', period_date) as month,
           ROUND(SUM(k1_gross),2) as k1_gross,
           ROUND(SUM(k2_gross),2) as k2_gross,
           ROUND(SUM(total_gross),2) as total
    FROM commission_periods
    GROUP BY 1 ORDER BY 1 DESC LIMIT 12
  `).all();

  res.json({ portfolio, overdue, by_status, top_clients, upcoming_repayments: upcoming, commissions_by_month });
});

router.get('/commissions', auth, (req, res) => {
  const { date_from, date_to, client_id } = req.query;
  let sql = `
    SELECT cp.*, f.number as fin_number, f.notice_number,
           c.name as client_name, d.name as debtor_name
    FROM commission_periods cp
    JOIN financings f ON cp.financing_id=f.id
    JOIN clients c ON f.client_id=c.id
    JOIN debtors d ON f.debtor_id=d.id
    WHERE 1=1
  `;
  const p = [];
  if (date_from) { sql += ' AND cp.period_date >= ?'; p.push(date_from); }
  if (date_to)   { sql += ' AND cp.period_date <= ?'; p.push(date_to); }
  if (client_id) { sql += ' AND f.client_id = ?'; p.push(client_id); }
  sql += ' ORDER BY cp.period_date ASC, c.name ASC';

  const rows = db.prepare(sql).all(...p);
  const grandTotal = rows.reduce((s, r) => s + (r.total_gross || 0), 0);
  res.json({ rows, grandTotal: Math.round(grandTotal * 100) / 100, totalRows: rows.length });
});

router.get('/aging', auth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const overdue = db.prepare(`
    SELECT f.*, c.name as client_name, d.name as debtor_name,
           CAST(MAX(0, julianday(?) - julianday(f.planned_repayment)) AS INTEGER) as real_days
    FROM financings f
    LEFT JOIN clients c ON f.client_id=c.id
    LEFT JOIN debtors d ON f.debtor_id=d.id
    WHERE f.status IN ('overdue','default') AND f.planned_repayment IS NOT NULL
    ORDER BY real_days DESC
  `).all(today);

  const rppuRates = { '0_7': 0, '8_30': 0.25, '31_60': 0.50, '60plus': 1.00 };
  const bucket = (d) => d <= 7 ? '0_7' : d <= 30 ? '8_30' : d <= 60 ? '31_60' : '60plus';
  const buckets = { '0_7': [], '8_30': [], '31_60': [], '60plus': [] };
  for (const f of overdue) buckets[bucket(f.real_days)].push(f);

  const result = Object.entries(buckets).map(([key, items]) => ({
    key,
    label: { '0_7': '0–7 дней', '8_30': '8–30 дней', '31_60': '31–60 дней', '60plus': '60+ дней' }[key],
    rppuRate: rppuRates[key],
    count: items.length,
    sum_od: Math.round(items.reduce((s, f) => s + (f.current_od || 0), 0)),
    rppu: Math.round(items.reduce((s, f) => s + (f.current_od || 0) * rppuRates[key], 0)),
    items,
  }));

  res.json({ buckets: result, total_rppu: result.reduce((s, b) => s + b.rppu, 0) });
});

router.get('/investor', auth, (req, res) => {
  const portfolio = db.prepare(`
    SELECT
      COUNT(*) as total_deals,
      ROUND(SUM(financing_sum),2) as total_financed,
      ROUND(SUM(document_sum),2) as total_docs,
      SUM(CASE WHEN status IN ('open','overdue','default') THEN 1 ELSE 0 END) as active_deals,
      ROUND(SUM(CASE WHEN status IN ('open','overdue','default') THEN current_od ELSE 0 END),2) as active_od,
      SUM(CASE WHEN status='closed' THEN 1 ELSE 0 END) as closed_deals,
      SUM(CASE WHEN status IN ('overdue','default') THEN 1 ELSE 0 END) as overdue_deals,
      ROUND(SUM(k1_accrued_net),2) as total_k1,
      ROUND(SUM(k2_accrued_net),2) as total_k2
    FROM financings WHERE status != 'draft'
  `).get();

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as cnt, ROUND(SUM(current_od),2) as od
    FROM financings WHERE status != 'draft' GROUP BY status
  `).all();

  const monthlyNew = db.prepare(`
    SELECT strftime('%Y-%m', date_financing) as month,
           COUNT(*) as cnt,
           ROUND(SUM(financing_sum),2) as volume
    FROM financings WHERE date_financing IS NOT NULL
    GROUP BY 1 ORDER BY 1 DESC LIMIT 15
  `).all().reverse();

  const upcoming = db.prepare(`
    SELECT f.id, f.current_od, f.planned_repayment, f.days_overdue,
           c.name as client_name, d.name as debtor_name
    FROM financings f
    LEFT JOIN clients c ON f.client_id=c.id
    LEFT JOIN debtors d ON f.debtor_id=d.id
    WHERE f.status IN ('open','overdue','default') AND f.planned_repayment IS NOT NULL
    ORDER BY f.planned_repayment ASC LIMIT 15
  `).all();

  const vopStats = db.prepare(`
    SELECT ROUND(SUM(CASE WHEN vop > 0 THEN vop ELSE 0 END),2) as total_vop_positive,
           ROUND(SUM(CASE WHEN vop < 0 THEN vop ELSE 0 END),2) as total_vop_negative
    FROM financings WHERE status='closed'
  `).get();

  res.json({ portfolio, byStatus, monthlyNew, upcoming, vopStats });
});

router.get('/commissions-summary', auth, (req, res) => {
  // Monthly breakdown by financing date using accrued commissions
  const vatRate = 0.16;
  const monthly = db.prepare(`
    SELECT strftime('%Y-%m', date_financing) as month,
           ROUND(SUM(k1_accrued_net) * ${1 + vatRate}, 2) as k1_gross,
           ROUND(SUM(k2_accrued_net) * ${1 + vatRate}, 2) as k2_gross,
           ROUND(SUM(k1_accrued_net + k2_accrued_net) * ${1 + vatRate}, 2) as total
    FROM financings
    WHERE date_financing IS NOT NULL AND status != 'draft'
    GROUP BY 1 ORDER BY 1 ASC LIMIT 18
  `).all();

  const totals = db.prepare(`
    SELECT ROUND(SUM(k1_accrued_net) * ${1 + vatRate}, 2) as k1_gross,
           ROUND(SUM(k2_accrued_net) * ${1 + vatRate}, 2) as k2_gross,
           ROUND(SUM(k1_accrued_net + k2_accrued_net) * ${1 + vatRate}, 2) as total
    FROM financings WHERE status != 'draft'
  `).get();

  res.json({ monthly, totals });
});

router.get('/portfolio', auth, (req, res) => {
  const rows = db.prepare(`
    SELECT f.status, f.document_sum, f.financing_sum, f.current_od,
           f.k1_accrued_net, f.k2_accrued_net, f.avr_date,
           c.name as client_name, d.name as debtor_name,
           tp.series as tariff_series
    FROM financings f
    LEFT JOIN clients c ON f.client_id=c.id
    LEFT JOIN debtors d ON f.debtor_id=d.id
    LEFT JOIN tariff_plans tp ON f.tariff_plan_id=tp.id
    WHERE f.status IN ('open','overdue','default')
    ORDER BY f.current_od DESC
  `).all();

  const byClient = {}, bySeries = {}, byStatus = {};
  let totalOD = 0, totalDocs = 0;

  for (const r of rows) {
    totalOD += r.current_od || 0;
    totalDocs += r.document_sum || 0;
    byClient[r.client_name] = (byClient[r.client_name] || 0) + (r.current_od || 0);
    bySeries[r.tariff_series] = (bySeries[r.tariff_series] || 0) + (r.current_od || 0);
    byStatus[r.status] = (byStatus[r.status] || 0) + (r.current_od || 0);
  }

  res.json({
    count: rows.length,
    total_od: Math.round(totalOD),
    total_docs: Math.round(totalDocs),
    by_client: Object.entries(byClient).sort((a, b) => b[1] - a[1]).slice(0, 10),
    by_series: Object.entries(bySeries).sort((a, b) => b[1] - a[1]),
    by_status: Object.entries(byStatus),
  });
});

module.exports = router;
