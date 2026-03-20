PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
INSERT OR IGNORE INTO settings VALUES
  ('vat_rate','0.16'),
  ('k2_boundary_inclusive','false'),
  ('notify_days_before','7'),
  ('default_days_threshold','60'),
  ('company_name','Swiss Factoring'),
  ('vop_no_days_threshold','30');

CREATE TABLE IF NOT EXISTS tariff_plans (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4)))),
  name           TEXT UNIQUE NOT NULL,
  series         TEXT NOT NULL CHECK(series IN ('F1','F2','F3','F4','F5','F6')),
  k1_rate        REAL NOT NULL,
  k2_rate_0_30   REAL,
  k2_rate_30_60  REAL,
  k2_rate_60_90  REAL,
  k2_rate_90_120 REAL,
  k2_rate_120plus REAL,
  k3_rate_0_21   REAL DEFAULT 0,
  k3_rate_22_90  REAL DEFAULT 0,
  k3_rate_90plus REAL DEFAULT 0,
  is_active      INTEGER DEFAULT 1,
  created_at     TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  email      TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  password   TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'manager'
             CHECK(role IN ('admin','manager','accountant','client','investor','auditor')),
  is_active  INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS clients (
  id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  name       TEXT NOT NULL,
  bin        TEXT UNIQUE NOT NULL,
  legal_form TEXT DEFAULT 'ТОО',
  status     TEXT DEFAULT 'active' CHECK(status IN ('active','on_review','frozen','closed')),
  manager    TEXT,
  phone      TEXT,
  email      TEXT,
  address    TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS debtors (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  name                TEXT NOT NULL,
  bin                 TEXT UNIQUE NOT NULL,
  rating              TEXT DEFAULT 'B' CHECK(rating IN ('A','B','C','D')),
  credit_limit        REAL DEFAULT 0,
  current_debt        REAL DEFAULT 0,
  notification_signed INTEGER DEFAULT 0,
  industry            TEXT,
  created_at          TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS agreements (
  id               TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  client_id        TEXT NOT NULL REFERENCES clients(id),
  number           TEXT NOT NULL,
  date_signed      TEXT NOT NULL,
  date_expires     TEXT,
  credit_limit     REAL DEFAULT 0,
  tariff_plan_id   TEXT REFERENCES tariff_plans(id),
  default_discount REAL DEFAULT 0.85,
  factoring_type   TEXT DEFAULT 'with_notice',
  has_recourse     INTEGER DEFAULT 0,
  status           TEXT DEFAULT 'active' CHECK(status IN ('active','expired','terminated')),
  created_at       TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS financings (
  id                   TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  number               TEXT UNIQUE NOT NULL,
  client_id            TEXT NOT NULL REFERENCES clients(id),
  debtor_id            TEXT NOT NULL REFERENCES debtors(id),
  agreement_id         TEXT REFERENCES agreements(id),
  tariff_plan_id       TEXT NOT NULL REFERENCES tariff_plans(id),
  notice_number        TEXT,
  avr_number           TEXT,
  avr_date             TEXT NOT NULL,
  installment_days     INTEGER NOT NULL CHECK(installment_days > 0),
  document_sum         REAL NOT NULL CHECK(document_sum > 0),
  discount             REAL NOT NULL CHECK(discount > 0 AND discount <= 1),
  guarantee_retention  REAL DEFAULT 0,
  financing_sum        REAL NOT NULL,
  financing_sum_manual INTEGER DEFAULT 0,
  date_financing       TEXT,
  planned_repayment    TEXT,
  factoring_type       TEXT DEFAULT 'with_notice' CHECK(factoring_type IN ('with_notice','without_notice')),
  current_od           REAL DEFAULT 0,
  k1_accrued_net       REAL DEFAULT 0,
  k2_accrued_net       REAL DEFAULT 0,
  k3_accrued_net       REAL DEFAULT 0,
  last_calc_days       INTEGER DEFAULT 0,
  vop                  REAL,
  status               TEXT DEFAULT 'draft'
                       CHECK(status IN ('draft','open','overdue','default','closed')),
  days_overdue         INTEGER DEFAULT 0,
  comment              TEXT,
  manager              TEXT,
  created_at           TEXT DEFAULT (datetime('now')),
  updated_at           TEXT DEFAULT (datetime('now')),
  closed_at            TEXT
);

CREATE TABLE IF NOT EXISTS financing_operations (
  id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  financing_id   TEXT NOT NULL REFERENCES financings(id),
  operation_date TEXT NOT NULL,
  type           TEXT NOT NULL CHECK(type IN (
    'issue','additional_issue','chd','full_repayment','vop_transfer','correction'
  )),
  amount         REAL NOT NULL,
  k1_paid        REAL DEFAULT 0,
  k2_paid        REAL DEFAULT 0,
  k3_paid        REAL DEFAULT 0,
  od_paid        REAL DEFAULT 0,
  od_after       REAL,
  source         TEXT DEFAULT 'debtor' CHECK(source IN ('debtor','client','third_party','factor')),
  note           TEXT,
  created_at     TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS commission_periods (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  financing_id    TEXT NOT NULL REFERENCES financings(id),
  period_date     TEXT NOT NULL,
  period_label    TEXT,
  days            INTEGER NOT NULL,
  od_amount       REAL DEFAULT 0,
  k1_net          REAL DEFAULT 0,
  k1_vat          REAL DEFAULT 0,
  k1_gross        REAL DEFAULT 0,
  k2_net          REAL DEFAULT 0,
  k2_vat          REAL DEFAULT 0,
  k2_gross        REAL DEFAULT 0,
  k3_net          REAL DEFAULT 0,
  k3_gross        REAL DEFAULT 0,
  vat_rate        REAL DEFAULT 0.16,
  total_gross     REAL DEFAULT 0,
  cumulative_days INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id                 TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  direction          TEXT NOT NULL CHECK(direction IN ('outgoing','incoming')),
  payment_type       TEXT,
  payment_date       TEXT NOT NULL,
  amount             REAL NOT NULL,
  amount_distributed REAL DEFAULT 0,
  counterparty_name  TEXT,
  counterparty_bin   TEXT,
  purpose            TEXT,
  status             TEXT DEFAULT 'draft' CHECK(status IN ('draft','sent','executed','rejected')),
  financing_id       TEXT REFERENCES financings(id),
  created_at         TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payment_distributions (
  id           TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  payment_id   TEXT NOT NULL REFERENCES payments(id),
  financing_id TEXT NOT NULL REFERENCES financings(id),
  notice_number TEXT,
  amount       REAL NOT NULL,
  k1_covered   REAL DEFAULT 0,
  k2_covered   REAL DEFAULT 0,
  od_covered   REAL DEFAULT 0,
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(8)))),
  user_email  TEXT,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  details     TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_fin_status    ON financings(status);
CREATE INDEX IF NOT EXISTS idx_fin_client    ON financings(client_id);
CREATE INDEX IF NOT EXISTS idx_fin_debtor    ON financings(debtor_id);
CREATE INDEX IF NOT EXISTS idx_fin_planned   ON financings(planned_repayment, status);
CREATE INDEX IF NOT EXISTS idx_ops_fin       ON financing_operations(financing_id, operation_date);
CREATE INDEX IF NOT EXISTS idx_periods_fin   ON commission_periods(financing_id, period_date);
CREATE INDEX IF NOT EXISTS idx_periods_month ON commission_periods(period_date);
