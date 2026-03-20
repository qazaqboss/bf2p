'use strict';
const { Database: WasmDB } = require('node-sqlite3-wasm');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, 'factoring.db');
const _db = new WasmDB(dbPath);

// Совместимая обёртка под API better-sqlite3
const db = {
  prepare(sql) {
    return {
      run(...args)  { _db.run(sql, args.length ? args : undefined); return {}; },
      get(...args)  { return _db.get(sql, args.length ? args : undefined); },
      all(...args)  { return _db.all(sql, args.length ? args : undefined); },
    };
  },
  exec(sql) {
    const stmts = sql.split(';').map(s => s.trim()).filter(Boolean);
    for (const s of stmts) {
      try { _db.run(s); } catch (e) {
        if (!e.message?.includes('already exists') && !e.message?.includes('UNIQUE')) {}
      }
    }
  },
};

db.exec('PRAGMA journal_mode=WAL');
db.exec('PRAGMA foreign_keys=ON');

module.exports = db;
