/* Asanoha Ayurveda storefront. Edit CONFIG and PRODUCTS below. */
(function () {
  'use strict';

  var CONFIG = {
    // WhatsApp business number with country code, digits only, e.g. '919876543210'. Leave as is to hide WhatsApp ordering.
    whatsapp: '919893453114',
    orderEmail: 'orders@asanoha.co.in',
    shipping: 79,
    freeShippingFrom: 1299,
    // true = prices are blurred on the site and left out of the order message. Set false to show real prices.
    hidePrices: true,
    // Free gift added to every order. Set to '' to switch it off everywhere in the cart and order message.
    gift: 'Asanoha rolling paper booklet (1 per order)'
  };

  var DOSE = {
    low:    { name: 'Low',    theme: 'Beach' },
    medium: { name: 'Medium', theme: 'Mountain' },
    high:   { name: 'High',   theme: 'Rooftop' }
  };

  // Prices are placeholders. Replace with your final MRP before launch.
  var PRODUCTS = [
    { id: 'gum-low', type: 'gummies', dose: 'low', name: 'Sunset Duo gummies', short: 'Two tins, 10 gummies each',
      img: 'assets/img/tins-low.webp', alt: 'Asanoha low dose gummy tins with a beach sunset illustration',
      variants: [ { id: 'duo', label: 'Duo: Kachcha aam + Dark cocoa', price: 1199 },
                  { id: 'aam', label: 'Single tin: Kachcha aam', price: 649 },
                  { id: 'cocoa', label: 'Single tin: Dark cocoa', price: 649 } ] },
    { id: 'gum-medium', type: 'gummies', dose: 'medium', name: 'Summit Duo gummies', short: 'Two tins, 10 gummies each',
      img: 'assets/img/tins-medium.webp', alt: 'Asanoha medium dose gummy tins with a mountain sunrise illustration',
      variants: [ { id: 'duo', label: 'Duo: Kachcha aam + Dark cocoa', price: 1399 },
                  { id: 'aam', label: 'Single tin: Kachcha aam', price: 749 },
                  { id: 'cocoa', label: 'Single tin: Dark cocoa', price: 749 } ] },
    { id: 'gum-high', type: 'gummies', dose: 'high', name: 'Rooftop Duo gummies', short: 'Two tins, 10 gummies each',
      img: 'assets/img/tins-high.webp', alt: 'Asanoha high dose gummy tins with an anime rooftop night illustration',
      variants: [ { id: 'duo', label: 'Duo: Kachcha aam + Dark cocoa', price: 1599 },
                  { id: 'aam', label: 'Single tin: Kachcha aam', price: 849 },
                  { id: 'cocoa', label: 'Single tin: Dark cocoa', price: 849 } ] },
    { id: 'tab-250', type: 'tablets', dose: 'high', name: 'unTrippy tablets', short: '250 mg Vijaya leaf extract per tablet',
      img: 'assets/img/tablets.webp', alt: 'unTrippy tablets carton with two blister strips of 10 tablets',
      story: 'Our high-strength tablet. One strip for you, one for them, both on prescription. Same rooftop, fewer crumbs.',
      variants: [ { id: 'duo', label: 'Duo carton: 2 strips x 10 tablets', price: 1799 },
                  { id: 'strip', label: 'Single strip: 10 tablets', price: 949 } ] },
    { id: 'oil-low', type: 'oil', dose: 'low', name: 'Sunset oil syringes', short: '2 x 1 ml oral syringes',
      img: 'assets/img/oil-low.webp', alt: 'Asanoha low dose oil sleeve with two oral syringes',
      variants: [ { id: 'duo', label: 'Syringe duo, 2 x 1 ml', price: 1499 } ] },
    { id: 'oil-medium', type: 'oil', dose: 'medium', name: 'Summit oil syringes', short: '2 x 1 ml oral syringes',
      img: 'assets/img/oil-medium.webp', alt: 'Asanoha medium dose oil sleeve with two oral syringes',
      variants: [ { id: 'duo', label: 'Syringe duo, 2 x 1 ml', price: 1699 } ] },
    { id: 'oil-high', type: 'oil', dose: 'high', name: 'Rooftop oil syringes', short: '2 x 1 ml oral syringes',
      img: 'assets/img/oil-high.webp', alt: 'Asanoha high dose oil sleeve with two oral syringes',
      variants: [ { id: 'duo', label: 'Syringe duo, 2 x 1 ml', price: 1899 } ] }
  ];

  var STORY = {
    low: 'The Goa plan that actually happened. Our gentlest strength, and where most people start.',
    medium: 'The trek you said "next year" to, five years running. One step up, when your practitioner says so.',
    high: 'The 2 a.m. rooftop talk. Our strongest, only on a practitioner\u2019s prescription.'
  };

  var byId = {}; PRODUCTS.forEach(function (p) { byId[p.id] = p; });
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var inr = function (n) { return '\u20B9' + Number(n).toLocaleString('en-IN'); };
  var esc = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function money(n) {
    if (!CONFIG.hidePrices) return inr(n);
    var fake = '\u20B9' + String(Math.round(n)).replace(/\d/g, '8').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return '<span class="blurprice" title="Shared after your prescription check"><span class="bp-num" aria-hidden="true">' + fake + '</span><span class="sr">Price shared after your prescription check</span></span>';
  }
  var waReady = /^\d{10,15}$/.test(CONFIG.whatsapp);

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('asanoha:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('asanoha:' + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- cart ---------- */
  // Older versions of the site stored the cart in a different shape. Anything unexpected is discarded.
  var cartRaw = store.get('cart', []);
  var cart = (Array.isArray(cartRaw) ? cartRaw : []).filter(function (l) { return l && byId[l.p] && variantOf(l.p, l.v) && l.q > 0; });
  function variantOf(pid, vid) { var p = byId[pid]; if (!p) return null; for (var i = 0; i < p.variants.length; i++) if (p.variants[i].id === vid) return p.variants[i]; return null; }
  function inCart(pid) { return cart.reduce(function (a, l) { return a + (l.p === pid ? l.q : 0); }, 0); }
  function saveCart() { store.set('cart', cart); var n = cart.reduce(function (a, l) { return a + l.q; }, 0); $$('.cart-count').forEach(function (e) { e.textContent = n; }); if ($('#grid')) renderGrid(); }
  function addToCart(pid, vid, q) {
    q = q || 1;
    var line = cart.filter(function (l) { return l.p === pid && l.v === vid; })[0];
    if (line) line.q = Math.min(line.q + q, 10); else cart.push({ p: pid, v: vid, q: Math.min(q, 10) });
    saveCart(); toast(byId[pid].name + ' added to cart');
  }
  function subtotal() { return cart.reduce(function (a, l) { return a + variantOf(l.p, l.v).price * l.q; }, 0); }
  function shippingFor(s) { return s === 0 || s >= CONFIG.freeShippingFrom ? 0 : CONFIG.shipping; }

  /* ---------- toast ---------- */
  var tt;
  function toast(msg) { var t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('show'); }, 2000); }

  /* ---------- age gate ---------- */
  function gate() {
    var g = $('#gate'); if (!g) return;
    if (!store.get('adult', false)) { g.classList.add('show'); document.body.classList.add('lock'); setTimeout(function () { $('#gate-yes').focus(); }, 50); }
    $('#gate-yes').addEventListener('click', function () { store.set('adult', true); g.classList.remove('show'); document.body.classList.remove('lock'); });
    $('#gate-no').addEventListener('click', function () { $('#gate-msg').hidden = false; });
  }

  /* ---------- nav ---------- */
  function nav() {
    var b = $('#menu-btn'), n = $('#nav'); if (!b || !n) return;
    b.addEventListener('click', function () { var o = n.classList.toggle('open'); b.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    $$('#nav a').forEach(function (a) { a.addEventListener('click', function () { n.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); }); });
  }

  /* ---------- shop grid ---------- */
  var filt = { type: 'all', dose: 'all' };
  function renderGrid() {
    var g = $('#grid'); if (!g) return;
    var list = PRODUCTS.filter(function (p) { return (filt.type === 'all' || p.type === filt.type) && (filt.dose === 'all' || p.dose === filt.dose); });
    if (!list.length) { g.innerHTML = '<p class="empty-state">Nothing here yet. Try another filter.</p>'; return; }
    g.innerHTML = list.map(function (p) {
      var from = Math.min.apply(null, p.variants.map(function (v) { return v.price; }));
      return '<article class="card">' +
        '<button class="pic" data-open="' + p.id + '" aria-label="View ' + esc(p.name) + '"><img src="' + p.img + '" alt="' + esc(p.alt) + '" loading="lazy" width="1400" height="980"></button>' +
        '<div class="body"><span class="badge ' + p.dose + '">' + DOSE[p.dose].name + ' dose</span>' +
        '<h3>' + esc(p.name) + '</h3><p class="meta">' + esc(p.short) + '. ' + esc(p.story || STORY[p.dose]) + '</p>' +
        (inCart(p.id) ? '<span class="incart">\u2713 ' + inCart(p.id) + ' in your cart</span>' : '') +
        '<div class="row"><span class="price">' + (p.variants.length > 1 && !CONFIG.hidePrices ? '<small>from </small>' : '') + money(from) + (CONFIG.hidePrices ? '<span class="lockchip">\uD83D\uDD12 after Rx check</span>' : '') + '</span>' +
        '<button class="btn small clay" data-open="' + p.id + '">' + (inCart(p.id) ? 'Add more' : 'Choose') + '</button></div></div></article>';
    }).join('');
  }
  function filters() {
    $$('[data-filter]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-filter'), v = b.getAttribute('data-value');
        filt[k] = v;
        $$('[data-filter="' + k + '"]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        renderGrid();
      });
    });
    $$('[data-shop-dose]').forEach(function (a) {
      a.addEventListener('click', function () {
        var d = a.getAttribute('data-shop-dose'); filt.dose = d;
        $$('[data-filter="dose"]').forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-value') === d ? 'true' : 'false'); });
        renderGrid();
      });
    });
    document.addEventListener('click', function (e) { var o = e.target.closest('[data-open]'); if (o) openProduct(o.getAttribute('data-open'), o); });
  }

  /* ---------- product modal ---------- */
  var lastFocus = null;
  function openProduct(pid, from) {
    var p = byId[pid], m = $('#pmodal'); if (!p || !m) return;
    lastFocus = from || document.activeElement;
    var imgs = [p.img].concat(p.type === 'gummies' ? ['assets/img/tinback.webp', 'assets/img/foil.webp'] : ['assets/img/foil.webp']);
    var inside = p.type === 'tablets'
      ? ['250 mg full spectrum Vijaya (cannabis) leaf extract per tablet', 'Blister strips of 10, printed aadha tera and aadha mera', 'High strength: usually prescribed after a lower dose, never as a first try', 'unTrippy is a name, not a promise. Some people feel drowsy, dizzy or mildly high, so take only what is prescribed']
      : p.type === 'gummies'
      ? ['10 gummies per tin, Vijaya leaf extract, strength as printed on the label', 'Kachcha aam: raw mango, a little salt, a little sour', 'Dark cocoa: bittersweet, grown-up chocolate', 'A reusable woven cord with every duo']
      : ['Two graduated 1 ml oral syringes of full spectrum Vijaya leaf oil', 'Strength per ml as printed on the label', 'Different plunger colours so nobody takes the other one\u2019s', 'Reusable sleeve with a woven cord'];
    $('#pm-body').innerHTML =
      '<div class="gallery"><img id="pm-main" src="' + imgs[0] + '" alt="' + esc(p.alt) + '">' +
      '<div class="thumbs">' + imgs.map(function (s, i) { return '<button type="button" data-src="' + s + '" aria-current="' + (i === 0) + '" aria-label="Image ' + (i + 1) + '"><img src="' + s + '" alt=""></button>'; }).join('') + '</div></div>' +
      '<div class="info"><span class="badge ' + p.dose + '">' + DOSE[p.dose].name + ' dose \u00B7 ' + (p.type === 'tablets' ? 'Tablets' : DOSE[p.dose].theme) + '</span>' +
      '<h2 id="pm-title">' + esc(p.name) + '</h2><p>' + esc(p.story || STORY[p.dose]) + '</p>' +
      (inCart(p.id) ? '<p class="incart">\u2713 Already in your cart: ' + cart.filter(function (l) { return l.p === p.id; }).map(function (l) { return l.q + ' x ' + esc(variantOf(l.p, l.v).label); }).join(', ') + '</p>' : '') +
      '<div class="variants" role="radiogroup" aria-label="Choose a pack">' + p.variants.map(function (v, i) {
        return '<label class="variant"><span><input type="radio" name="pv" value="' + v.id + '"' + (i === 0 ? ' checked' : '') + '>' + esc(v.label) + '</span><span>' + money(v.price) + '</span></label>';
      }).join('') + '</div>' +
      '<div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><div class="qty" role="group" aria-label="Quantity"><button type="button" data-q="-1" aria-label="One less">\u2212</button><output id="pm-q">1</output><button type="button" data-q="1" aria-label="One more">+</button></div>' +
      '<button class="btn clay" id="pm-add" style="flex-grow:1">Add to cart</button></div>' +
      '<p class="hint">Prescription from a registered Ayurvedic practitioner needed before dispatch. Don\u2019t have one? Choose \u201Cneed a consultation\u201D at checkout and we\u2019ll help you book one.</p>' +
      '<details><summary style="cursor:pointer;font-weight:800">What\u2019s inside</summary><ul>' + inside.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></details>' +
      '<details><summary style="cursor:pointer;font-weight:800">How to take it</summary><p style="margin-top:8px">Exactly as your practitioner directs. Start low, go slow, and don\u2019t drive until you know how it suits you. Store below 25\u00B0C, away from sunlight, out of reach of children.</p></details></div>';
    var q = 1;
    $$('#pm-body .thumbs button').forEach(function (b) { b.addEventListener('click', function () { $('#pm-main').src = b.getAttribute('data-src'); $$('#pm-body .thumbs button').forEach(function (x) { x.setAttribute('aria-current', x === b ? 'true' : 'false'); }); }); });
    $$('#pm-body [data-q]').forEach(function (b) { b.addEventListener('click', function () { q = Math.max(1, Math.min(10, q + Number(b.getAttribute('data-q')))); $('#pm-q').textContent = q; }); });
    $('#pm-add').addEventListener('click', function () { var v = ($('#pm-body input[name=pv]:checked') || {}).value || p.variants[0].id; addToCart(p.id, v, q); closeModal(); });
    m.classList.add('open'); $('#scrim').classList.add('open'); document.body.classList.add('lock');
    setTimeout(function () { $('#pm-close').focus(); }, 30);
  }
  function closeModal() { var m = $('#pmodal'); if (!m || !m.classList.contains('open')) return; m.classList.remove('open'); if (!$('#drawer').classList.contains('open')) { $('#scrim').classList.remove('open'); document.body.classList.remove('lock'); } if (lastFocus && lastFocus.focus) lastFocus.focus(); }

  /* ---------- drawer / checkout ---------- */
  var view = 'cart', drawerFrom = null, lastOrder = null;
  function openDrawer() { drawerFrom = document.activeElement; if (view === 'done') view = 'cart'; renderDrawer(); $('#drawer').classList.add('open'); $('#drawer').setAttribute('aria-hidden', 'false'); $('#scrim').classList.add('open'); document.body.classList.add('lock'); setTimeout(function () { $('#d-close').focus(); }, 30); }
  function closeDrawer() { $('#drawer').classList.remove('open'); $('#drawer').setAttribute('aria-hidden', 'true'); if (!$('#pmodal') || !$('#pmodal').classList.contains('open')) { $('#scrim').classList.remove('open'); document.body.classList.remove('lock'); } if (drawerFrom && drawerFrom.focus) drawerFrom.focus(); }

  function renderDrawer() {
    var body = $('#d-body'), foot = $('#d-foot'), title = $('#d-title');
    if (view === 'done' && lastOrder) {
      title.textContent = 'Almost done';
      var wa = waReady ? 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(lastOrder.text) : '';
      var mail = 'mailto:' + CONFIG.orderEmail + '?subject=' + encodeURIComponent('Order ' + lastOrder.id) + '&body=' + encodeURIComponent(lastOrder.text);
      body.innerHTML = '<div class="done"><img src="assets/img/mark.svg" alt="" width="84" height="84" style="margin:0 auto"><h3>One last tap</h3><div class="oid">' + lastOrder.id + '</div>' +
        '<p>Send us this order so we can check your prescription and share a payment link. ' + (lastOrder.rx === 'upload' ? 'Attach your prescription (' + esc(lastOrder.file) + ') in the chat or email.' : 'We\u2019ll help you book a consultation with a registered Ayurvedic practitioner first.') + '</p>' +
        '<p class="hint">Nothing is charged yet. We usually reply within a working day.</p></div>';
      foot.innerHTML = (wa ? '<a class="btn clay wide" target="_blank" rel="noopener" href="' + wa + '" data-sent>Send on WhatsApp</a>' : '') +
        '<a class="btn ' + (wa ? 'ghost' : 'clay') + ' wide" href="' + mail + '" data-sent>Send by email</a><button class="btn ghost wide" id="d-back-shop">Back to the shop</button>';
      $$('[data-sent]').forEach(function (a) { a.addEventListener('click', function () { cart = []; saveCart(); }); });
      $('#d-back-shop').addEventListener('click', function () { view = 'cart'; closeDrawer(); });
      return;
    }
    if (!cart.length) {
      title.textContent = 'Your cart';
      body.innerHTML = '<div class="empty"><img src="assets/img/mark.svg" alt="" width="70" height="70" style="margin:0 auto 12px;opacity:.8"><p>Your cart is empty. Every good plan starts with two of something.</p><a class="btn" href="index.html#shop" id="d-go">Browse the range</a></div>';
      foot.innerHTML = ''; $('#d-go').addEventListener('click', closeDrawer); return;
    }
    var s = subtotal(), sh = shippingFor(s);
    if (view === 'checkout') {
      title.textContent = 'Checkout';
      var saved = store.get('details', {});
      body.innerHTML = '<form class="form" id="co" novalidate>' +
        '<label>Full name<input type="text" name="name" autocomplete="name" required value="' + esc(saved.name || '') + '"></label>' +
        '<div class="two"><label>Phone<input type="tel" name="phone" autocomplete="tel" inputmode="tel" required value="' + esc(saved.phone || '') + '"></label>' +
        '<label>Email<input type="email" name="email" autocomplete="email" value="' + esc(saved.email || '') + '"></label></div>' +
        '<label>Delivery address<textarea name="addr" autocomplete="street-address" required>' + esc(saved.addr || '') + '</textarea></label>' +
        '<div class="two"><label>City<input type="text" name="city" autocomplete="address-level2" required value="' + esc(saved.city || '') + '"></label>' +
        '<label>Pincode<input type="text" name="pin" autocomplete="postal-code" inputmode="numeric" maxlength="6" required value="' + esc(saved.pin || '') + '"></label></div>' +
        '<fieldset><legend>Prescription</legend>' +
        '<label class="radio"><input type="radio" name="rx" value="upload" checked> I have a prescription from a registered Ayurvedic practitioner</label>' +
        '<label id="rx-file-wrap">Prescription photo or PDF<input type="file" name="rxfile" accept="image/*,application/pdf"><span class="hint">You\u2019ll attach it when you send the order. It never leaves your phone until then.</span></label>' +
        '<label class="radio"><input type="radio" name="rx" value="consult"> I need a consultation first (we\u2019ll help you book one)</label></fieldset>' +
        '<label>Slam book line for your friend <span class="hint">(optional)</span><textarea class="hand" name="slam" maxlength="140" placeholder="Friend since class 6. Still owes me a samosa."></textarea></label>' +
        '<label class="check"><input type="checkbox" name="print"> You may print my slam book line on a future batch, with my first name and city only.</label>' +
        '<label class="check"><input type="checkbox" name="agree" required> I am 18 or older and agree to the <a href="terms.html" target="_blank">terms</a> and <a href="privacy.html" target="_blank">privacy policy</a>.</label>' +
        '<p class="err" id="co-err" role="alert"></p></form>';
      var f = $('#co');
      $$('input[name=rx]', f).forEach(function (r) { r.addEventListener('change', function () { $('#rx-file-wrap').hidden = f.rx.value !== 'upload'; }); });
      foot.innerHTML = '<div class="sum total"><span>Total</span><span>' + money(s + sh) + '</span></div><button class="btn clay wide" id="place">Review and send order</button><button class="btn ghost wide" id="back">Back to cart</button>';
      $('#back').addEventListener('click', function () { view = 'cart'; renderDrawer(); });
      $('#place').addEventListener('click', placeOrder);
      return;
    }
    title.textContent = 'Your cart';
    body.innerHTML = cart.map(function (l, i) {
      var p = byId[l.p], v = variantOf(l.p, l.v);
      return '<div class="line"><img src="' + p.img + '" alt=""><div><b>' + esc(p.name) + '</b><small>' + esc(v.label) + '</small><small>' + DOSE[p.dose].name + ' dose \u00B7 ' + money(v.price) + '</small><button class="rm" data-rm="' + i + '">Remove</button></div>' +
        '<div class="qty" role="group" aria-label="Quantity for ' + esc(p.name) + '"><button data-dq="-1" data-i="' + i + '" aria-label="One less">\u2212</button><output>' + l.q + '</output><button data-dq="1" data-i="' + i + '" aria-label="One more">+</button></div></div>';
    }).join('');
    foot.innerHTML = (CONFIG.hidePrices ? '<p class="hint" style="margin:0">\uD83D\uDD12 Your price and delivery charge are shared with the payment link, right after we check your prescription.</p>' : '') +
      (CONFIG.hidePrices ? '' : '<div class="sum"><span>Subtotal</span><span>' + money(s) + '</span></div><div class="sum"><span>Delivery</span><span>' + (sh ? money(sh) : 'Free') + '</span></div>') +
      (sh && !CONFIG.hidePrices ? '<p class="hint" style="margin:0">Free delivery from ' + money(CONFIG.freeShippingFrom) + '.</p>' : '') +
      (CONFIG.gift ? '<div class="gift-line"><span aria-hidden="true">\uD83C\uDF81</span>Free with this order: ' + esc(CONFIG.gift) + '</div>' : '') +
      '<div class="sum total"><span>Total</span><span>' + money(s + sh) + '</span></div><button class="btn clay wide" id="to-co">Checkout</button>';
    $('#to-co').addEventListener('click', function () { view = 'checkout'; renderDrawer(); });
  }
  function placeOrder() {
    var f = $('#co'), err = $('#co-err'), miss = [];
    var d = { name: f.name.value.trim(), phone: f.phone.value.trim(), email: f.email.value.trim(), addr: f.addr.value.trim(), city: f.city.value.trim(), pin: f.pin.value.trim() };
    if (!d.name) miss.push('your name');
    if (!/^(\+?91[\s-]?)?[6-9]\d{9}$/.test(d.phone.replace(/[\s-]/g, ''))) miss.push('a valid Indian mobile number');
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) miss.push('a valid email');
    if (!d.addr) miss.push('your address');
    if (!d.city) miss.push('your city');
    if (!/^[1-9]\d{5}$/.test(d.pin)) miss.push('a 6 digit pincode');
    var rx = f.rx.value, file = f.rxfile.files[0];
    if (rx === 'upload' && !file) miss.push('your prescription file');
    if (file && file.size > 10 * 1024 * 1024) miss.push('a prescription file under 10 MB');
    if (!f.agree.checked) miss.push('the 18+ and terms confirmation');
    if (miss.length) { err.textContent = 'Please add ' + miss.join(', ') + '.'; return; }
    store.set('details', d);
    var now = new Date(), id = 'ASN-' + String(now.getFullYear()).slice(2) + ('0' + (now.getMonth() + 1)).slice(-2) + ('0' + now.getDate()).slice(-2) + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    var s = subtotal(), sh = shippingFor(s);
    var lines = cart.map(function (l) { var p = byId[l.p], v = variantOf(l.p, l.v); return '\u2022 ' + p.name + ' (' + DOSE[p.dose].name + ' dose), ' + v.label + ' x ' + l.q + (CONFIG.hidePrices ? '' : ' = ' + inr(v.price * l.q)); });
    var text = 'Hi Asanoha, new order ' + id + '\n\n' + lines.join('\n') + (CONFIG.gift ? '\n\u2022 Free gift: ' + CONFIG.gift : '') + (CONFIG.hidePrices ? '\n\nPlease share the price and payment link after checking my prescription.' : '\n\nSubtotal: ' + inr(s) + '\nDelivery: ' + (sh ? inr(sh) : 'Free') + '\nTotal: ' + inr(s + sh)) +
      '\n\nName: ' + d.name + '\nPhone: ' + d.phone + (d.email ? '\nEmail: ' + d.email : '') + '\nAddress: ' + d.addr + ', ' + d.city + ' - ' + d.pin +
      '\nPrescription: ' + (rx === 'upload' ? 'attached (' + file.name + ')' : 'need a consultation') +
      (f.slam.value.trim() ? '\nSlam book line: ' + f.slam.value.trim() + (f.print.checked ? ' (ok to print)' : ' (do not print)') : '');
    lastOrder = { id: id, text: text, rx: rx, file: file ? file.name : '' };
    var hist = store.get('orders', []); hist.unshift({ id: id, at: now.toISOString(), total: s + sh }); store.set('orders', hist.slice(0, 20));
    view = 'done'; renderDrawer();
  }
  function drawer() {
    if (!$('#drawer')) return;
    $$('.cart-btn').forEach(function (b) { b.addEventListener('click', openDrawer); });
    $('#d-close').addEventListener('click', closeDrawer);
    $('#scrim').addEventListener('click', function () { closeModal(); closeDrawer(); });
    $('#d-body').addEventListener('click', function (e) {
      var b = e.target.closest('[data-dq]'), r = e.target.closest('[data-rm]');
      if (b) { var i = +b.getAttribute('data-i'); cart[i].q = Math.max(0, Math.min(10, cart[i].q + +b.getAttribute('data-dq'))); if (!cart[i].q) cart.splice(i, 1); saveCart(); renderDrawer(); }
      if (r) { cart.splice(+r.getAttribute('data-rm'), 1); saveCart(); renderDrawer(); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { if ($('#pmodal') && $('#pmodal').classList.contains('open')) closeModal(); else if ($('#drawer').classList.contains('open')) closeDrawer(); } });
    if ($('#pm-close')) $('#pm-close').addEventListener('click', closeModal);
    if (location.hash === '#cart') openDrawer();
  }


  /* ---------- day / night ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    var b = $('#theme-btn'); if (b) { b.setAttribute('aria-pressed', t === 'night' ? 'true' : 'false'); b.setAttribute('aria-label', t === 'night' ? 'Switch to day mode' : 'Switch to night mode'); }
    var m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'night' ? '#0F1615' : '#ECE5D8');
    sky.start(t === 'night' ? 'night' : 'day');
  }
  function themeToggle() {
    var b = $('#theme-btn'); if (!b) return;
    b.addEventListener('click', function () { var t = document.documentElement.getAttribute('data-theme') === 'night' ? 'day' : 'night'; store.set('theme', t); applyTheme(t); });
    applyTheme(document.documentElement.getAttribute('data-theme') || 'day');
  }

  /* ---------- living sky: stars at night, beach sky by day ---------- */
  var sky = (function () {
    var c, ctx, raf = 0, running = false, w = 0, h = 0, dpr = 1, mode = 'day', t0 = 0;
    var stars = [], shots = [], sparks = [], nextShot = 0, clouds = [], birds = [], nextBirds = 0, motes = [];
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function build() {
      dpr = Math.min(window.devicePixelRatio || 1, 2); w = window.innerWidth; h = window.innerHeight;
      c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = []; clouds = []; motes = [];
      if (mode === 'night') {
        var n = Math.round(w * h / 6500);
        for (var i = 0; i < n; i++) stars.push({ x: Math.random() * w, y: Math.random() * h, r: rnd(.3, 1.6), a: rnd(.3, .9), s: rnd(.004, .024), p: rnd(0, 6.28), gold: Math.random() < .12 });
      } else {
        var k = Math.max(4, Math.round(w / 260));
        for (var q = 0; q < k; q++) clouds.push(cloud(Math.random() * w));
        for (var m = 0; m < Math.round(w / 40); m++) motes.push({ x: Math.random() * w, y: Math.random() * h, r: rnd(.8, 2.2), vy: rnd(-.12, -.04), vx: rnd(-.08, .08), a: rnd(.15, .45), p: rnd(0, 6.28) });
      }
    }
    function cloud(x) {
      var s = rnd(.6, 1.35), puffs = [], n = 4 + Math.floor(Math.random() * 3);
      for (var i = 0; i < n; i++) puffs.push({ dx: (i - n / 2) * 26 * s + rnd(-6, 6), dy: rnd(-14, 6) * s, r: rnd(18, 32) * s });
      return { x: x, y: rnd(40, h * .38), v: rnd(.06, .18) * (still ? 0 : 1), puffs: puffs, a: rnd(.55, .85), w: n * 26 * s };
    }
    function drawCloud(cl) {
      ctx.globalAlpha = cl.a; ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      cl.puffs.forEach(function (p) { ctx.moveTo(cl.x + p.dx + p.r, cl.y + p.dy); ctx.arc(cl.x + p.dx, cl.y + p.dy, p.r, 0, 6.283); });
      ctx.fill();
      ctx.globalAlpha = cl.a * .35; ctx.fillStyle = '#E9D2A0';
      ctx.beginPath(); ctx.ellipse(cl.x, cl.y + 18, cl.w * .55, 7, 0, 0, 6.283); ctx.fill();
    }
    function spawnBirds(t) {
      var dir = Math.random() < .5 ? 1 : -1, y = rnd(h * .08, h * .35), x = dir > 0 ? -40 : w + 40, sp = rnd(.9, 1.5);
      // birds fly in pairs, like everything else here
      birds.push({ x: x, y: y, vx: sp * dir, ph: 0, sz: rnd(7, 10) }, { x: x - 26 * dir, y: y + rnd(10, 18), vx: sp * dir, ph: 1.7, sz: rnd(6, 9) });
      nextBirds = t + rnd(5000, 11000);
    }
    function drawBird(b, t) {
      var f = Math.sin(t * .012 + b.ph) * .55, s = b.sz;
      ctx.globalAlpha = .75; ctx.strokeStyle = '#3A4441'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(b.x - s, b.y - s * f); ctx.quadraticCurveTo(b.x - s * .4, b.y - s * .5, b.x, b.y); ctx.quadraticCurveTo(b.x + s * .4, b.y - s * .5, b.x + s, b.y - s * f); ctx.stroke();
    }
    function shoot(t) {
      var fromRight = Math.random() < .5, x = fromRight ? w * rnd(.5, 1) : w * rnd(0, .5), y = rnd(0, h * .45);
      var ang = (fromRight ? 150 : 30) * Math.PI / 180 + rnd(-.15, .15), sp = rnd(9, 15);
      shots.push({ x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.abs(Math.sin(ang)) * sp, life: 0, max: rnd(55, 85), len: rnd(90, 160) });
      nextShot = t + rnd(2200, 6400);
    }
    function night(t) {
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i], a = still ? s.a : s.a * (.55 + .45 * Math.sin(s.p + t * s.s * .06));
        ctx.globalAlpha = a; ctx.fillStyle = s.gold ? '#F0C987' : '#F4EEE3';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
      if (still) return;
      if (t > nextShot) shoot(t);
      for (var j = shots.length - 1; j >= 0; j--) {
        var m = shots[j]; m.life++; m.x += m.vx; m.y += m.vy;
        var k = 1 - m.life / m.max, sp = Math.hypot(m.vx, m.vy), tx = m.x - m.vx / sp * m.len, ty = m.y - m.vy / sp * m.len;
        var g = ctx.createLinearGradient(m.x, m.y, tx, ty);
        g.addColorStop(0, 'rgba(255,248,230,' + (.95 * k) + ')'); g.addColorStop(1, 'rgba(240,201,135,0)');
        ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(m.x, m.y); ctx.lineTo(tx, ty); ctx.stroke();
        if (m.life > m.max || m.y > h + 200) { for (var q = 0; q < 6; q++) sparks.push({ x: m.x, y: m.y, vx: rnd(-1.5, 1.5), vy: rnd(-1, 2), life: 0 }); shots.splice(j, 1); }
      }
      for (var z = sparks.length - 1; z >= 0; z--) {
        var p = sparks[z]; p.life++; p.x += p.vx; p.y += p.vy; p.vy += .05;
        ctx.globalAlpha = Math.max(0, 1 - p.life / 40); ctx.fillStyle = '#F0C987'; ctx.beginPath(); ctx.arc(p.x, p.y, 1.2, 0, 6.283); ctx.fill();
        if (p.life > 40) sparks.splice(z, 1);
      }
    }
    function day(t) {
      for (var m = 0; m < motes.length; m++) {
        var o = motes[m]; if (!still) { o.x += o.vx + Math.sin(t * .001 + o.p) * .08; o.y += o.vy; if (o.y < -10) { o.y = h + 10; o.x = Math.random() * w; } }
        ctx.globalAlpha = o.a * (.6 + .4 * Math.sin(t * .002 + o.p)); ctx.fillStyle = '#F0C987'; ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, 6.283); ctx.fill();
      }
      for (var i = 0; i < clouds.length; i++) { var cl = clouds[i]; cl.x += cl.v; if (cl.x - cl.w > w + 40) { clouds[i] = cloud(-cl.w - 40); } drawCloud(cl); }
      if (still) return;
      if (t > nextBirds) spawnBirds(t);
      for (var b = birds.length - 1; b >= 0; b--) { var bd = birds[b]; bd.x += bd.vx; bd.y += Math.sin(t * .002 + bd.ph) * .15; drawBird(bd, t); if (bd.x < -80 || bd.x > w + 80) birds.splice(b, 1); }
    }
    function frame(t) {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      if (mode === 'night') night(t); else day(t);
      ctx.globalAlpha = 1;
      if (!still) raf = requestAnimationFrame(frame);
    }
    return {
      start: function (m) {
        c = c || $('#sky'); if (!c) return; ctx = ctx || c.getContext('2d'); if (!ctx) return;
        cancelAnimationFrame(raf); mode = m || 'day'; shots = []; sparks = []; birds = [];
        build(); running = true; var now = performance.now(); nextShot = now + 1200; nextBirds = now + 1500;
        raf = requestAnimationFrame(frame);
        if (!sky._bound) { sky._bound = true;
          window.addEventListener('resize', function () { if (running) { build(); if (still) frame(performance.now()); } });
          document.addEventListener('visibilitychange', function () { if (document.hidden) cancelAnimationFrame(raf); else if (running) raf = requestAnimationFrame(frame); }); }
      },
      stop: function () { running = false; cancelAnimationFrame(raf); if (ctx) ctx.clearRect(0, 0, w, h); }
    };
  })();

  /* ---------- hero + reveal ---------- */
  function hero() { var h = $('.hero-art'); if (h) setTimeout(function () { h.classList.add('joined'); }, 350); }
  function reveal() {
    var els = $$('.reveal'); if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }); }, { threshold: .12 });
    els.forEach(function (e) { io.observe(e); });
  }
  function contact() {
    $$('[data-wa]').forEach(function (a) { if (waReady) a.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(a.getAttribute('data-wa')); else a.hidden = true; });
    $$('[data-mail]').forEach(function (a) { a.href = 'mailto:' + CONFIG.orderEmail; a.textContent = a.textContent || CONFIG.orderEmail; });
    var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  }

  document.addEventListener('DOMContentLoaded', function () {
    [gate, nav, themeToggle, renderGrid, filters, drawer, hero, reveal, contact, saveCart].forEach(function (fn) { try { fn(); } catch (e) { if (window.console) console.error('Asanoha:', fn.name, e); } });
  });
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
