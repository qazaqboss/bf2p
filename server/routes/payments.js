'use strict';
const router = require('express').Router();
const db = require('../db');
const { auth } = require('./auth');
const crypto = require('crypto');
const genId = (n = 8) => crypto.randomBytes(n).toString('hex');

router.get('/', auth, (req, res) => {
  const { direction, status, financing_id, page = 1, limit = 50 } = req.query;
  let sql = `SELECT p.*, f.number as fin_number FROM payments p
             LEFT JOIN financings f ON p.financing_id=f.id WHERE 1=1`;
  const params = [];
  if (direction) { sql += ' AND p.direction=?'; params.push(direction); }
  if (status)    { sql += ' AND p.status=?';    params.push(status); }
  if (financing_id) { sql += ' AND p.financing_id=?'; params.push(financing_id); }
  sql += ' ORDER BY p.payment_date DESC, p.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  const rows = db.prepare(sql).all(...params);
  res.json({ data: rows, total: rows.length });
});

router.post('/', auth, (req, res) => {
  const {
    direction, payment_type, payment_date, amount,
    counterparty_name, counterparty_bin, purpose, financing_id, status = 'draft'
  } = req.body;
  if (!direction || !payment_date || !amount) {
    return res.status(400).json({ error: 'direction, payment_date, amount обязательны' });
  }
  const id = genId();
  db.prepare(`
    INSERT INTO payments(id,direction,payment_type,payment_date,amount,counterparty_name,counterparty_bin,purpose,financing_id,status)
    VALUES (?,?,?,?,?,?,?,?,?,?)
  `).run(id, direction, payment_type || null, payment_date, amount,
    counterparty_name || null, counterparty_bin || null, purpose || null,
    financing_id || null, status);
  res.status(201).json({ id });
});

router.patch('/:id/execute', auth, (req, res) => {
  db.prepare("UPDATE payments SET status='executed' WHERE id=?").run(req.params.id);
  res.json({ message: 'Исполнено' });
});

router.patch('/:id', auth, (req, res) => {
  const allowed = ['payment_type', 'payment_date', 'amount', 'counterparty_name',
    'counterparty_bin', 'purpose', 'status', 'financing_id'];
  const sets = [], vals = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) { sets.push(`${k}=?`); vals.push(req.body[k]); }
  }
  if (!sets.length) return res.status(400).json({ error: 'Нечего обновлять' });
  vals.push(req.params.id);
  db.prepare(`UPDATE payments SET ${sets.join(',')} WHERE id=?`).run(...vals);
  res.json({ message: 'Обновлено' });
});

module.exports = router;
