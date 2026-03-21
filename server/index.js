'use strict';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const db = require('./db');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../client')));
app.use('/investor', express.static(path.join(__dirname, '../client/investor')));

function updateOverdueStatuses() {
  const today = new Date().toISOString().split('T')[0];
  try {
    db.prepare(`
      UPDATE financings SET
        days_overdue = MAX(0, CAST(julianday(?) - julianday(planned_repayment) AS INTEGER)),
        status = CASE
          WHEN current_od <= 0 THEN 'closed'
          WHEN date_financing IS NULL THEN 'draft'
          WHEN CAST(julianday(?) - julianday(planned_repayment) AS INTEGER) > 60 THEN 'default'
          WHEN julianday(?) > julianday(planned_repayment) THEN 'overdue'
          ELSE 'open'
        END,
        updated_at = datetime('now')
      WHERE status NOT IN ('closed','draft')
    `).run(today, today, today);
  } catch (e) { console.error('Ошибка обновления статусов:', e.message); }
}

updateOverdueStatuses();
setInterval(updateOverdueStatuses, 300000);

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/financings',   require('./routes/financings'));
app.use('/api/payments',     require('./routes/payments'));
app.use('/api/clients',      require('./routes/clients'));
app.use('/api/debtors',      require('./routes/debtors'));
app.use('/api/tariff-plans', require('./routes/tariffs'));
app.use('/api/analytics',    require('./routes/analytics'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Внутренняя ошибка сервера' });
});

app.get('/investor', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/investor/index.html'));
});
app.get('/investor/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/investor/index.html'));
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Swiss Factoring Platform запущен`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   Логин: admin@swiss.kz | Пароль: password\n`);
});
