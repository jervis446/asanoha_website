/**
 * Investor contact API for asanoha.co.in/investors.
 *
 * The only check is WhatsApp: there is no sign-in, and the email address is optional and not
 * verified.
 *
 * 1. POST /api/start  {name, firm, role, website, email, message, phone, consent}
 *    checks the details, sends a six-digit code to the WhatsApp number through the Noha Pay relay
 *    and keeps the details in a pending check. Returns {id, phone (masked)}.
 * 2. POST /api/resend {id}       sends the code again (once a minute).
 * 3. POST /api/verify {id, code} confirms the number, saves the lead, sends the investor a
 *    WhatsApp message that we will reach out, and tells the founders.
 *
 * Abuse limits: a minute between codes and 5 a day per number, 10 checks an hour per IP address,
 * 5 tries per code. Codes are stored only as salted hashes.
 */
import {
  ApiError,
  allowedOrigin,
  confirmationMessage,
  hashCode,
  maskPhone,
  normalizePhone,
  parseLead,
  sha256,
  sixDigitCode,
  teamNote,
  type LeadInput,
} from './logic.ts';

export interface Env {
  DB: D1Database;
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
const SENDS_PER_NUMBER_A_DAY = 5;
const CHECKS_PER_IP_AN_HOUR = 10;
const MAX_ATTEMPTS = 5;
const DAY = 24 * 3_600_000;

const salt = (env: Env) => env.CODE_SALT ?? 'local-development';

async function sendWhatsApp(env: Env, to: string, text: string): Promise<void> {
  if (!env.WA_RELAY_TOKEN) throw new ApiError('WhatsApp codes are not switched on yet. Please write to orders@asanoha.co.in for now.', 503);
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

async function sendEmail(env: Env, to: string, subject: string, text: string): Promise<void> {
  if (!env.RESEND_API_KEY) return;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, text }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) console.error('resend failed', res.status);
}

const codeText = (code: string) => `${code} is your Asanoha code. It expires in 10 minutes. Don't share it with anyone.`;

/** Enforces the per-number limits before a code goes out. */
async function numberLimits(env: Env, phone: string, now: number) {
  const r = await env.DB.prepare('SELECT MAX(sent_at) AS last, COALESCE(SUM(sends), 0) AS n FROM checks WHERE phone = ? AND created_at > ?')
    .bind(phone, now - DAY)
    .first<{ last: number | null; n: number }>();
  if (r?.last && now - r.last < RESEND_AFTER) throw new ApiError('A code was just sent. Please wait a minute before asking for another.', 429);
  if ((r?.n ?? 0) >= SENDS_PER_NUMBER_A_DAY) throw new ApiError('Too many codes for this number today. Please try again tomorrow.', 429);
}

async function start(env: Env, req: Request, body: Record<string, unknown>, now: number) {
  const lead = parseLead(body);
  const ipHash = await sha256(`${salt(env)}:ip:${req.headers.get('cf-connecting-ip') ?? 'unknown'}`);
  const ip = await env.DB.prepare('SELECT COUNT(*) AS n FROM checks WHERE ip_hash = ? AND created_at > ?').bind(ipHash, now - 3_600_000).first<{ n: number }>();
  if ((ip?.n ?? 0) >= CHECKS_PER_IP_AN_HOUR) throw new ApiError('Too many tries from this connection. Please try again in an hour.', 429);
  await numberLimits(env, lead.phone, now);

  const id = crypto.randomUUID();
  const code = sixDigitCode();
  await sendWhatsApp(env, lead.phone, codeText(code));
  await env.DB.prepare(
    'INSERT INTO checks (id, phone, code_hash, expires_at, attempts, sends, sent_at, lead_json, ip_hash, created_at) VALUES (?, ?, ?, ?, 0, 1, ?, ?, ?, ?)',
  )
    .bind(id, lead.phone, await hashCode(id, code, salt(env)), now + CODE_TTL, now, JSON.stringify(lead), ipHash, now)
    .run();
  return { id, phone: maskPhone(lead.phone) };
}

type Check = { id: string; phone: string; code_hash: string; expires_at: number; attempts: number; sends: number; sent_at: number; lead_json: string };

async function getCheck(env: Env, body: Record<string, unknown>): Promise<Check> {
  const id = typeof body.id === 'string' ? body.id : '';
  const row = id ? await env.DB.prepare('SELECT * FROM checks WHERE id = ?').bind(id).first<Check>() : null;
  if (!row) throw new ApiError('Please start again and ask for a new code.', 404);
  return row;
}

async function resend(env: Env, body: Record<string, unknown>, now: number) {
  const row = await getCheck(env, body);
  await numberLimits(env, row.phone, now);
  const code = sixDigitCode();
  await sendWhatsApp(env, row.phone, codeText(code));
  await env.DB.prepare('UPDATE checks SET code_hash = ?, expires_at = ?, attempts = 0, sends = sends + 1, sent_at = ? WHERE id = ?')
    .bind(await hashCode(row.id, code, salt(env)), now + CODE_TTL, now, row.id)
    .run();
  return { phone: maskPhone(row.phone) };
}

async function verify(env: Env, body: Record<string, unknown>, now: number, ctx: ExecutionContext) {
  const row = await getCheck(env, body);
  if (row.expires_at < now) throw new ApiError('That code has expired. Ask for a new one.');
  if (row.attempts >= MAX_ATTEMPTS) throw new ApiError('Too many wrong codes. Ask for a new one.', 429);
  const typed = typeof body.code === 'string' ? body.code.replace(/\D/g, '') : '';
  if (typed.length !== 6 || (await hashCode(row.id, typed, salt(env))) !== row.code_hash) {
    await env.DB.prepare('UPDATE checks SET attempts = attempts + 1 WHERE id = ?').bind(row.id).run();
    throw new ApiError('That code isn’t right. Check the WhatsApp message and try again.');
  }

  const lead = JSON.parse(row.lead_json) as LeadInput;
  const existing = await env.DB.prepare('SELECT id FROM leads WHERE phone = ?').bind(lead.phone).first<{ id: string }>();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO leads (id, phone, email, name, firm, role, website, message, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (phone) DO UPDATE SET email = excluded.email, name = excluded.name, firm = excluded.firm, role = excluded.role,
         website = excluded.website, message = excluded.message, updated_at = excluded.updated_at`,
    ).bind(existing?.id ?? crypto.randomUUID(), lead.phone, lead.email, lead.name, lead.firm, lead.role, lead.website, lead.message, now, now),
    env.DB.prepare('DELETE FROM checks WHERE id = ?').bind(row.id),
  ]);

  // Thank the investor and tell the founders without making the page wait.
  ctx.waitUntil(
    (async () => {
      if (!existing) {
        let error: string | null = null;
        await sendWhatsApp(env, lead.phone, confirmationMessage(lead.name)).catch((e) => (error = String(e?.message ?? e).slice(0, 300)));
        await env.DB.prepare('UPDATE leads SET confirm_sent = ?, confirm_error = ? WHERE phone = ?').bind(error ? 0 : 1, error, lead.phone).run();
      }
      const note = teamNote(lead);
      await sendEmail(env, env.TEAM_EMAIL, `Investor: ${lead.name}, ${lead.firm}`, note).catch(() => null);
      for (const n of env.TEAM_WHATSAPP.split(',').map((s) => normalizePhone(s)).filter(Boolean) as string[]) {
        await sendWhatsApp(env, n, note).catch((e) => console.error('team whatsapp', String(e)));
      }
    })(),
  );
  return { ok: true, updated: !!existing };
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
          'access-control-allow-headers': 'content-type',
          'access-control-max-age': '86400',
          vary: 'Origin',
        },
      });
    }
    if (url.pathname === '/api/health') return json({ ok: true, whatsapp: !!env.WA_RELAY_TOKEN, teamEmail: !!env.RESEND_API_KEY }, 200, origin);
    if (req.method !== 'POST') return json({ error: 'Not found' }, 404, origin);
    if (!origin) return json({ error: 'Not allowed' }, 403, null);
    try {
      const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
      const now = Date.now();
      if (url.pathname === '/api/start') return json(await start(env, req, body, now), 200, origin);
      if (url.pathname === '/api/resend') return json(await resend(env, body, now), 200, origin);
      if (url.pathname === '/api/verify') return json(await verify(env, body, now, ctx), 200, origin);
      return json({ error: 'Not found' }, 404, origin);
    } catch (e) {
      if (e instanceof ApiError) return json({ error: e.message }, e.status, origin);
      console.error('investors api', e);
      return json({ error: 'Something went wrong on our side. Please try again.' }, 500, origin);
    }
  },
};
