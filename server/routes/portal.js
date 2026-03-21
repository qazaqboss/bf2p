'use strict';
const router = require('express').Router();
const db = require('../db');
const { auth } = require('./auth');

// Middleware: only client role
function clientOnly(req, res, next) {
  if (req.user.role !== 'client' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ запрещён' });
  }
  next();
}

// GET /api/portal/me — профиль клиента + договор
router.get('/me', auth, clientOnly, (req, res) => {
  const clientId = req.user.client_id;
  if (!clientId) return res.status(404).json({ error: 'Клиент не найден' });

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
  if (!client) return res.status(404).json({ error: 'Клиент не найден' });

  const agreement = db.prepare(`
    SELECT a.*, tp.name as tariff_name, tp.series, tp.k1_rate,
           tp.k2_rate_0_30, tp.k2_rate_30_60, tp.k2_rate_60_90, tp.k2_rate_90_120, tp.k2_rate_120plus
    FROM agreements a
    LEFT JOIN tariff_plans tp ON a.tariff_plan_id = tp.id
    WHERE a.client_id = ? AND a.status = 'active'
    ORDER BY a.date_signed DESC LIMIT 1
  `).get(clientId);

  res.json({ client, agreement });
});

// GET /api/portal/stats — сводная статистика клиента
router.get('/stats', auth, clientOnly, (req, res) => {
  const clientId = req.user.client_id;
  if (!clientId) return res.status(404).json({ error: 'Клиент не найден' });

  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_deals,
      ROUND(SUM(financing_sum), 2) as total_financed,
      ROUND(SUM(document_sum), 2) as total_docs,
      SUM(CASE WHEN status IN ('open','overdue','default') THEN 1 ELSE 0 END) as active_deals,
      ROUND(SUM(CASE WHEN status IN ('open','overdue','default') THEN current_od ELSE 0 END), 2) as active_od,
      SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed_deals,
      SUM(CASE WHEN status IN ('overdue','default') THEN 1 ELSE 0 END) as overdue_deals,
      ROUND(SUM(k1_accrued_net + k2_accrued_net), 2) as total_commissions,
      ROUND(SUM(CASE WHEN vop > 0 THEN vop ELSE 0 END), 2) as total_vop
    FROM financings WHERE client_id = ? AND status != 'draft'
  `).get(clientId);

  const upcoming = db.prepare(`
    SELECT f.id, f.number, f.current_od, f.planned_repayment, f.days_overdue, f.status,
           d.name as debtor_name, f.notice_number
    FROM financings f
    LEFT JOIN debtors d ON f.debtor_id = d.id
    WHERE f.client_id = ? AND f.status IN ('open','overdue','default')
    ORDER BY f.planned_repayment ASC LIMIT 5
  `).all(clientId);

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as cnt, ROUND(SUM(current_od), 2) as od
    FROM financings WHERE client_id = ? AND status != 'draft'
    GROUP BY status
  `).all(clientId);

  res.json({ stats, upcoming, byStatus });
});

// GET /api/portal/financings — список финансирований клиента
router.get('/financings', auth, clientOnly, (req, res) => {
  const clientId = req.user.client_id;
  if (!clientId) return res.status(404).json({ error: 'Клиент не найден' });

  const { status } = req.query;
  let sql = `
    SELECT f.*, d.name as debtor_name, tp.name as tariff_name, tp.series
    FROM financings f
    LEFT JOIN debtors d ON f.debtor_id = d.id
    LEFT JOIN tariff_plans tp ON f.tariff_plan_id = tp.id
    WHERE f.client_id = ?
  `;
  const params = [clientId];
  if (status && status !== 'all') { sql += ' AND f.status = ?'; params.push(status); }
  sql += ' ORDER BY f.created_at DESC';

  const items = db.prepare(sql).all(...params);
  res.json({ items, total: items.length });
});

// GET /api/portal/financings/:id — детали одного финансирования
router.get('/financings/:id', auth, clientOnly, (req, res) => {
  const clientId = req.user.client_id;
  const fin = db.prepare(`
    SELECT f.*, d.name as debtor_name, d.bin as debtor_bin, d.rating as debtor_rating,
           tp.name as tariff_name, tp.series, tp.k1_rate,
           tp.k2_rate_0_30, tp.k2_rate_30_60, tp.k2_rate_60_90, tp.k2_rate_90_120, tp.k2_rate_120plus
    FROM financings f
    LEFT JOIN debtors d ON f.debtor_id = d.id
    LEFT JOIN tariff_plans tp ON f.tariff_plan_id = tp.id
    WHERE f.id = ? AND f.client_id = ?
  `).get(req.params.id, clientId);
  if (!fin) return res.status(404).json({ error: 'Финансирование не найдено' });

  const operations = db.prepare(`
    SELECT * FROM financing_operations WHERE financing_id = ? ORDER BY operation_date ASC
  `).all(req.params.id);

  res.json({ fin, operations });
});

// GET /api/portal/debtors — список дебиторов (для формы заявки)
router.get('/debtors', auth, clientOnly, (req, res) => {
  const debtors = db.prepare(`
    SELECT id, name, bin, rating, credit_limit, industry, notification_signed
    FROM debtors ORDER BY name ASC
  `).all();
  res.json({ debtors });
});

// POST /api/portal/request — подача заявки на финансирование
router.post('/request', auth, clientOnly, (req, res) => {
  const clientId = req.user.client_id;
  if (!clientId) return res.status(403).json({ error: 'Клиент не найден' });

  const { debtor_id, avr_number, avr_date, document_sum, installment_days, comment } = req.body;
  if (!debtor_id || !avr_number || !avr_date || !document_sum || !installment_days) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }

  // Получить ГД и тариф клиента
  const agreement = db.prepare(`
    SELECT * FROM agreements WHERE client_id = ? AND status = 'active' ORDER BY date_signed DESC LIMIT 1
  `).get(clientId);
  if (!agreement) return res.status(400).json({ error: 'Нет активного генерального договора' });

  const discount = agreement.default_discount || 0.85;
  const financingSum = Math.round(document_sum * discount * 100) / 100;

  // Номер финансирования
  const last = db.prepare("SELECT number FROM financings ORDER BY created_at DESC LIMIT 1").get();
  let nextNum = 1;
  if (last?.number) {
    const m = last.number.match(/(\d+)$/);
    if (m) nextNum = parseInt(m[1]) + 1;
  }
  const number = 'F-' + String(nextNum).padStart(4, '0');

  // Плановое гашение
  const avrD = new Date(avr_date);
  avrD.setDate(avrD.getDate() + parseInt(installment_days));
  const plannedRepayment = avrD.toISOString().split('T')[0];

  // Создать черновик финансирования
  const id = require('crypto').randomBytes(8).toString('hex');
  db.prepare(`
    INSERT INTO financings(id, number, client_id, debtor_id, agreement_id, tariff_plan_id,
      avr_number, avr_date, installment_days, document_sum, discount, financing_sum,
      planned_repayment, factoring_type, current_od, status, comment, manager)
    VALUES (?,?,?,?,?,?, ?,?,?,?,?,?, ?,?,?,?,?,?)
  `).run(
    id, number, clientId, debtor_id, agreement.id, agreement.tariff_plan_id,
    avr_number, avr_date, parseInt(installment_days), parseFloat(document_sum), discount, financingSum,
    plannedRepayment, agreement.factoring_type || 'with_notice', financingSum, 'draft',
    comment || '', 'Портал клиента'
  );

  res.json({ success: true, id, number, financing_sum: financingSum, planned_repayment: plannedRepayment });
});

module.exports = router;
