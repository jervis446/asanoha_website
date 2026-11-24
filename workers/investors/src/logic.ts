/**
 * Pure helpers for the investor contact API, kept free of Worker bindings so they can be tested
 * with `node --test` directly.
 */

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** An Indian mobile number in E.164 (+91 and ten digits starting 6 to 9), or null. */
export function normalizePhone(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  let d = input.replace(/[\s\-().]/g, '');
  if (d.startsWith('+91')) d = d.slice(3);
  else if (d.startsWith('0091')) d = d.slice(4);
  else if (d.startsWith('91') && d.length === 12) d = d.slice(2);
  else if (d.startsWith('0') && d.length === 11) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
}

/** "+91 98••••3114" */
export const maskPhone = (p: string) => `${p.slice(0, 3)} ${p.slice(3, 5)}••••${p.slice(-4)}`;

/** The calendar day in India, used for the daily code limit. */
export const indiaDay = (now: number) => new Date(now + 330 * 60_000).toISOString().slice(0, 10);

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

export const hashCode = (phone: string, code: string, salt: string) => sha256(`${salt}:${phone}:${code}`);

export function sixDigitCode(): string {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return String(buf[0] % 1_000_000).padStart(6, '0');
}

export type LeadInput = {
  name: string;
  firm: string;
  role: string | null;
  website: string | null;
  focus: string | null;
  message: string | null;
  outsideIndia: boolean;
};

const clean = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const s = v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  return s ? s.slice(0, max) : null;
};

/** Checks and trims what the investor typed. Throws ApiError with a plain message. */
export function parseLead(body: unknown): LeadInput {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const name = clean(b.name, 120);
  const firm = clean(b.firm, 160);
  if (!name) throw new ApiError('Please add your name.');
  if (!firm) throw new ApiError('Please add your fund or firm. Angels can write "Angel".');
  let website = clean(b.website, 200);
  if (website) {
    if (!/^https?:\/\//i.test(website)) website = `https://${website}`;
    try {
      const u = new URL(website);
      if (!/\./.test(u.hostname)) throw new Error('no dot');
      website = u.toString();
    } catch {
      throw new ApiError('That website link doesn’t look right.');
    }
  }
  if (b.consent !== true) throw new ApiError('Please agree to be contacted about Asanoha.');
  return {
    name,
    firm,
    role: clean(b.role, 120),
    website,
    focus: clean(b.focus, 200),
    message: clean(b.message, 2000),
    outsideIndia: b.outsideIndia === true,
  };
}

/** Origin allowed to call the API, or null. */
export function allowedOrigin(origin: string | null, list: string): string | null {
  if (!origin) return null;
  return list.split(',').map((s) => s.trim()).filter(Boolean).includes(origin) ? origin : null;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** The email the investor gets after their details are saved. */
export function confirmationEmail(name: string): { subject: string; text: string; html: string } {
  const first = name.split(/\s+/)[0];
  const text = [
    `Hi ${first},`,
    '',
    'Thank you for your interest in Asanoha. We have your details, and one of the founders will reach out to you.',
    '',
    'If you want to send anything before then, just reply to this email.',
    '',
    'Adarsh, Joseph and Soumyadev',
    'Asanoha LLP, Bengaluru',
    'asanoha.co.in/investors',
  ].join('\n');
  const html =
    `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.6;color:#1f1b16;max-width:520px">` +
    `<p>Hi ${esc(first)},</p>` +
    `<p>Thank you for your interest in Asanoha. We have your details, and one of the founders will reach out to you.</p>` +
    `<p>If you want to send anything before then, just reply to this email.</p>` +
    `<p style="margin-top:24px">Adarsh, Joseph and Soumyadev<br><span style="color:#7b7266">Asanoha LLP, Bengaluru · <a href="https://asanoha.co.in/investors/" style="color:#a84b27">asanoha.co.in/investors</a></span></p>` +
    `</div>`;
  return { subject: 'We’ll be in touch: Asanoha', text, html };
}

/** The note the founders get about a new investor. */
export function teamNote(l: LeadInput & { email: string; phone: string | null }): string {
  return [
    `New investor on asanoha.co.in/investors`,
    `${l.name}, ${l.role ? `${l.role}, ` : ''}${l.firm}`,
    `Email (verified): ${l.email}`,
    `WhatsApp: ${l.phone ? `${l.phone} (verified)` : l.outsideIndia ? 'outside India, email only' : 'not given'}`,
    l.website ? `Website: ${l.website}` : '',
    l.focus ? `Focus: ${l.focus}` : '',
    l.message ? `Note: ${l.message}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
