import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allowedOrigin, confirmationMessage, normalizePhone, parseLead, teamNote } from '../src/logic.ts';

const base = { name: 'Riya Menon', firm: 'Acme Ventures', phone: '98934 53114', consent: true };

test('normalizePhone accepts Indian mobiles in common forms', () => {
  for (const v of ['9893453114', '+91 98934 53114', '09893453114', '919893453114', '0091-9893453114']) {
    assert.equal(normalizePhone(v), '+919893453114', v);
  }
});

test('normalizePhone rejects landlines, short and foreign numbers', () => {
  for (const v of ['0801234567', '12345', '+14155552671', '5893453114', '', null]) {
    assert.equal(normalizePhone(v), null, String(v));
  }
});

test('parseLead needs name, firm, a WhatsApp number and consent', () => {
  assert.throws(() => parseLead({ ...base, name: '' }), /name/);
  assert.throws(() => parseLead({ ...base, firm: '' }), /firm/);
  assert.throws(() => parseLead({ ...base, phone: '12345' }), /WhatsApp/);
  assert.throws(() => parseLead({ ...base, consent: false }), /agree/);
});

test('parseLead keeps email optional and unverified, but checks its shape', () => {
  assert.equal(parseLead(base).email, null);
  assert.equal(parseLead({ ...base, email: ' Riya@Acme.VC ' }).email, 'riya@acme.vc');
  assert.throws(() => parseLead({ ...base, email: 'not-an-email' }), /email/);
});

test('parseLead trims, caps and fixes the website', () => {
  const l = parseLead({ ...base, name: '  Riya Menon ', website: 'acme.vc', message: 'x'.repeat(3000) });
  assert.equal(l.name, 'Riya Menon');
  assert.equal(l.website, 'https://acme.vc/');
  assert.equal(l.message?.length, 2000);
  assert.equal(l.phone, '+919893453114');
  assert.throws(() => parseLead({ ...base, website: 'not a site' }), /website/);
});

test('allowedOrigin only allows listed origins', () => {
  const list = 'https://asanoha.co.in,http://localhost:4410';
  assert.equal(allowedOrigin('https://asanoha.co.in', list), 'https://asanoha.co.in');
  assert.equal(allowedOrigin('https://evil.example', list), null);
  assert.equal(allowedOrigin(null, list), null);
});

test('confirmation message says a founder will reach out', () => {
  assert.match(confirmationMessage('Riya Menon'), /^Hi Riya,/);
  assert.match(confirmationMessage('Riya Menon'), /will reach out to you/);
});

test('team note marks WhatsApp as verified and email as not verified', () => {
  const n = teamNote(parseLead({ ...base, email: 'r@acme.vc', role: 'Partner' }));
  assert.match(n, /WhatsApp \(verified\): \+919893453114/);
  assert.match(n, /Email \(not verified\): r@acme.vc/);
});
