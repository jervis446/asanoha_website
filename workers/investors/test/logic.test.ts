import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allowedOrigin, confirmationEmail, normalizePhone, parseLead, teamNote } from '../src/logic.ts';

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

test('parseLead needs name, firm and consent', () => {
  assert.throws(() => parseLead({ firm: 'X', consent: true }), /name/);
  assert.throws(() => parseLead({ name: 'A', consent: true }), /firm/);
  assert.throws(() => parseLead({ name: 'A', firm: 'X' }), /agree/);
});

test('parseLead trims, caps and fixes the website', () => {
  const l = parseLead({ name: '  Riya Menon ', firm: 'Acme Ventures', website: 'acme.vc', message: 'x'.repeat(3000), consent: true, outsideIndia: true });
  assert.equal(l.name, 'Riya Menon');
  assert.equal(l.website, 'https://acme.vc/');
  assert.equal(l.message?.length, 2000);
  assert.equal(l.outsideIndia, true);
  assert.throws(() => parseLead({ name: 'A', firm: 'B', website: 'not a site', consent: true }), /website/);
});

test('allowedOrigin only allows listed origins', () => {
  const list = 'https://asanoha.co.in,http://localhost:4410';
  assert.equal(allowedOrigin('https://asanoha.co.in', list), 'https://asanoha.co.in');
  assert.equal(allowedOrigin('https://evil.example', list), null);
  assert.equal(allowedOrigin(null, list), null);
});

test('confirmation email says we will reach out and escapes the name', () => {
  const m = confirmationEmail('<b>Riya</b> Menon');
  assert.match(m.text, /will reach out to you/);
  assert.ok(!m.html.includes('<b>Riya'));
});

test('team note marks verified contact details', () => {
  const n = teamNote({ name: 'Riya', firm: 'Acme', role: 'Partner', website: null, focus: null, message: null, outsideIndia: false, email: 'r@acme.vc', phone: '+919893453114' });
  assert.match(n, /Email \(verified\): r@acme.vc/);
  assert.match(n, /\+919893453114 \(verified\)/);
});
