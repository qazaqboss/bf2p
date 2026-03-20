'use strict';
const router = require('express').Router();
const db = require('../db');
const { auth } = require('./auth');
const crypto = require('crypto');
const genId = (n = 8) => crypto.randomBytes(n).toString('hex');

router.get('/', auth, (req, res) => {
  const { series } = req.query;
  let sql = 'SELECT * FROM tariff_plans WHERE is_active=1';
  const p = [];
  if (series) { sql += ' AND series=?'; p.push(series); }
  sql += ' ORDER BY series ASC, name ASC';
  res.json(db.prepare(sql).all(...p));
});

router.get('/:id', auth, (req, res) => {
  const row = db.prepare('SELECT * FROM tariff_plans WHERE id=?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Не найдено' });
  res.json(row);
});

router.post('/', auth, (req, res) => {
  const id = genId();
  const {
    name, series, k1_rate,
    k2_rate_0_30, k2_rate_30_60, k2_rate_60_90, k2_rate_90_120, k2_rate_120plus,
    k3_rate_0_21, k3_rate_22_90, k3_rate_90plus
  } = req.body;
  if (!name || !series || !k1_rate) return res.status(400).json({ error: 'name, series, k1_rate обязательны' });
  db.prepare(`
    INSERT INTO tariff_plans(id,name,series,k1_rate,k2_rate_0_30,k2_rate_30_60,k2_rate_60_90,k2_rate_90_120,k2_rate_120plus,k3_rate_0_21,k3_rate_22_90,k3_rate_90plus)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(id, name, series, k1_rate,
    k2_rate_0_30 || null, k2_rate_30_60 || null, k2_rate_60_90 || null,
    k2_rate_90_120 || null, k2_rate_120plus || null,
    k3_rate_0_21 || 0, k3_rate_22_90 || 0, k3_rate_90plus || 0);
  res.status(201).json({ id });
});

router.patch('/:id', auth, (req, res) => {
  const allowed = ['name', 'series', 'k1_rate', 'k2_rate_0_30', 'k2_rate_30_60',
    'k2_rate_60_90', 'k2_rate_90_120', 'k2_rate_120plus', 'k3_rate_22_90', 'is_active'];
  const sets = [], vals = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) { sets.push(`${k}=?`); vals.push(req.body[k]); }
  }
  if (!sets.length) return res.status(400).json({ error: 'Нечего обновлять' });
  vals.push(req.params.id);
  db.prepare(`UPDATE tariff_plans SET ${sets.join(',')} WHERE id=?`).run(...vals);
  res.json({ message: 'Обновлено' });
});

module.exports = router;
