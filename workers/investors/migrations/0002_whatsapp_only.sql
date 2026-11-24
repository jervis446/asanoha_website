-- WhatsApp is now the only check: no Asanoha sign-in, email is optional and not verified.
-- The old tables were empty when this ran (checked on 24 Nov 2026).
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS phone_codes;
DROP TABLE IF EXISTS phones;

-- One pending WhatsApp check per "Send code", holding the details until the code is confirmed.
CREATE TABLE checks (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sends INTEGER NOT NULL DEFAULT 1,
  sent_at INTEGER NOT NULL,
  lead_json TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX checks_phone ON checks (phone, sent_at);
CREATE INDEX checks_ip ON checks (ip_hash, created_at);

-- Investors who confirmed their WhatsApp number. One row per number; a second visit updates it.
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  name TEXT NOT NULL,
  firm TEXT NOT NULL,
  role TEXT,
  website TEXT,
  message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  confirm_sent INTEGER NOT NULL DEFAULT 0,
  confirm_error TEXT
);
