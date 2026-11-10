# Asanoha Ayurveda website

Static site for asanoha.co.in, hosted on GitHub Pages.

## Pages
- index.html: home, doses, shop, how it works, slam book, FAQ
- about.html: founders and contact
- privacy.html, terms.html: legal pages
- 404.html: not found page

## Before launch, edit these
1. assets/js/site.js, CONFIG block at the top
   - whatsapp: your WhatsApp business number with country code, digits only (for example 919876543210). While it contains X, the WhatsApp buttons stay hidden.
   - orderEmail: the inbox that receives orders.
   - shipping and freeShippingFrom: delivery charge and free delivery threshold.
2. assets/js/site.js, PRODUCTS block: replace the placeholder prices with your final MRP.
3. Placeholders in square brackets across the pages: licence number, LLP number, registered office, grievance officer, retention period, dispatch days, court city. Search the project for "[" to find them all.
4. Strength per gummy and per ml is shown as "[X] mg" on packaging images. Re-export the images once final strengths are fixed.

## How ordering works
There is no payment gateway yet. At checkout the customer fills in details and picks either "I have a prescription" or "I need a consultation". The site then builds an order summary with an order ID and opens WhatsApp or email with it prefilled. The customer attaches the prescription in that chat or email. You verify it and reply with a payment link.

## Deploy
Upload every file in this folder, including CNAME and .nojekyll, to the root of the main branch of jervis446/asanoha_website. Keep the CNAME file, or GitHub Pages will drop the custom domain.

After each deploy, bump CACHE in sw.js (asanoha-v3 to asanoha-v4 and so on) so returning visitors get the new version.

## Interactive tools

New static routes:
- `/tools/`
- `/which-half-are-you/`
- `/other-half-game/`
- `/slam-book-ai/`
- `/friendship-story/`

Each route has its own 18+ gate using `localStorage` key `asanoha:tools-adult`. This is an age acknowledgement, not a secure age-verification system.

The AI-labelled slam-book experience currently runs locally in the browser and includes an optional prompt-copy flow. It does not expose an AI API key. For a production AI model, add a server-side endpoint such as `/api/friendship-story` and keep the provider key on the server.


Brand terminology update: public references to Rolling Paper(s) were changed to Friendship Paper(s).

## Shared Asanoha login (Supabase)
Sign-in can run on Firebase (current) or on the shared Asanoha account in Supabase, which Wearday also uses. With Supabase, one Google or Apple sign-in works on asanoha.co.in, wearday.asanoha.co.in and the Wearday app, and Noha Money is one wallet with one history.

The switch is authProvider in assets/js/site.js. Before setting it to 'supabase':
1. Supabase > Authentication > Providers > Google: turn on, paste the Client ID and secret of a Web OAuth client from Google Cloud project asanoha-1420b. Its authorised redirect URI is https://fkhxgkscnkxtwnvecoyv.supabase.co/auth/v1/callback. Add the iOS app's Google client ID under Authorized Client IDs so native sign-in in the app works.
2. Supabase > Authentication > Providers > Apple: turn on, add the Services ID, key and team ID, and the app bundle ID under Client IDs.
3. Supabase > Authentication > URL Configuration > Redirect URLs: add https://asanoha.co.in/** and https://wearday.asanoha.co.in/**.
4. Apply the database changes from the Wearday repo (supabase/migrations: noha_money and asanoha_profiles).
5. Set authProvider: 'supabase', bump CACHE in sw.js, and deploy.

What moves: addresses, profile and recent orders saved on each device merge into the new account at the first sign-in. Data stored only in Firestore does not move automatically.
Rolling back: set authProvider back to 'firebase'.
