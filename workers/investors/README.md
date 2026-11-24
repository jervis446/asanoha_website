# Investor contact API

Cloudflare Worker and D1 database behind the "Talk to the founders" button on
`asanoha.co.in/investors/`. The only check is a WhatsApp code: there is no sign-in, and the
email address is optional and not verified.

## Routes

| Route | What it does |
|---|---|
| `GET /api/health` | Says whether WhatsApp sending and team email are configured |
| `POST /api/start {name, firm, role, website, email, message, phone, consent}` | Checks the details and sends a 6-digit WhatsApp code; returns `{id, phone}` |
| `POST /api/resend {id}` | Sends the code again (a minute apart, 5 a day per number) |
| `POST /api/verify {id, code}` | Confirms the number (5 tries), saves the lead, sends the investor a WhatsApp thank-you and tells the team |

Every POST needs an allowed `Origin`. Limits: 10 checks an hour per IP address.

## Setup

```bash
npx wrangler d1 create asanoha-investors        # put the id in wrangler.jsonc
npm run migrate
npx wrangler secret put WA_RELAY_TOKEN          # the token the Noha Pay WhatsApp relay uses
npx wrangler secret put CODE_SALT               # any long random string
npx wrangler secret put RESEND_API_KEY          # optional: emails each lead to TEAM_EMAIL
npm run deploy
```

Then put the Worker URL in `<meta name="investors-api">` in `investors/index.html`.
`TEAM_WHATSAPP` (comma separated Indian numbers) is optional and gets every lead on WhatsApp.

## Local

```bash
npm test
npm run migrate:local && npm run dev            # http://localhost:8799, the page on localhost uses it
```
