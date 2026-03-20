'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const db = require('../db');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
const seed   = fs.readFileSync(path.join(__dirname, 'seed.sql'),   'utf8');

function runScript(sql, label) {
  const stmts = sql.split(';').map(s => s.trim()).filter(Boolean);
  for (const stmt of stmts) {
    try { db.exec(stmt); } catch (e) {
      if (!e.message.includes('already exists') && !e.message.includes('UNIQUE')) {
        console.error(`[${label}] Error in: ${stmt.slice(0,80)}`);
        console.error(e.message);
      }
    }
  }
}

runScript(schema, 'schema');
runScript(seed,   'seed');

console.log('✅ База данных инициализирована: data/factoring.db');
console.log('   Логин: admin@swiss.kz | Пароль: password');
