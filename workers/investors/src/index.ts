/**
 * Investor contact API for asanoha.co.in/investors.
 *
 * 1. The page signs the investor in with an emailed code from the shared Asanoha account
 *    (Supabase), so the email address is confirmed before anything reaches us.
 * 2. POST /api/phone/start and /api/phone/verify confirm an Indian WhatsApp number with a
 *    six-digit code sent through the Noha Pay WhatsApp relay. Investors outside India skip this.
 * 3. POST /api/lead saves the details, emails the investor that we will reach out (Resend), and
 *    tells the founders by email and WhatsApp.
 *
 * Every route needs the Asanoha access token; it is checked with Supabase, never trusted.
 */
import {
  ApiError,
  allowedOrigin,
  confirmationEmail,
  hashCode,
  indiaDay,
  maskPhone,
  normalizePhone,
  parseLead,
  sha256,
  sixDigitCode,
  teamNote,
} from './logic.ts';

export interface Env {
  DB: D1Database;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  WA_RELAY_URL: string;
  WA_RELAY_TOKEN?: string;
  CODE_SALT?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM: string;
  TEAM_EMAIL: string;
  TEAM_WHATSAPP: string;
  ALLOWED_ORIGINS: string;
}

const CODE_TTL = 10 * 60_000;
const RESEND_AFTER = 60_000;
const MAX_SENDS_A_DAY = 5;
const MAX_ATTEMPTS = 5;

type User = { id: string; email: string };

const verified = new Map<string, { user: User; until: number }>();

async function signedIn(req: Request, env: Env): Promise<User> {
  const header = req.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new ApiError('Please confirm your email first.', 401);
  const key = await sha256(token);
  const hit = verified.get(key);
  if (hit && hit.until > Date.now()) return hit.user;
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_ANON_KEY, authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 401 || res.status === 403) throw new ApiError('Your email check has expired. Please ask for a new code.', 401);
  if (!res.ok) throw new ApiError('We could not check your email just now. Please try again.', 503);
  const u = (await res.json()) as { id?: string; email?: string | null; email_confirmed_at?: string | null };
  if (!u.id || !u.email || !u.email_confirmed_at) throw new ApiError('Please confirm your email first.', 401);
  const user = { id: u.id, email: u.email.trim().toLowerCase() };
  if (verified.size > 2000) verified.clear();
  verified.set(key, { user, until: Date.now() + 5 * 60_000 });
  return user;
}

async function sendWhatsApp(env: Env, to: string, text: string): Promise<void> {
  if (!env.WA_RELAY_TOKEN) throw new ApiError('WhatsApp codes are not switched on yet. Choose "I’m outside India" to continue with email only.', 503);
  const res = await fetch(env.WA_RELAY_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${env.WA_RELAY_TOKEN}` },
    body: JSON.stringify({ to: to.replace('+', ''), text }),
    signal: AbortSignal.timeout(15_000),
  });
  if (res.ok) return;
  if (res.status === 400) throw new ApiError('WhatsApp couldn’t take that number. Check it is a 10-digit Indian mobile with WhatsApp.');
  if (res.status === 429) throw new ApiError('Too many codes right now. Please wait 10 minutes and try again.', 429);
  console.error('whatsapp relay failed', res.status);
  throw new ApiError('WhatsApp codes are not going through right now. Please try again in a few minutes.', 503);
}

async function sendEmail(env: Env, to: string, subject: string, text: string, html?: string, replyTo?: string): Promise<{ id: string | null; error: string | null }> {
  if (!env.RESEND_API_KEY) return { id: null, error: 'email not configured' };
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, text, ...(html ? { html } : {}), ...(replyTo ? { reply_to: replyTo } : {}) }),
    signal: AbortSignal.timeout(15_000),
  });
  const j = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  return res.ok ? { id: j.id ?? null, error: null } : { id: null, error: String(j.message ?? `Resend ${res.status}`).slice(0, 300) };
}

async function startPhone(env: Env, user: User, body: Record<string, unknown>, now: number) {
  const phone = normalizePhone(body.phone);
  if (!phone) throw new ApiError('Enter a 10-digit Indian mobile number that has WhatsApp.');
  const done = await env.DB.prepare('SELECT phone FROM phones WHERE user_id = ?').bind(user.id).first<{ phone: string }>();
  if (done?.phone === phone) return { phone: maskPhone(phone), verified: true };
  const day = indiaDay(now);
  const prev = await env.DB.prepare('SELECT sent_at, sends_today, day FROM phone_codes WHERE user_id = ?').bind(user.id).first<{ sent_at: number; sends_today: number; day: string }>();
  if (prev && now - prev.sent_at < RESEND_AFTER) throw new ApiError('A code was just sent. Please wait a minute before asking for another.', 429);
  const sendsToday = prev && prev.day === day ? prev.sends_today + 1 : 1;
  if (sendsToday > MAX_SENDS_A_DAY) throw new ApiError('Too many codes today. Please try again tomorrow, or reply to our email.', 429);
  const others = await env.DB.prepare('SELECT COUNT(*) AS n FROM phone_codes WHERE phone = ? AND user_id != ? AND sent_at > ?').bind(phone, user.id, now - 3_600_000).first<{ n: number }>();
  if ((others?.n ?? 0) >= 2) throw new ApiError('Too many codes for this number. Please try again in an hour.', 429);
  const code = sixDigitCode();
  await sendWhatsApp(env, phone, `${code} is your Asanoha code. It expires in 10 minutes. Don't share it with anyone.`);
  await env.DB.prepare(
    `INSERT INTO phone_codes (user_id, phone, code_hash, expires_at, attempts, sent_at, sends_today, day) VALUES (?, ?, ?, ?, 0, ?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET phone = excluded.phone, code_hash = excluded.code_hash, expires_at = excluded.expires_at,
       attempts = 0, sent_at = excluded.sent_at, sends_today = excluded.sends_today, day = excluded.day`,
  )
    .bind(user.id, phone, await hashCode(phone, code, env.CODE_SALT ?? 'local-development'), now + CODE_TTL, now, sendsToday, day)
    .run();
  return { phone: maskPhone(phone), verified: false };
}

async function verifyPhone(env: Env, user: User, body: Record<string, unknown>, now: number) {
  const row = await env.DB.prepare('SELECT phone, code_hash, expires_at, attempts FROM phone_codes WHERE user_id = ?').bind(user.id).first<{ phone: string; code_hash: string; expires_at: number; attempts: number }>();
  if (!row || row.expires_at < now) throw new ApiError('That code has expired. Ask for a new one.');
  if (row.attempts >= MAX_ATTEMPTS) throw new ApiError('Too many wrong codes. Ask for a new one.', 429);
  const typed = typeof body.code === 'string' ? body.code.replace(/\D/g, '') : '';
  if (typed.length !== 6 || (await hashCode(row.phone, typed, env.CODE_SALT ?? 'local-development')) !== row.code_hash) {
    await env.DB.prepare('UPDATE phone_codes SET attempts = attempts + 1 WHERE user_id = ?').bind(user.id).run();
    throw new ApiError('That code isn’t right. Check the WhatsApp message and try again.');
  }
  await env.DB.batch([
    env.DB.prepare('INSERT INTO phones (user_id, phone, verified_at) VALUES (?, ?, ?) ON CONFLICT (user_id) DO UPDATE SET phone = excluded.phone, verified_at = excluded.verified_at').bind(user.id, row.phone, now),
    env.DB.prepare('DELETE FROM phone_codes WHERE user_id = ?').bind(user.id),
  ]);
  return { phone: maskPhone(row.phone), verified: true };
}

async function saveLead(env: Env, user: User, body: Record<string, unknown>, now: number, ctx: ExecutionContext) {
  const lead = parseLead(body);
  const ph = await env.DB.prepare('SELECT phone, verified_at FROM phones WHERE user_id = ?').bind(user.id).first<{ phone: string; verified_at: number }>();
  if (!ph && !lead.outsideIndia) throw new ApiError('Please confirm your WhatsApp number, or choose "I’m outside India".');
  const phone = ph?.phone ?? null;
  const existing = await env.DB.prepare('SELECT id FROM leads WHERE user_id = ?').bind(user.id).first<{ id: string }>();
  const id = existing?.id ?? crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO leads (id, user_id, email, name, firm, role, website, focus, message, phone, phone_verified_at, outside_india, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET email = excluded.email, name = excluded.name, firm = excluded.firm, role = excluded.role,
       website = excluded.website, focus = excluded.focus, message = excluded.message, phone = excluded.phone,
       phone_verified_at = excluded.phone_verified_at, outside_india = excluded.outside_india, updated_at = excluded.updated_at`,
  )
    .bind(id, user.id, user.email, lead.name, lead.firm, lead.role, lead.website, lead.focus, lead.message, phone, ph?.verified_at ?? null, lead.outsideIndia ? 1 : 0, now, now)
    .run();

  const mail = confirmationEmail(lead.name);
  const sent = existing ? { id: null, error: 'already confirmed' } : await sendEmail(env, user.email, mail.subject, mail.text, mail.html, env.TEAM_EMAIL);
  await env.DB.prepare('UPDATE leads SET confirm_email_id = coalesce(?, confirm_email_id), confirm_error = ? WHERE id = ?').bind(sent.id, sent.error, id).run();

  // Tell the founders without making the investor wait.
  const note = teamNote({ ...lead, email: user.email, phone });
  ctx.waitUntil(
    (async () => {
      await sendEmail(env, env.TEAM_EMAIL, `Investor: ${lead.name}, ${lead.firm}`, note, undefined, user.email).catch(() => null);
      for (const n of env.TEAM_WHATSAPP.split(',').map((s) => normalizePhone(s)).filter(Boolean) as string[]) {
        await sendWhatsApp(env, n, note).catch((e) => console.error('team whatsapp', String(e)));
      }
    })(),
  );
  return { ok: true, emailed: !!sent.id || !!existing, updated: !!existing };
}

function json(data: unknown, status: number, origin: string | null): Response {
  const headers: Record<string, string> = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
  if (origin) Object.assign(headers, { 'access-control-allow-origin': origin, vary: 'Origin' });
  return new Response(JSON.stringify(data), { status, headers });
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    const origin = allowedOrigin(req.headers.get('origin'), env.ALLOWED_ORIGINS);
    if (req.method === 'OPTIONS') {
      if (!origin) return new Response(null, { status: 403 });
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': origin,
          'access-control-allow-methods': 'POST, GET, OPTIONS',
          'access-control-allow-headers': 'authorization, content-type',
          'access-control-max-age': '86400',
          vary: 'Origin',
        },
      });
    }
    if (url.pathname === '/api/health') return json({ ok: true, whatsapp: !!env.WA_RELAY_TOKEN, email: !!env.RESEND_API_KEY }, 200, origin);
    if (req.method !== 'POST') return json({ error: 'Not found' }, 404, origin);
    if (!origin) return json({ error: 'Not allowed' }, 403, null);
    try {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      const user = await signedIn(req, env);
      const now = Date.now();
      if (url.pathname === '/api/phone/start') return json(await startPhone(env, user, body, now), 200, origin);
      if (url.pathname === '/api/phone/verify') return json(await verifyPhone(env, user, body, now), 200, origin);
      if (url.pathname === '/api/lead') return json(await saveLead(env, user, body, now, ctx), 200, origin);
      return json({ error: 'Not found' }, 404, origin);
    } catch (e) {
      if (e instanceof ApiError) return json({ error: e.message }, e.status, origin);
      console.error('investors api', e);
      return json({ error: 'Something went wrong on our side. Please try again.' }, 500, origin);
    }
  },
};
