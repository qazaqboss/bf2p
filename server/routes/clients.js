'use strict';
const router = require('express').Router();
const db = require('../db');
const { auth } = require('./auth');
const crypto = require('crypto');
const genId = (n = 8) => crypto.randomBytes(n).toString('hex');

router.get('/', auth, (req, res) => {
  const { search, status } = req.query;
  let sql = 'SELECT * FROM clients WHERE 1=1';
  const p = [];
  if (search) { sql += ' AND (name LIKE ? OR bin LIKE ?)'; const s = `%${search}%`; p.push(s, s); }
  if (status) { sql += ' AND status = ?'; p.push(status); }
  sql += ' ORDER BY name ASC';
  res.json(db.prepare(sql).all(...p));
});

router.get('/:id', auth, (req, res) => {
  const row = db.prepare('SELECT * FROM clients WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Не найдено' });

  const financings = db.prepare(`
    SELECT f.number, f.status, f.current_od, f.avr_date, f.planned_repayment,
           d.name as debtor_name, tp.name as tariff_name
    FROM financings f
    LEFT JOIN debtors d ON f.debtor_id=d.id
    LEFT JOIN tariff_plans tp ON f.tariff_plan_id=tp.id
    WHERE f.client_id=? ORDER BY f.created_at DESC LIMIT 20
  `).all(req.params.id);

  res.json({ ...row, financings });
});

router.post('/', auth, (req, res) => {
  const id = genId();
  const { name, bin, legal_form = 'ТОО', status = 'active', manager, phone, email, address } = req.body;
  if (!name || !bin) return res.status(400).json({ error: 'name и bin обязательны' });
  db.prepare(`INSERT INTO clients(id,name,bin,legal_form,status,manager,phone,email,address) VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(id, name, bin, legal_form, status, manager || null, phone || null, email || null, address || null);
  res.status(201).json({ id });
});

router.patch('/:id', auth, (req, res) => {
  const allowed = ['name', 'bin', 'legal_form', 'status', 'manager', 'phone', 'email', 'address'];
  const sets = [], vals = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) { sets.push(`${k}=?`); vals.push(req.body[k]); }
  }
  if (!sets.length) return res.status(400).json({ error: 'Нечего обновлять' });
  vals.push(req.params.id);
  db.prepare(`UPDATE clients SET ${sets.join(',')} WHERE id=?`).run(...vals);
  res.json({ message: 'Обновлено' });
});

module.exports = router;
