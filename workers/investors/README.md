# Investor contact API

Cloudflare Worker and D1 database behind the "Talk to the founders" button on
`asanoha.co.in/investors/`. The page signs the investor in with an emailed code
(the shared Asanoha Supabase account), then this Worker sends and checks a
WhatsApp code, saves the lead and emails a confirmation.

## Routes

| Route | What it does |
|---|---|
| `GET /api/health` | Says whether WhatsApp and email sending are configured |
| `POST /api/phone/start {phone}` | Sends a 6-digit WhatsApp code (10 minutes, 60 s between sends, 5 a day) |
| `POST /api/phone/verify {code}` | Checks the code (5 tries) and marks the number verified |
| `POST /api/lead {name, firm, role, website, message, outsideIndia, consent}` | Saves the lead, emails the investor once, tells the team |

Every POST needs an allowed `Origin` and `Authorization: Bearer <Asanoha access token>`
for a confirmed email.

## Setup

```bash
npx wrangler d1 create asanoha-investors        # put the id in wrangler.jsonc
npm run migrate
npx wrangler secret put WA_RELAY_TOKEN          # same token the WhatsApp relay uses
npx wrangler secret put CODE_SALT               # any long random string
npx wrangler secret put RESEND_API_KEY          # after asanoha.co.in is verified in Resend
npm run deploy
```

Then put the Worker URL in `<meta name="investors-api">` in `investors/index.html`.
`TEAM_WHATSAPP` (comma separated Indian numbers) is optional; `TEAM_EMAIL` gets every lead.

Without `RESEND_API_KEY` leads are still saved, but no confirmation email goes out.
Without `WA_RELAY_TOKEN` investors in India can't finish; those outside India still can.

## Local

```bash
npm test
npm run migrate:local && npm run dev            # http://localhost:8799, the page on localhost uses it
```
