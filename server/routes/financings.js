'use strict';
const router = require('express').Router();
const db = require('../db');
const { auth } = require('./auth');
const C = require('../commission');
const crypto = require('crypto');

const genId = (n = 8) => crypto.randomBytes(n).toString('hex');

function getSetting(key) {
  return db.prepare('SELECT value FROM settings WHERE key = ?').get(key)?.value;
}

// GET /api/financings — список
router.get('/', auth, (req, res) => {
  const { status, client_id, debtor_id, search, page = 1, limit = 50 } = req.query;
  let sql = `
    SELECT f.*, c.name as client_name, d.name as debtor_name,
           tp.name as tariff_name, tp.series as tariff_series, tp.k1_rate
    FROM financings f
    LEFT JOIN clients c ON f.client_id = c.id
    LEFT JOIN debtors d ON f.debtor_id = d.id
    LEFT JOIN tariff_plans tp ON f.tariff_plan_id = tp.id
    WHERE 1=1
  `;
  const p = [];
  if (status)    { sql += ' AND f.status = ?';    p.push(status); }
  if (client_id) { sql += ' AND f.client_id = ?'; p.push(client_id); }
  if (debtor_id) { sql += ' AND f.debtor_id = ?'; p.push(debtor_id); }
  if (search) {
    sql += ' AND (c.name LIKE ? OR d.name LIKE ? OR f.number LIKE ? OR f.notice_number LIKE ?)';
    const s = `%${search}%`;
    p.push(s, s, s, s);
  }
  sql += ' ORDER BY f.created_at DESC LIMIT ? OFFSET ?';
  p.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

  const rows = db.prepare(sql).all(...p);
  res.json({ data: rows, total: rows.length, page: +page, limit: +limit });
});

// GET /api/financings/svod
router.get('/svod', auth, (req, res) => {
  const rows = db.prepare(`
    SELECT f.*, c.name as client_name, d.name as debtor_name, tp.name as tariff_name, tp.k1_rate
    FROM financings f
    LEFT JOIN clients c ON f.client_id = c.id
    LEFT JOIN debtors d ON f.debtor_id = d.id
    LEFT JOIN tariff_plans tp ON f.tariff_plan_id = tp.id
    WHERE f.status IN ('open','overdue','default')
    ORDER BY f.date_financing ASC
  `).all();
  const total_od = rows.reduce((s, r) => s + (r.current_od || 0), 0);
  res.json({ data: rows, total_od, count: rows.length });
});

// GET /api/financings/:id
router.get('/:id', auth, (req, res) => {
  const f = db.prepare(`
    SELECT f.*, c.name as client_name, d.name as debtor_name,
           tp.name as tariff_name, tp.series as tariff_series, tp.k1_rate,
           tp.k2_rate_0_30, tp.k2_rate_30_60, tp.k2_rate_60_90,
           tp.k2_rate_90_120, tp.k2_rate_120plus, tp.k3_rate_22_90,
           ag.number as agreement_number
    FROM financings f
    LEFT JOIN clients c ON f.client_id = c.id
    LEFT JOIN debtors d ON f.debtor_id = d.id
    LEFT JOIN tariff_plans tp ON f.tariff_plan_id = tp.id
    LEFT JOIN agreements ag ON f.agreement_id = ag.id
    WHERE f.id = ?
  `).get(req.params.id);
  if (!f) return res.status(404).json({ error: 'Финансирование не найдено' });

  const operations = db.prepare(
    'SELECT * FROM financing_operations WHERE financing_id = ? ORDER BY operation_date ASC, created_at ASC'
  ).all(req.params.id);

  const periods = db.prepare(
    'SELECT * FROM commission_periods WHERE financing_id = ? ORDER BY period_date ASC'
  ).all(req.params.id);

  res.json({ financing: f, operations, periods });
});

// POST /api/financings — создать
router.post('/', auth, (req, res) => {
  const {
    client_id, debtor_id, agreement_id, tariff_plan_id,
    notice_number, avr_number, avr_date, installment_days,
    document_sum, discount, guarantee_retention = 0,
    financing_sum: fin_sum_input, financing_sum_manual = false,
    factoring_type = 'with_notice', comment, manager
  } = req.body;

  if (!client_id || !debtor_id || !tariff_plan_id || !avr_date || !installment_days || !document_sum || !discount) {
    return res.status(400).json({ error: 'Не заполнены обязательные поля' });
  }

  const fin_sum = financing_sum_manual && fin_sum_input
    ? C.round2(fin_sum_input)
    : C.round2(document_sum * discount);

  const avrD = new Date(avr_date);
  avrD.setDate(avrD.getDate() + parseInt(installment_days));
  const planned_repayment = avrD.toISOString().split('T')[0];

  const cnt = db.prepare('SELECT COUNT(*) as n FROM financings').get().n;
  const number = `F-${String(cnt + 1).padStart(4, '0')}`;
  const id = genId(16);

  db.prepare(`
    INSERT INTO financings (
      id, number, client_id, debtor_id, agreement_id, tariff_plan_id,
      notice_number, avr_number, avr_date, installment_days,
      document_sum, discount, guarantee_retention, financing_sum, financing_sum_manual,
      planned_repayment, factoring_type, current_od, comment, manager, status
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, number, client_id, debtor_id, agreement_id || null, tariff_plan_id,
    notice_number || null, avr_number || null, avr_date, parseInt(installment_days),
    C.round2(document_sum), C.round2(discount), C.round2(guarantee_retention),
    fin_sum, financing_sum_manual ? 1 : 0,
    planned_repayment, factoring_type, fin_sum,
    comment || null, manager || req.user.name, 'draft'
  );

  res.status(201).json({ id, number, planned_repayment, financing_sum: fin_sum });
});

// POST /api/financings/:id/open
router.post('/:id/open', auth, (req, res) => {
  const { date_financing } = req.body;
  const f = db.prepare('SELECT * FROM financings WHERE id = ?').get(req.params.id);
  if (!f) return res.status(404).json({ error: 'Не найдено' });
  if (f.status !== 'draft') return res.status(400).json({ error: 'Финансирование уже открыто' });

  db.prepare(`
    UPDATE financings SET status='open', date_financing=?, current_od=financing_sum,
    updated_at=datetime('now') WHERE id=?
  `).run(date_financing, req.params.id);

  db.prepare(`
    INSERT INTO financing_operations (id,financing_id,operation_date,type,amount,od_after,source)
    VALUES (?,?,?,'issue',?,?,'factor')
  `).run(genId(), req.params.id, date_financing, f.financing_sum, f.financing_sum);

  res.json({ message: 'Финансирование открыто', status: 'open' });
});

// POST /api/financings/:id/payment
router.post('/:id/payment', auth, (req, res) => {
  const { amount, payment_date, source = 'debtor', note } = req.body;

  const f = db.prepare(`
    SELECT f.*, tp.k1_rate, tp.k2_rate_0_30, tp.k2_rate_30_60,
           tp.k2_rate_60_90, tp.k2_rate_90_120, tp.k2_rate_120plus, tp.series, tp.k3_rate_22_90
    FROM financings f
    JOIN tariff_plans tp ON f.tariff_plan_id = tp.id
    WHERE f.id = ?
  `).get(req.params.id);

  if (!f) return res.status(404).json({ error: 'Не найдено' });
  if (!f.date_financing) return res.status(400).json({ error: 'Финансирование не выдано' });
  if (f.current_od <= 0) return res.status(400).json({ error: 'ОД уже равен нулю' });

  const tp = {
    series: f.series, k1_rate: f.k1_rate,
    k2_rate_0_30: f.k2_rate_0_30, k2_rate_30_60: f.k2_rate_30_60,
    k2_rate_60_90: f.k2_rate_60_90, k2_rate_90_120: f.k2_rate_90_120,
    k2_rate_120plus: f.k2_rate_120plus,
  };
  const inclusive = getSetting('k2_boundary_inclusive') === 'true';

  const k1TotalDays = C.daysForK1(f.date_financing, payment_date);
  const periodDays = k1TotalDays - (f.last_calc_days || 0);
  const k1 = C.calculateK1(f.current_od, f.k1_rate, periodDays, payment_date);

  const k2Days = C.daysForK2(f.date_financing, payment_date);
  const shouldCalcK2 = f.factoring_type === 'with_notice' && f.series !== 'F1';
  const k2 = shouldCalcK2
    ? C.calculateK2Increment(f.document_sum, tp, k2Days, f.k2_accrued_net || 0, payment_date, inclusive)
    : { net: 0, vat: 0, gross: 0, totalNet: f.k2_accrued_net || 0 };

  const payResult = C.applyPaymentPriority(amount, k1.gross, k2.gross, f.current_od);
  const isClosed = payResult.odAfter === 0;

  const newK1Net = C.round2((f.k1_accrued_net || 0) + k1.net);
  const newK2Net = C.round2((f.k2_accrued_net || 0) + k2.net);
  const newStatus = isClosed ? 'closed' : f.status;
  const vop = isClosed ? C.calculateVOP({
    document_sum: f.document_sum,
    financing_sum: f.financing_sum,
    k1_accrued_net: newK1Net,
    k2_accrued_net: newK2Net,
  }) : null;

  db.prepare(`
    UPDATE financings SET
      current_od=?, k1_accrued_net=?, k2_accrued_net=?,
      last_calc_days=?, status=?, vop=?,
      closed_at=CASE WHEN ?='closed' THEN datetime('now') ELSE closed_at END,
      updated_at=datetime('now')
    WHERE id=?
  `).run(payResult.odAfter, newK1Net, newK2Net, k1TotalDays, newStatus, vop, newStatus, req.params.id);

  db.prepare(`
    INSERT INTO financing_operations
      (id,financing_id,operation_date,type,amount,k1_paid,k2_paid,od_paid,od_after,source,note)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    genId(), req.params.id, payment_date,
    isClosed ? 'full_repayment' : 'chd',
    amount, payResult.k1Paid, payResult.k2Paid, payResult.odReduction, payResult.odAfter,
    source, note || null
  );

  res.json({
    message: isClosed ? 'Финансирование закрыто' : 'Платёж применён',
    ...payResult, k1Calculated: k1, k2Calculated: k2, vop, isClosed,
    overpaymentWarning: payResult.overpayment > 0
      ? `Переплата ₸${Math.round(payResult.overpayment).toLocaleString('ru-RU')} — вернуть клиенту` : null,
    negativeVopWarning: vop !== null && vop < 0
      ? `Отрицательный ВОП: клиент должен ₸${Math.round(Math.abs(vop)).toLocaleString('ru-RU')}` : null,
  });
});

// GET /api/financings/:id/preview
router.get('/:id/preview', auth, (req, res) => {
  const calcDate = req.query.date || new Date().toISOString().split('T')[0];
  const f = db.prepare(`
    SELECT f.*, tp.* FROM financings f
    JOIN tariff_plans tp ON f.tariff_plan_id = tp.id
    WHERE f.id = ?
  `).get(req.params.id);
  if (!f) return res.status(404).json({ error: 'Не найдено' });
  if (!f.date_financing) return res.json({ error: 'Нет даты финансирования', ready: false });

  const inclusive = getSetting('k2_boundary_inclusive') === 'true';
  const result = C.previewCalculation(f, f, calcDate, inclusive);
  res.json({ ...result, ready: true });
});

// POST /api/financings/:id/correct
router.post('/:id/correct', auth, (req, res) => {
  const { new_document_sum, reason } = req.body;
  const f = db.prepare(`
    SELECT f.*, tp.* FROM financings f JOIN tariff_plans tp ON f.tariff_plan_id=tp.id WHERE f.id=?
  `).get(req.params.id);
  if (!f) return res.status(404).json({ error: 'Не найдено' });

  const today = new Date().toISOString().split('T')[0];
  const k2Days = C.daysForK2(f.date_financing || today, today);
  const inclusive = getSetting('k2_boundary_inclusive') === 'true';
  const newK2 = C.calculateK2Increment(new_document_sum, f, k2Days, 0, today, inclusive);

  db.prepare(`UPDATE financings SET document_sum=?, k2_accrued_net=?, updated_at=datetime('now') WHERE id=?`)
    .run(new_document_sum, newK2.totalNet, req.params.id);

  db.prepare(`INSERT INTO audit_log(id,user_email,action,entity_type,entity_id,details) VALUES (?,?,?,?,?,?)`)
    .run(genId(), req.user.email, 'financing.correct', 'financing', req.params.id,
      JSON.stringify({ old: f.document_sum, new: new_document_sum, reason }));

  res.json({ message: 'Корректировка применена', newK2Net: newK2.totalNet });
});

// PATCH /api/financings/:id
router.patch('/:id', auth, (req, res) => {
  const allowed = ['notice_number', 'avr_number', 'comment', 'manager'];
  const sets = [], vals = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) { sets.push(`${k}=?`); vals.push(req.body[k]); }
  }
  if (!sets.length) return res.status(400).json({ error: 'Нечего обновлять' });
  sets.push("updated_at=datetime('now')");
  vals.push(req.params.id);
  db.prepare(`UPDATE financings SET ${sets.join(',')} WHERE id=?`).run(...vals);
  res.json({ message: 'Обновлено' });
});

// DELETE /api/financings/:id (только draft)
router.delete('/:id', auth, (req, res) => {
  const f = db.prepare('SELECT status FROM financings WHERE id=?').get(req.params.id);
  if (!f) return res.status(404).json({ error: 'Не найдено' });
  if (f.status !== 'draft') return res.status(400).json({ error: 'Удалить можно только черновик' });
  db.prepare('DELETE FROM financings WHERE id=?').run(req.params.id);
  res.json({ message: 'Удалено' });
});

module.exports = router;
