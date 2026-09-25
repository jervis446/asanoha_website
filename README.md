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
