'use strict';
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// На Vercel файловая система read-only, кроме /tmp
const isVercel = !!process.env.VERCEL;
const dbPath = isVercel
  ? '/tmp/factoring.db'
  : process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(__dirname, '../data/factoring.db');

if (!isVercel) {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// На Vercel автоматически инициализируем БД при каждом холодном старте
if (isVercel) {
  const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
  const seed   = fs.readFileSync(path.join(__dirname, 'db/seed.sql'),   'utf8');
  const run = (sql) => {
    sql.split(';').map(s => s.trim()).filter(Boolean).forEach(stmt => {
      try { db.prepare(stmt).run(); } catch (e) {
        if (!e.message.includes('already exists') && !e.message.includes('UNIQUE')) {}
      }
    });
  };
  run(schema);
  run(seed);
}

module.exports = db;
