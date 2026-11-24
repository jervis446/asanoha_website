-- Investors who asked the founders to get in touch. Email is confirmed by the Asanoha sign-in,
-- the phone by a WhatsApp code (Indian numbers only; investors outside India confirm email only).
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  firm TEXT NOT NULL,
  role TEXT,
  website TEXT,
  focus TEXT,
  message TEXT,
  phone TEXT,
  phone_verified_at INTEGER,
  outside_india INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  confirm_email_id TEXT,
  confirm_error TEXT
);

CREATE TABLE phone_codes (
  user_id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at INTEGER NOT NULL,
  sends_today INTEGER NOT NULL,
  day TEXT NOT NULL
);
CREATE INDEX phone_codes_phone ON phone_codes (phone, sent_at);

CREATE TABLE phones (
  user_id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  verified_at INTEGER NOT NULL
);
