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

export const hashCode = (id: string, code: string, salt: string) => sha256(`${salt}:${id}:${code}`);

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
  email: string | null;
  message: string | null;
  phone: string;
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
  let email = clean(b.email, 200);
  if (email) {
    email = email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError('That email doesn’t look right. You can also leave it empty.');
  }
  const phone = normalizePhone(b.phone);
  if (!phone) throw new ApiError('Enter a 10-digit Indian mobile number that has WhatsApp.');
  if (b.consent !== true) throw new ApiError('Please agree to be contacted about Asanoha.');
  return {
    name,
    firm,
    role: clean(b.role, 120),
    website,
    email,
    message: clean(b.message, 2000),
    phone,
  };
}

/** Origin allowed to call the API, or null. */
export function allowedOrigin(origin: string | null, list: string): string | null {
  if (!origin) return null;
  return list.split(',').map((s) => s.trim()).filter(Boolean).includes(origin) ? origin : null;
}

/** The WhatsApp message the investor gets once their number is confirmed. */
export function confirmationMessage(name: string): string {
  const first = name.split(/\s+/)[0];
  return [
    `Hi ${first}, thank you for your interest in Asanoha.`,
    '',
    'We have your details, and our founder will reach out to you.',
    '',
    'The Asanoha founders',
    'Asanoha LLP, Bengaluru',
  ].join('\n');
}

/** The note the founders get about a new investor. */
export function teamNote(l: LeadInput): string {
  return [
    `New investor on asanoha.co.in/investors`,
    `${l.name}, ${l.role ? `${l.role}, ` : ''}${l.firm}`,
    `WhatsApp (verified): ${l.phone}`,
    `Email (not verified): ${l.email ?? 'not given'}`,
    l.website ? `Website: ${l.website}` : '',
    l.message ? `Note: ${l.message}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
