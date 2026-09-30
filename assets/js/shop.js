/* Asanoha app shop: product grid, cart, delivery addresses, Noha Money and profile.
   Works the same on phone and desktop. Loaded on every page after site.js. */
(function () {
  'use strict';
  var CFG = (window.ASANOHA && window.ASANOHA.config) || {};
  var WA = CFG.whatsapp || '919893453114', MAIL = CFG.orderEmail || 'orders@asanoha.co.in';
  var SUPPORT = 'about.html#contact';
  // status: 'live' = orderable, 'soon' = shown but not orderable yet
  var P = [
    { id: 'gum-high', type: 'gummies', dose: 'high', name: 'Rooftop Duo gummies', pack: '2 tins, 20 gummies', img: 'assets/img/tins-high.webp', strength: 'High strength', status: 'live', desc: 'Kachcha aam and dark cocoa, 10 gummies per tin. Our strongest gummy, only on a practitioner\u2019s prescription.' },
    { id: 'tab-250', type: 'tablets', dose: 'high', name: 'unTrippy tablets', pack: '2 strips, 20 tablets', img: 'assets/img/tablets.webp', strength: '250 mg per tablet', status: 'live', desc: '250 mg Vijaya leaf extract per tablet. No taste, no measuring. Usually prescribed after a lower dose.' },
    { id: 'oil-high', type: 'oil', dose: 'high', name: 'Rooftop oil', pack: '2 x 1 ml syringes', img: 'assets/img/oil-high.webp', strength: 'High strength', status: 'live', desc: 'Full spectrum Vijaya leaf extract in MCT oil, in graduated 1 ml oral syringes for exact dosing.' },
    { id: 'gum-low', type: 'gummies', dose: 'low', name: 'Sunset Duo gummies', pack: '2 tins, 20 gummies', img: 'assets/img/tins-low.webp', strength: 'Low strength', status: 'live', desc: 'Our gentlest gummy and where most people start. Kachcha aam and dark cocoa.' },
    { id: 'oil-low', type: 'oil', dose: 'low', name: 'Sunset oil', pack: '2 x 1 ml syringes', img: 'assets/img/oil-low.webp', strength: 'Low strength', status: 'live', desc: 'Gentle full spectrum oil in 1 ml oral syringes. A careful first step.' },
    { id: 'gum-medium', type: 'gummies', dose: 'medium', name: 'Summit Duo gummies', pack: '2 tins, 20 gummies', img: 'assets/img/tins-medium.webp', strength: 'Medium strength', status: 'soon', desc: 'Our medium strength joins after launch.' },
    { id: 'oil-medium', type: 'oil', dose: 'medium', name: 'Summit oil', pack: '2 x 1 ml syringes', img: 'assets/img/oil-medium.webp', strength: 'Medium strength', status: 'soon', desc: 'Our medium strength joins after launch.' },
    // Everyday Ayurveda: no prescription needed. Claims kept to traditional use, as AYUSH advertising rules require.
    { id: 'ashwagandha', type: 'wellness', dose: 'none', rx: false, name: 'Ashwagandha tablets', pack: '60 tablets, 500 mg', img: 'assets/img/ashwagandha.webp', strength: 'Everyday Ayurveda', status: 'live',
      desc: 'Standardised Ashwagandha (Withania somnifera) root extract. A classical rasayana, traditionally used in Ayurveda to support calm, steady energy and restful sleep during busy weeks.',
      use: 'One tablet twice a day after meals with water or milk, or as directed by your physician.',
      caution: 'Not for use during pregnancy or breastfeeding. If you take thyroid, blood pressure or sleep medicines, check with your doctor first.' },
    { id: 'shilajit', type: 'wellness', dose: 'none', rx: false, name: 'Pure Himalayan Shilajit', pack: 'Resin, 20 g', img: 'assets/img/shilajit.webp', strength: 'Everyday Ayurveda', status: 'live',
      desc: 'Himalayan shilajit resin, purified by the classical Shodhana method and tested for heavy metals and fulvic acid in an NABL-accredited lab. Traditionally used in Ayurveda to support energy and stamina.',
      use: 'Dissolve a pea-sized portion (about 300 mg) in warm water or milk once a day after a meal.',
      caution: 'Not for children, or during pregnancy or breastfeeding. Stop if you feel unwell and speak to your doctor.' },
    { id: 'isabgol', type: 'wellness', dose: 'none', rx: false, name: 'Sat Isabgol', pack: 'Psyllium husk, 100 g', img: 'assets/img/isabgol.webp', strength: 'Everyday Ayurveda', status: 'live',
      desc: 'Premium, cleaned psyllium husk from Gujarat, with nothing added. A gentle natural fibre that supports regular, comfortable digestion.',
      use: 'Stir 1 to 2 teaspoons into a glass of water, milk or buttermilk and drink straight away. Drink another glass of water after it.',
      caution: 'Always take with plenty of water. Keep a 2-hour gap from other medicines.' },
    { id: 'moondays', type: 'wellness', dose: 'none', rx: false, name: 'Moon Days roll-on', pack: 'Roll-on, 10 ml', img: 'assets/img/moondays.webp', strength: 'For period days', status: 'live',
      desc: 'A warm, aromatic Ayurvedic roll-on with pudina, ajwain, clove and lavender oils. Made for a soothing massage on the lower abdomen and back on period days.',
      use: 'Roll gently over the lower abdomen and lower back, and massage in. Use 2 to 3 times a day.',
      caution: 'For external use only. Keep away from eyes and broken skin. Do a small patch test first.' }
  ];
  var STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka','Kerala','Ladakh','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Puducherry','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Chandigarh','Andaman and Nicobar Islands','Dadra and Nagar Haveli and Daman and Diu','Lakshadweep'];

  var byId = {}; P.forEach(function (p) { byId[p.id] = p; });
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('asanoha:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('asanoha:' + k, JSON.stringify(v)); } catch (e) {} }
  };
  var inr = function (n) { return '\u20B9' + Math.round(n).toLocaleString('en-IN'); };
  var track = (window.ASANOHA && window.ASANOHA.track) || function () {};

  var cart = store.get('bag', {}); if (!cart || typeof cart !== 'object' || Array.isArray(cart)) cart = {};
  Object.keys(cart).forEach(function (k) { if (!byId[k] || byId[k].status !== 'live' || !(cart[k] > 0)) delete cart[k]; });
  var wallet = store.get('noha', { balance: 0, txns: [] }); if (!wallet || typeof wallet.balance !== 'number') wallet = { balance: 0, txns: [] };
  var profile = store.get('profile', {}); if (!profile || typeof profile !== 'object') profile = {};
  var addresses = store.get('addresses', []); if (!Array.isArray(addresses)) addresses = [];
  var filter = 'all', query = '', useNoha = true, rxChoice = 'upload', afterAddress = null;

  /* ---------- helpers ---------- */
  function toast(t) {
    var el = $('#ash-toast'); if (!el) return; el.textContent = t; el.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('on'); }, 2400);
  }
  function hasRx() { return Object.keys(cart).some(function (k) { return byId[k] && byId[k].rx !== false; }); }
  function count() { return Object.keys(cart).reduce(function (a, k) { return a + cart[k]; }, 0); }
  function refreshSheetTiles() {
    var root = $('#ash-sheet-body'); if (!root) return;
    $$('.ash-p', root).forEach(function (card) {
      var img = $('[data-ash-pd]', card); var pid = img && img.getAttribute('data-ash-pd');
      var p = pid && byId[pid]; if (!p) return;
      var foot = $('.ash-foot', card); if (!foot) return;
      var price = $('.ash-price', foot);
      foot.innerHTML = (price ? price.outerHTML : '') + addBtn(p);
    });
  }
  function saveCart() {
    store.set('bag', cart);
    $$('.cart-count').forEach(function (e) { e.textContent = count(); });
    renderGrid(); renderPill(); refreshSheetTiles();
  }
  function defaultAddress() { return addresses.filter(function (a) { return a.id === profile.addressId; })[0] || addresses[0] || null; }
  function addrLine(a) { return [a.house, a.area, a.landmark ? 'Near ' + a.landmark : '', a.city, a.state + ' ' + a.pin].filter(Boolean).join(', '); }

  function sync() {
    var au = window.ASANOHA && window.ASANOHA.auth;
    if (au && au.user) au.push({ addresses: addresses, profile: profile, orders: store.get('orders2', []) }).catch(function (e) { console.error(e); });
  }

  /* ---------- theme: auto by default, changeable from the profile ---------- */
  var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
  function themePref() { var t = store.get('themePref', null); if (!t) { var o = store.get('theme', 'auto'); t = o; } return t === 'day' || t === 'night' ? t : 'auto'; }
  function applyThemePref(pref) {
    store.set('themePref', pref);
    var want = pref === 'auto' ? (mq && mq.matches ? 'night' : 'day') : pref;
    var now = document.documentElement.getAttribute('data-theme');
    var tb = document.getElementById('theme-btn');
    if (now !== want) { if (tb) tb.click(); else document.documentElement.setAttribute('data-theme', want); }
    store.set('theme', pref === 'auto' ? 'auto' : want);
  }
  if (mq && mq.addEventListener) mq.addEventListener('change', function () { if (themePref() === 'auto') applyThemePref('auto'); });

  /* ---------- product tiles ---------- */
  function addBtn(p) {
    if (p.status !== 'live') return '<button class="ash-add" disabled>Soon</button>';
    var q = cart[p.id] || 0;
    if (!q) return '<button class="ash-add" data-ash-add="' + p.id + '" aria-label="Add ' + esc(p.name) + '">ADD</button>';
    return '<div class="ash-step" role="group" aria-label="Quantity of ' + esc(p.name) + '"><button data-ash-dec="' + p.id + '" aria-label="Remove one">\u2212</button><span>' + q + '</span><button data-ash-add="' + p.id + '" aria-label="Add one">+</button></div>';
  }
  function tile(p) {
    return '<article class="ash-p"><button class="ash-img" data-ash-pd="' + p.id + '" aria-label="View ' + esc(p.name) + '"><img src="' + p.img + '" alt="" loading="lazy">' +
      (p.rx === false ? '<span class="ash-rx ayur">Ayurveda</span>' : '<span class="ash-rx">Rx</span>') + (p.status === 'soon' ? '<span class="ash-soon">Soon</span>' : '') + '</button>' +
      '<div class="ash-b"><span class="ash-pack">' + esc(p.pack) + '</span><span class="ash-n">' + esc(p.name) + '</span><span class="ash-dose ' + p.dose + '">' + esc(p.strength) + '</span>' +
      '<div class="ash-foot"><span class="ash-price"><span class="ash-blur" aria-hidden="true">\u20B98,888</span><span>at launch</span></span>' + addBtn(p) + '</div></div></article>';
  }
  function filtered() {
    return P.filter(function (p) {
      var f = filter === 'all' || p.type === filter || p.dose === filter;
      var q = !query || (p.name + ' ' + p.type + ' ' + p.strength + ' ' + p.pack).toLowerCase().indexOf(query) > -1;
      return f && q;
    });
  }
  function renderGrid() {
    var g = $('#ash-grid'); if (!g) return;
    var l = filtered();
    g.innerHTML = l.map(tile).join('');
    var e = $('#ash-empty'); if (e) e.hidden = l.length > 0;
  }
  function renderPill() {
    var pill = $('#ash-pill'); if (!pill) return;
    var n = count(); pill.hidden = !n || document.body.classList.contains('ash-open');
    if (n) {
      var first = byId[Object.keys(cart)[0]];
      $('#ash-pill-th').innerHTML = '<img src="' + first.img + '" alt="">';
      $('#ash-pill-n').textContent = n + (n === 1 ? ' item' : ' items');
    }
  }
  /* ---------- location and delivery speed ---------- */
  var BLR = { lat: 12.9716, lng: 77.5946, km: 40 };
  var loc = store.get('loc', null);
  function isBlr(pin, city) { return /^560/.test(String(pin || '')) || /bengaluru|bangalore/i.test(String(city || '')); }
  function km(a, b, c, d) { var r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r, h = Math.sin(x / 2) * Math.sin(x / 2) + Math.cos(a * r) * Math.cos(c * r) * Math.sin(y / 2) * Math.sin(y / 2); return 12742 * Math.asin(Math.sqrt(h)); }
  function speed(l) { return l && l.quick ? { quick: true, label: '2-hour delivery', long: 'Quick delivery within 2 hours in Bengaluru, 9 am to 9 pm' } : { quick: false, label: 'Standard delivery', long: 'Standard delivery across India in 3 to 5 days' }; }
  function setLoc(l) {
    l.quick = isBlr(l.pin, l.city) || (l.lat && km(l.lat, l.lng, BLR.lat, BLR.lng) < BLR.km);
    loc = l; store.set('loc', l); paintChrome(); checkShiprocket(l);
    track('location_set', { quick: l.quick ? 1 : 0, source: l.source });
  }
  // Pincode to city/state (India Post open API). Falls back to the pincode alone.
  function lookupPin(pin) {
    return fetch('https://api.postalpincode.in/pincode/' + pin).then(function (r) { return r.json(); }).then(function (j) {
      var po = j && j[0] && j[0].PostOffice && j[0].PostOffice[0];
      if (!po) throw new Error('not found');
      return { pin: pin, area: po.Name, city: po.District, state: po.State };
    }).catch(function () { return { pin: pin, area: '', city: isBlr(pin) ? 'Bengaluru' : '', state: isBlr(pin) ? 'Karnataka' : '' }; });
  }
  // Current location: browser GPS, then a free reverse geocoder built for browsers.
  function useGeo() {
    return new Promise(function (res, rej) {
      if (!navigator.geolocation) return rej(new Error('Location is not available in this browser.'));
      navigator.geolocation.getCurrentPosition(function (pos) {
        var la = pos.coords.latitude, ln = pos.coords.longitude;
        fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + la + '&longitude=' + ln + '&localityLanguage=en')
          .then(function (r) { return r.json(); })
          .then(function (j) { res({ lat: la, lng: ln, pin: j.postcode || '', area: j.locality || '', city: j.city || j.locality || '', state: (j.principalSubdivision || '').replace(/^State of /, ''), source: 'gps' }); })
          .catch(function () { res({ lat: la, lng: ln, pin: '', area: '', city: '', state: '', source: 'gps' }); });
      }, function (e) { rej(new Error(e.code === 1 ? 'Location permission was denied. Enter your pincode instead.' : 'Could not get your location. Enter your pincode instead.')); }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
    });
  }
  // Optional: live courier check through our Shiprocket worker (set shiprocketApi in site.js).
  function checkShiprocket(l) {
    var api = CFG.shiprocketApi; if (!api || !l || !/^\d{6}$/.test(l.pin || '')) return;
    fetch(api.replace(/\/$/, '') + '/serviceability?pincode=' + l.pin + '&weight=0.3&cod=0').then(function (r) { return r.json(); }).then(function (j) {
      l.serviceable = j.serviceable !== false; l.etd = j.etd || ''; store.set('loc', l); paintChrome();
    }).catch(function () {});
  }
  function locLine() {
    if (!loc) return '';
    var sp = speed(loc), place = [loc.area, loc.city].filter(Boolean).join(', ') + (loc.pin ? ' ' + loc.pin : '');
    if (loc.serviceable === false) return '<span class="ash-speed no">Not deliverable yet</span> <span>' + esc(place) + '</span>';
    return '<span class="ash-speed' + (sp.quick ? ' quick' : '') + '">' + (sp.quick ? '\u26A1 ' : '') + sp.label + (!sp.quick && loc.etd ? ', by ' + esc(loc.etd) : '') + '</span> <span>' + esc(place || 'your location') + '</span>';
  }
  function locSheet() {
    open('<div class="ash-locsheet"><span class="ash-pin" aria-hidden="true"><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s7-6.2 7-12a7 7 0 10-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg></span>' +
      '<h2 class="ash-h">Where should we deliver?</h2><p class="ash-muted">Bengaluru gets <b>2-hour delivery</b>. Everywhere else in India, 3 to 5 days.</p></div>' +
      '<button class="ash-cta" data-ash-geo>Use my current location</button>' +
      '<form class="ash-form ash-pinrow" id="ash-pinform" novalidate><label>Or enter your pincode<span class="ash-inline"><input name="pin" inputmode="numeric" maxlength="6" autocomplete="postal-code" placeholder="560035" value="' + esc(loc && loc.pin || '') + '"><button class="ash-cta alt" type="submit">Check</button></span></label></form>' +
      '<p class="ash-err" id="ash-loc-err" role="alert"></p>' +
      '<button class="ash-link center" data-ash-close>Skip for now</button>', 'Delivery location');
  }
  function maybeAskLocation() {
    if (loc || store.get('locAsked', false)) return;
    var ask = function () { if (loc || document.body.classList.contains('ash-open')) return; store.set('locAsked', true); locSheet(); };
    var visible = function (id) { var el = document.getElementById(id); return el && !el.hidden && getComputedStyle(el).display !== 'none'; };
    // Wait until the 18+ gate and the analytics banner are out of the way.
    var tries = 0, wait = function () {
      if (loc) return;
      if (visible('gate') || visible('consent')) { if (tries++ < 600) setTimeout(wait, 500); return; }
      setTimeout(ask, 700);
    };
    setTimeout(wait, 800);
  }

  function paintChrome() {
    $$('.ash-coinbal').forEach(function (e) { e.textContent = inr(wallet.balance); });
    var a = defaultAddress(), el = $('#ash-deliver');
    if (el) el.innerHTML = a
      ? locLine() + '<span>Delivering to <b>' + esc(a.label) + '</b>: ' + esc(addrLine(a)) + '</span> <button data-ash-open="address" aria-label="Change or edit delivery address">Change</button>'
      : loc ? locLine() + ' <button data-ash-open="loc" aria-label="Change delivery location">Change</button>'
      : 'Delivering across India. <button data-ash-open="loc">Set your location</button>';
  }

  /* ---------- sheet ---------- */
  var lastFocus = null, lockedY = 0;
  // iOS Safari ignores plain overflow:hidden on the body while a fixed sheet is open, so the
  // page behind it can still drag-scroll and bounce. Actually pinning the body in place with
  // position:fixed stops that, and we restore the exact scroll position on close.
  function lockScroll() {
    lockedY = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = -lockedY + 'px';
    document.body.classList.add('ash-open');
  }
  function unlockScroll() {
    document.body.classList.remove('ash-open');
    document.body.style.top = '';
    window.scrollTo(0, lockedY);
  }
  function open(html, title) {
    lastFocus = document.activeElement;
    var sheet = $('#ash-sheet');
    sheet.innerHTML !== undefined && ($('#ash-sheet-body').innerHTML = html);
    sheet.setAttribute('aria-label', title || 'Details');
    sheet.scrollTop = 0;
    lockScroll();
    sheet.classList.add('on'); $('#ash-scrim').classList.add('on');
    renderPill();
    setTimeout(function () { var c = $('#ash-close'); if (c) c.focus(); }, 60);
  }
  function close() {
    $('#ash-sheet').classList.remove('on'); $('#ash-scrim').classList.remove('on');
    unlockScroll(); renderPill();
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }

  function pdSheet(id) {
    var p = byId[id]; if (!p) return;
    track('view_item', { item_id: p.id, item_name: p.name, dose: p.dose });
    var similar = P.filter(function (x) { return x.id !== id && x.status === 'live' && (p.rx === false ? x.rx === false : (x.type === p.type || x.dose === p.dose)); }).slice(0, 2);
    open('<div class="ash-pdimg"><img src="' + p.img + '" alt="' + esc(p.name) + '"></div>' +
      '<h2 class="ash-h">' + esc(p.name) + '</h2><p class="ash-dose ' + p.dose + '">' + esc(p.strength) + ', ' + esc(p.pack) + '</p>' +
      '<p class="ash-muted">' + esc(p.desc) + '</p>' +
      (p.rx === false
        ? '<div class="ash-box"><b>How to use</b><span>' + esc(p.use) + '</span></div><div class="ash-box"><b>Good to know</b><span>' + esc(p.caution) + ' No prescription needed.</span></div>'
        : '<div class="ash-box"><b>Prescription medicine</b><span>Get a free practitioner consult after you order, or upload your prescription at checkout. Each pack is for the prescribed person only.</span></div>') +
      '<div class="ash-box"><b>Tested every batch</b><span>Certificate of Analysis for your batch is available on request.</span></div>' +
      '<div class="ash-box"><b>10% back on your first order</b><span>As Noha Money, credited after delivery, to use on your next order.</span></div>' +
      (similar.length ? '<h3 class="ash-h3">Similar products</h3><div class="ash-grid two">' + similar.map(tile).join('') + '</div>' : '') +
      (p.status === 'live' ? '<button class="ash-cta" data-ash-add="' + p.id + '" data-ash-then="cart">Add to cart</button>'
        : '<button class="ash-cta alt" data-ash-open="noha">Get notified with Noha Money</button>'), p.name);
  }

  function cartSheet() {
    var ids = Object.keys(cart);
    if (!ids.length) {
      open('<h2 class="ash-h">Your cart</h2><p class="ash-empty">Your cart is empty. Add a product to get started.</p><button class="ash-cta" data-ash-close data-ash-goto="#shop">Browse products</button>', 'Cart');
      return;
    }
    var a = defaultAddress();
    open('<h2 class="ash-h">Your cart</h2>' +
      ids.map(function (k) { var p = byId[k]; return '<div class="ash-line"><span class="ash-th"><img src="' + p.img + '" alt=""></span><span class="ash-meta"><b>' + esc(p.name) + '</b><span>' + esc(p.pack) + '</span></span>' + addBtn(p) + '</div>'; }).join('') +
      '<div class="ash-box ash-addrbox"><div class="ash-row"><b>Delivery address</b><button class="ash-link" data-ash-open="address">' + (a ? 'Change' : 'Add') + '</button></div>' +
      (a ? '<span><b class="ash-tag">' + esc(a.label) + '</b> ' + esc(a.name) + ', ' + esc(a.phone) + '<br>' + esc(addrLine(a)) + '</span>' : '<span>Add an address so we can deliver your order.</span>') + '</div>' +
      (loc ? '<div class="ash-box"><b>' + speed(loc).label + '</b><span>' + speed(loc).long + (loc.etd && !loc.quick ? '. Estimated by ' + esc(loc.etd) : '') + '.' + (speed(loc).quick && hasRx() ? ' The 2 hours start once your prescription is checked.' : '') + '</span></div>' : '') +
      '<div class="ash-box ash-row"><span><b>Use Noha Money</b><span>Balance ' + inr(wallet.balance) + '. Cashback covers up to 15% of an order.</span></span><button class="ash-switch" role="switch" aria-checked="' + useNoha + '" id="ash-noha-sw" aria-label="Use Noha Money"></button></div>' +
      (hasRx() ? '<div class="ash-box"><b>Prescription</b><span>How would you like to share it?</span><div class="ash-chips" id="ash-rx">' +
      '<button class="ash-chip" aria-pressed="' + (rxChoice === 'upload') + '" data-ash-rx="upload">I have a prescription</button>' +
      '<button class="ash-chip" aria-pressed="' + (rxChoice === 'consult') + '" data-ash-rx="consult">Book a free consult</button></div></div>' : '') +
      '<div class="ash-box ash-form"><label>A line for your friend <span class="ash-opt">(optional)</span><textarea id="ash-line" maxlength="140" rows="2" placeholder="Friend since class 6. Still owes me a samosa.">' + esc(profile.friendLine || '') + '</textarea></label><label class="ash-check"><input type="checkbox" id="ash-line-ok"' + (profile.friendLineOk ? ' checked' : '') + '> Yes, you may print it on a tin, first name and city only.</label></div>' +
      '<label class="ash-check"><input type="checkbox" id="ash-18"> ' + (hasRx() ? 'I am 18+ and each prescription item is for my own use.' : 'I am 18+ and have read the usage and safety notes.') + '</label>' +
      '<p class="ash-muted small">Prices go live at launch. We confirm your total, Noha Money savings and a secure payment link on WhatsApp' + (hasRx() ? ' after checking your prescription.' : '.') + '</p>' +
      '<p class="ash-err" id="ash-err" role="alert"></p>' +
      '<button class="ash-cta" data-ash-place="wa">Send order on WhatsApp</button><button class="ash-cta alt" data-ash-place="mail">Send by email</button>', 'Cart');
  }

  function addressSheet(editId) {
    var list = addresses.map(function (a) {
      var on = (profile.addressId || (addresses[0] && addresses[0].id)) === a.id;
      return '<div class="ash-addr' + (on ? ' on' : '') + '"><button class="ash-addr-pick" data-ash-pick="' + a.id + '" aria-pressed="' + on + '">' +
        '<b class="ash-tag">' + esc(a.label) + '</b><span><b>' + esc(a.name) + '</b>, ' + esc(a.phone) + '<br>' + esc(addrLine(a)) + '</span></button>' +
        '<span class="ash-addr-actions"><button class="ash-link" data-ash-edit="' + a.id + '">Edit</button><button class="ash-link" data-ash-del="' + a.id + '">Delete</button></span></div>';
    }).join('');
    if (editId !== undefined || !addresses.length) { addressForm(editId); return; }
    open('<h2 class="ash-h">Your addresses</h2>' + list + '<button class="ash-cta alt" data-ash-newaddr>Add a new address</button>' +
      (afterAddress === 'cart' ? '<button class="ash-cta" data-ash-open="cart">Continue to cart</button>' : ''), 'Addresses');
  }
  function addressForm(editId) {
    var a = addresses.filter(function (x) { return x.id === editId; })[0] || { label: 'Home', name: profile.name || '', phone: profile.phone || '', pin: loc && loc.pin || '', city: loc && loc.city || '', state: loc && loc.state || '', area: loc && loc.area || '' };
    var lab = function (l) { return '<button type="button" class="ash-chip" aria-pressed="' + (a.label === l) + '" data-ash-label="' + l + '">' + l + '</button>'; };
    open('<h2 class="ash-h">' + (editId ? 'Edit address' : 'Add delivery address') + '</h2>' +
      '<button type="button" class="ash-geo" data-ash-geo-fill><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="7"/></svg>Use my current location</button>' +
      '<form id="ash-addr-form" class="ash-form" novalidate data-id="' + esc(editId || '') + '">' +
      '<div class="ash-chips" id="ash-labels">' + lab('Home') + lab('Work') + lab('Other') + '</div>' +
      '<div class="ash-two"><label>Full name<input name="name" autocomplete="name" value="' + esc(a.name) + '" required></label>' +
      '<label>Mobile number<input name="phone" inputmode="tel" autocomplete="tel" maxlength="14" value="' + esc(a.phone) + '" required></label></div>' +
      '<label>Flat, house no., building<input name="house" autocomplete="address-line1" value="' + esc(a.house) + '" required></label>' +
      '<label>Area, street, sector<input name="area" autocomplete="address-line2" value="' + esc(a.area) + '" required></label>' +
      '<label><span>Landmark <span class="ash-opt">(optional)</span></span><input name="landmark" value="' + esc(a.landmark) + '"></label>' +
      '<div class="ash-two"><label>Pincode<input name="pin" inputmode="numeric" maxlength="6" autocomplete="postal-code" value="' + esc(a.pin) + '" required></label>' +
      '<label>City<input name="city" autocomplete="address-level2" value="' + esc(a.city) + '" required></label></div>' +
      '<label>State<select name="state" required><option value="">Choose a state</option>' + STATES.map(function (s) { return '<option' + (a.state === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label>' +
      '<label class="ash-check"><input type="checkbox" name="def"' + (!addresses.length || profile.addressId === a.id ? ' checked' : '') + '> Make this my default address</label>' +
      '<p class="ash-err" id="ash-addr-err" role="alert"></p>' +
      '<button class="ash-cta" type="submit">Save address</button>' + (addresses.length ? '<button type="button" class="ash-cta alt" data-ash-open="address">Back to addresses</button>' : '') +
      '</form>', 'Address');
    $('#ash-addr-form').dataset.label = a.label;
  }
  function saveAddress(f) {
    var v = function (n) { return (f.elements[n].value || '').trim(); };
    var phone = v('phone').replace(/\D/g, '').slice(-10), pin = v('pin');
    var err = [];
    if (!v('name')) err.push('your name');
    if (!/^[6-9]\d{9}$/.test(phone)) err.push('a 10-digit mobile number');
    if (!v('house') || !v('area')) err.push('your flat and area');
    if (!/^[1-9]\d{5}$/.test(pin)) err.push('a 6-digit pincode');
    if (!v('city')) err.push('your city');
    if (!v('state')) err.push('your state');
    if (err.length) { $('#ash-addr-err').textContent = 'Please add ' + err.join(', ') + '.'; return; }
    var id = f.dataset.id || ('a' + Date.now().toString(36));
    var rec = { id: id, label: f.dataset.label || 'Home', name: v('name'), phone: phone, house: v('house'), area: v('area'), landmark: v('landmark'), pin: pin, city: v('city'), state: v('state') };
    var i = addresses.map(function (a) { return a.id; }).indexOf(id);
    if (i > -1) addresses[i] = rec; else addresses.push(rec);
    if (f.elements.def.checked || addresses.length === 1) profile.addressId = id;
    if (!profile.name) profile.name = rec.name; if (!profile.phone) profile.phone = rec.phone;
    store.set('addresses', addresses); store.set('profile', profile);
    if (profile.addressId === id) setLoc({ pin: rec.pin, area: rec.area.split(',')[0], city: rec.city, state: rec.state, source: 'address' });
    paintChrome(); sync();
    toast('Address saved');
    if (afterAddress === 'cart') { afterAddress = null; cartSheet(); } else addressSheet();
  }

  var NOHA_ICONS = {"gift": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><rect x=\"10\" y=\"26\" width=\"44\" height=\"30\" rx=\"6\" fill=\"#A84B27\"/><rect x=\"6\" y=\"18\" width=\"52\" height=\"12\" rx=\"4\" fill=\"#C25A31\"/><rect x=\"29\" y=\"18\" width=\"6\" height=\"38\" fill=\"#F0C987\"/><path d=\"M32 18c-6-10-16-8-14-2 2 4 10 3 14 2zm0 0c6-10 16-8 14-2-2 4-10 3-14 2z\" fill=\"#F0C987\"/><circle cx=\"48\" cy=\"46\" r=\"11\" fill=\"#F4EEE3\" stroke=\"#1E2624\" stroke-width=\"2\"/><text x=\"48\" y=\"50\" text-anchor=\"middle\" font-family=\"Manrope\" font-weight=\"800\" font-size=\"10\" fill=\"#1E2624\">10%</text></svg>", "tap": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><rect x=\"18\" y=\"6\" width=\"28\" height=\"50\" rx=\"6\" fill=\"#1E2624\"/><rect x=\"21\" y=\"11\" width=\"22\" height=\"36\" rx=\"3\" fill=\"#F0C987\"/><circle cx=\"32\" cy=\"29\" r=\"7\" fill=\"#A84B27\"/><path d=\"M29 29l2 2 4-4\" stroke=\"#F4EEE3\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\"/><path d=\"M44 40c3-1 6 1 6 4v8c0 4-3 6-6 6h-5l-6-7c-1-2 1-4 3-3l3 2V36c0-2 3-2 3 0z\" fill=\"#E7B28E\" stroke=\"#1E2624\" stroke-width=\"1.5\"/></svg>", "refund": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><circle cx=\"32\" cy=\"32\" r=\"22\" fill=\"#3F6B66\"/><path d=\"M20 30a12 12 0 1 1 3 11\" fill=\"none\" stroke=\"#F4EEE3\" stroke-width=\"3.5\" stroke-linecap=\"round\"/><path d=\"M14 28l6 4 4-6\" fill=\"none\" stroke=\"#F4EEE3\" stroke-width=\"3.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><text x=\"33\" y=\"37\" text-anchor=\"middle\" font-family=\"Manrope\" font-weight=\"800\" font-size=\"14\" fill=\"#F0C987\">\u20b9</text></svg>", "coins": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><ellipse cx=\"26\" cy=\"46\" rx=\"16\" ry=\"6\" fill=\"#B8872E\"/><rect x=\"10\" y=\"36\" width=\"32\" height=\"10\" fill=\"#C9962B\"/><ellipse cx=\"26\" cy=\"36\" rx=\"16\" ry=\"6\" fill=\"#F0C987\"/><ellipse cx=\"26\" cy=\"30\" rx=\"16\" ry=\"6\" fill=\"#B8872E\"/><rect x=\"10\" y=\"22\" width=\"32\" height=\"8\" fill=\"#C9962B\"/><ellipse cx=\"26\" cy=\"22\" rx=\"16\" ry=\"6\" fill=\"#F0C987\"/><circle cx=\"48\" cy=\"18\" r=\"10\" fill=\"#A84B27\"/><path d=\"M48 13v10M43 18h10\" stroke=\"#F4EEE3\" stroke-width=\"3\" stroke-linecap=\"round\"/></svg>", "friends": "<svg viewBox=\"0 0 64 64\" aria-hidden=\"true\"><circle cx=\"22\" cy=\"24\" r=\"10\" fill=\"#C98B62\" stroke=\"#1E2624\" stroke-width=\"2\"/><path d=\"M13 20l3-9 3 6 3-8 3 7 3-5 1 9\" fill=\"#1E2624\"/><path d=\"M8 56c0-10 6-16 14-16s14 6 14 16z\" fill=\"#A84B27\"/><path d=\"M33 26c0-10 18-10 18 0v14h-18z\" fill=\"#1E2624\"/><circle cx=\"42\" cy=\"27\" r=\"7.5\" fill=\"#C98B62\" stroke=\"#1E2624\" stroke-width=\"1.5\"/><path d=\"M29 56c0-9 6-14 13-14s13 5 13 14z\" fill=\"#3F6B66\"/></svg>"};
  function refCode() {
    var c = store.get('refCode', '');
    if (!c) { var base = ((profile.name || 'FRIEND').split(' ')[0] || 'FRIEND').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || 'FRIEND'; c = base + Math.random().toString(36).slice(2, 5).toUpperCase(); store.set('refCode', c); }
    return c;
  }
  function refLink() { return location.origin + '/?ref=' + refCode(); }
  function nohaPerk(icon, title, text) { return '<div class="ash-nperk"><span class="ash-nimg">' + NOHA_ICONS[icon] + '</span><span><b>' + title + '</b><span>' + text + '</span></span></div>'; }
  function nohaSheet() {
    var tx = wallet.txns.length ? wallet.txns.slice().reverse().map(function (t) {
      return '<div class="ash-line"><span class="ash-meta"><b>' + esc(t.note) + '</b><span>' + esc(t.date) + '</span></span><b>' + (t.amt >= 0 ? '+' : '\u2212') + inr(Math.abs(t.amt)) + '</b></div>';
    }).join('') : '<p class="ash-muted">No activity yet.</p>';
    open('<div class="ash-nhead"><span class="ash-coin big" aria-hidden="true"></span><h2 class="ash-nlogo">asanoha<b>NOHA MONEY</b></h2>' +
      '<div class="ash-nbal"><span>Balance</span><b>' + inr(wallet.balance) + '</b></div></div>' +
      nohaPerk('gift', '10% back on your first order', 'Credited to Noha Money after delivery. Valid for 12 months.') +
      nohaPerk('tap', 'One-tap checkout', 'Pay from your balance without waiting for OTPs.') +
      nohaPerk('refund', 'Instant refunds', 'Cancelled after verification? The amount comes back here straight away.') +
      nohaPerk('coins', 'Top-up bonus', 'Add \u20B92,000, get \u20B9100 extra. Add \u20B95,000, get \u20B9350 extra.') +
      '<div class="ash-refer"><div class="ash-refer-top"><span class="ash-nimg big">' + NOHA_ICONS.friends + '</span><span><b>Refer a friend, earn 5%</b><span>When your friend\u2019s first order is above \u20B95,000, you get 5% of the amount above \u20B95,000 as Noha Money.</span></span></div>' +
      '<div class="ash-refcode"><span>Your code</span><b>' + esc(refCode()) + '</b><button class="ash-link" data-ash-copyref>Copy link</button></div>' +
      '<button class="ash-cta" data-ash-shareref>Share on WhatsApp</button>' +
      '<p class="ash-muted small">Example: their first order is \u20B98,000. You earn 5% of \u20B93,000, which is \u20B9150.</p></div>' +
      '<div class="ash-addmoney"><h3 class="ash-h3">Add money</h3><div class="ash-seg" role="tablist"><button role="tab" aria-selected="true" data-ash-seg="once">Add once</button><button role="tab" aria-selected="false" data-ash-seg="auto">Auto add</button></div>' +
      '<p class="ash-muted small center" id="ash-seg-note">Enter amount to add</p><div class="ash-amt" id="ash-amt">\u20B92,000</div>' +
      '<div class="ash-chips center" id="ash-amts"><button class="ash-chip" aria-pressed="false" data-ash-amt="1000">\u20B91,000</button><button class="ash-chip" aria-pressed="true" data-ash-amt="2000">\u20B92,000</button><button class="ash-chip" aria-pressed="false" data-ash-amt="5000">\u20B95,000</button></div>' +
      '<button class="ash-cta" data-ash-topup>Add \u20B92,000</button></div>' +
      '<h3 class="ash-h3">Claim \u20B9100 at launch</h3><p class="ash-muted">Leave your email and we add \u20B9100 to your Noha Money on launch day.</p>' +
      '<form id="ash-claim" class="ash-form" novalidate><input type="email" name="email" placeholder="you@email.com" autocomplete="email" aria-label="Email address" value="' + esc(profile.email || '') + '"><input type="text" name="website" tabindex="-1" autocomplete="off" class="ash-hp" aria-hidden="true"><button class="ash-cta alt" type="submit">Claim \u20B9100</button><p class="ash-muted" id="ash-claim-msg" role="status"></p></form>' +
      '<h3 class="ash-h3">Activity</h3>' + tx +
      '<ul class="ash-notes"><li>Noha Money is usable only on Asanoha and is valid for 12 months from the date it is added.</li><li>Cashback can pay up to 15% of an order. Money you add can pay for the full order.</li><li>It cannot be transferred to a bank account or another person, as per RBI rules for closed-system payment instruments.</li><li>Referral rewards are credited after your friend\u2019s first order is delivered and not returned.</li></ul>', 'Noha Money');
  }

  function profileSheet() {
    var orders = store.get('orders2', []);
    var a = defaultAddress();
    var au = window.ASANOHA && window.ASANOHA.auth, u = au && au.user;
    var pref = themePref();
    var n = count();
    var acct = u
      ? '<div class="ash-user">' + (u.photo ? '<img src="' + esc(u.photo) + '" alt="" referrerpolicy="no-referrer">' : '<span class="ash-ini">' + esc((u.name || u.email || '?')[0]) + '</span>') +
        '<span><b>' + esc(u.name || 'Your account') + '</b><span>' + esc(u.email) + '</span></span><button class="ash-link" data-ash-signout>Sign out</button></div>'
      : '<div class="ash-box"><b>Sign in to save your details</b><span>Keep your addresses, orders and Noha Money on every device.</span>' +
        (au && au.available ? '<button class="ash-google" data-ash-signin><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.4 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.3.8-4.7l-7.8-6C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.2-13.5-9.9l-7.8 6C6.6 42.6 14.6 48 24 48z"/></svg>Continue with Google</button>'
          : '<span class="ash-muted small">' + (!au ? 'Google sign-in works on asanoha.co.in. Your details are saved on this device meanwhile.' : !au.ready ? 'Loading sign-in\u2026' : 'Google sign-in couldn\u2019t load here. Open asanoha.co.in in your browser and try again. Your details are saved on this device meanwhile.') + '</span>') + '</div>';
    var menu = $$('#nav a').map(function (l) { return '<a href="' + esc(l.getAttribute('href')) + '" data-ash-close>' + esc(l.textContent) + '<span aria-hidden="true">\u203A</span></a>'; }).join('');
    open('<h2 class="ash-h">Your account</h2>' + acct +
      '<div class="ash-tiles"><button data-ash-open="noha"><span class="ash-coin" aria-hidden="true"></span>Noha Money</button><button data-ash-open="address"><span aria-hidden="true">\uD83D\uDCCD</span>Addresses</button><a href="' + SUPPORT + '" data-ash-close><span aria-hidden="true">\uD83D\uDCAC</span>Support</a></div>' +
      '<div class="ash-box"><b>Delivery address</b><span>' + (a ? '<b class="ash-tag">' + esc(a.label) + '</b> ' + esc(a.name) + ', ' + esc(a.phone) + '<br>' + esc(addrLine(a)) : 'No address saved yet.') + '</span><button class="ash-link" data-ash-open="address">' + (a ? 'Edit or change' : 'Add address') + '</button></div>' +
      '<div class="ash-box"><b>Appearance</b><span>Automatic follows your phone or computer setting.</span><div class="ash-chips" id="ash-theme">' +
      ['auto', 'day', 'night'].map(function (t) { return '<button class="ash-chip" aria-pressed="' + (pref === t) + '" data-ash-theme="' + t + '">' + ({ auto: 'Automatic', day: 'Day', night: 'Night' })[t] + '</button>'; }).join('') + '</div></div>' +
      '<div class="ash-bday"><span aria-hidden="true">\uD83C\uDF82</span><span><b>' + (profile.bday ? 'Birthday saved' : 'Add your birthday') + '</b><span>Get \u20B9150 Noha Money every birthday.</span></span>' + (profile.bday ? '' : '<button class="ash-add" data-ash-open="bday">Add</button>') + '</div>' +
      '<h3 class="ash-h3">Your orders</h3>' + (orders.length ? orders.slice().reverse().map(function (o) {
        return '<div class="ash-box"><b>' + esc(o.id) + '</b><span>' + esc(o.date) + ', ' + o.items.map(function (i) { return i.q + ' x ' + esc(byId[i.p] ? byId[i.p].name : i.p); }).join(', ') + '</span><button class="ash-link" data-ash-reorder="' + esc(o.id) + '">Order again</button></div>';
      }).join('') : '<p class="ash-muted">No orders yet. Orders you send show up here so you can reorder in one tap.</p>') +
      (menu ? '<div class="ash-menu"><h3 class="ash-h3">Menu</h3>' + menu + '</div>' : '') +
      '<a class="ash-cta alt" href="' + SUPPORT + '" data-ash-close>Contact support</a>', 'Account');
  }
  function bdaySheet() {
    open('<h2 class="ash-h">Add your birthday</h2><p class="ash-muted">We add \u20B9150 Noha Money every year on your birthday. It can\u2019t be changed later.</p>' +
      '<form id="ash-bday" class="ash-form"><label>Date of birth<input type="date" name="d" required max="' + new Date().toISOString().slice(0, 10) + '"></label><button class="ash-cta" type="submit">Save birthday</button></form>', 'Birthday');
  }
  function learnSheet() {
    open('<div class="ash-aware-sheet"><span class="ash-shield big" aria-hidden="true"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l7 3v5c0 5-3.2 8.5-7 10-3.8-1.5-7-5-7-10V6z"/><path d="M12 8v8M8 12h8"/></svg></span>' +
      '<h2 class="ash-h">Using Vijaya responsibly</h2><p class="ash-muted">A small choice today keeps it working for you tomorrow.</p></div>' +
      '<h3 class="ash-h3">What you can do</h3>' +
      [['Take it only when prescribed', 'Your practitioner decides if you need it, and at what strength.'],
       ['Start low, go slow', 'Gummies and tablets can take 30 minutes to 2 hours. Don\u2019t take more because nothing is happening yet.'],
       ['Skip alcohol and driving', 'Until you know how it affects you.'],
       ['Never share or store leftovers for others', 'Each pack is prescribed to one person. Keep it in the original pack, away from children.']
      ].map(function (x) { return '<div class="ash-perk tick"><b>' + x[0] + '</b><span>' + x[1] + '</span></div>'; }).join('') +
      '<button class="ash-cta" data-ash-close>Got it, thanks</button>', 'Using Vijaya responsibly');
  }

  /* ---------- The honest choice: detailed guides ---------- */
  var HONEST = {
    leaf: { t: 'Leaf only', s: 'The part of the plant decides what is legal and what you get.', p: [
      ['Only the leaf', 'We use extract from the Vijaya (cannabis) leaf. Never the flowering tops (ganja) and never the resin (charas).'],
      ['Why it matters', 'Indian law (the NDPS Act) prohibits flowers and resin but leaves the leaf out of that definition. Leaf-based Ayurvedic medicines are made under an AYUSH licence.'],
      ['What you will not find', 'No smokable product, no flower, no resin, no synthetic cannabinoids.'],
      ['On the label', 'The words "Vijaya leaf extract" and the exact amount per gummy, ml or tablet.']] },
    spectrum: { t: 'Full spectrum', s: 'The whole leaf, not one isolated compound.', p: [
      ['What it means', 'A full spectrum extract keeps the natural range of compounds found in the leaf, instead of pulling out one on its own.'],
      ['How it is carried', 'Oils use MCT, a light coconut-based oil that flows well through a syringe. Gummies use a pectin base in kachcha aam and dark cocoa.'],
      ['Honest strength', 'Every pack states the extract per unit, for example 250 mg per tablet. No vague "potency" words.'],
      ['Pick with your practitioner', 'Low, medium and high strengths exist so your practitioner can start low and step up only if needed.']] },
    ayurveda: { t: 'Rooted in Ayurveda', s: 'Vijaya has been part of Ayurveda for centuries.', p: [
      ['An old name', 'Vijaya, meaning victory, is the Ayurvedic name for the cannabis leaf. Classical texts describe it in carefully prepared formulations.'],
      ['Used with care', 'Ayurveda always paired Vijaya with a vaidya\u2019s guidance, the right preparation and the right amount. We follow the same rule.'],
      ['A proprietary medicine', 'Our Vijaya products are Ayurvedic proprietary medicines under Schedule E(1), sold only on the prescription of a registered practitioner.'],
      ['Everyday Ayurveda too', 'Ashwagandha, Shilajit, Isabgol and Moon Days follow classical use and need no prescription.']] },
    ayush: { t: 'AYUSH licensed', s: 'Made and labelled the way the Ministry of AYUSH requires.', p: [
      ['Licensed manufacturing', 'Every product is made by an AYUSH-licensed manufacturer. The licence number is printed on the pack.'],
      ['Labelled properly', 'Schedule E(1) caution in English and Hindi, batch number, manufacturing and expiry dates, and the marketer\u2019s name.'],
      ['Prescription first', 'For Vijaya products, a registered practitioner must prescribe. No prescription? Book a free consult at checkout.'],
      ['Adults only', 'Sold only to adults 18+. Not for use during pregnancy or breastfeeding.']] },
    tested: { t: 'Tested every batch', s: 'Every batch comes with a Certificate of Analysis.', p: [
      ['What gets checked', 'Extract content, heavy metals, microbes and pesticides, tested in an accredited lab before the batch is released.'],
      ['Match your batch', 'The batch number on your pack matches the number on its Certificate of Analysis.'],
      ['Ask for it', 'Message us your batch number and we send the Certificate of Analysis for that exact batch.'],
      ['Read it easily', 'Our blog explains how to read a Certificate of Analysis in five minutes.']] },
    india: { t: 'Made in India', s: 'Made, packed and delivered from India.', p: [
      ['Made here', 'Made in India under an AYUSH licence and marketed by Asanoha Ayurveda LLP, Bangalore.'],
      ['Designed here', 'Our tins, syringes and friendship papers are designed by our team in Bengaluru.'],
      ['Delivered fast', 'Quick delivery within 2 hours in Bengaluru, and 3 to 5 days everywhere else in India.'],
      ['Plain packaging', 'Every order ships sealed and plain, and an adult signs for it.']] },
    'step-pick': { t: 'Pick your pair', s: 'Choose what your practitioner is likely to prescribe, or something from everyday Ayurveda.', p: [
      ['Browse the range', 'Gummies, oil and tablets in low and high strength, plus Ashwagandha, Shilajit, Isabgol and Moon Days.'],
      ['Not sure which?', 'Most people start with a low strength. Your practitioner confirms or changes it after reading your history.'],
      ['Add a line for a friend', 'Optional. With your yes, one line per batch is printed on our tins, first name and city only.'],
      ['Nothing to pay yet', 'Prices go live at launch. You send the order first, we confirm the total after checking.']] },
    'step-rx': { t: 'Share a prescription', s: 'Vijaya products need a prescription from a registered AYUSH practitioner.', p: [
      ['Already have one?', 'Attach a photo or PDF in the WhatsApp chat or email that opens when you send your order.'],
      ['No prescription yet?', 'Choose \u201cBook a free consult\u201d at checkout. We set up an online consultation with a registered practitioner.'],
      ['Everyday Ayurveda', 'Ashwagandha, Shilajit, Isabgol and Moon Days need no prescription.'],
      ['Private by default', 'Your prescription stays in your chat or email with us. It is never stored on the website.']] },
    'step-pay': { t: 'We verify, you pay', s: 'Nothing is charged before a prescription is checked.', p: [
      ['We check first', 'Our team reads the prescription and confirms the product and strength match it.'],
      ['Your total, clearly', 'We send the final price, delivery charge and any Noha Money savings on WhatsApp or email.'],
      ['Secure payment link', 'Pay by UPI, card or net banking through a secure link. No card details on our site.'],
      ['Changed your mind?', 'Cancel before dispatch at no cost. If you paid, the refund lands in Noha Money straight away.']] },
    'step-deliver': { t: 'It arrives', s: 'Fast in Bengaluru, reliable everywhere else.', p: [
      ['Bengaluru in 2 hours', 'Quick delivery within 2 hours, 9 am to 9 pm, once your prescription is checked.'],
      ['Rest of India in 3 to 5 days', 'Shipped with a tracked courier. You get the tracking link on WhatsApp.'],
      ['Plain and sealed', 'No brand-heavy outer box. An adult signs for the parcel.'],
      ['10% back', 'Your first order earns 10% Noha Money after delivery, to use next time.']] },
    how: { t: 'How ordering works', s: 'Four steps from curious to delivered.', p: [
      ['1. Pick what you need', 'Choose gummies, oil, tablets or everyday Ayurveda in the range.'],
      ['2. Share a prescription', 'For Vijaya products, upload one from a registered practitioner or book a free online consult at checkout.'],
      ['3. We verify, you pay', 'We check the prescription and send your price, Noha Money savings and a secure payment link.'],
      ['4. It arrives', 'Sealed, plain packaging with tracking: 2 hours in Bengaluru, 3 to 5 days elsewhere.']] }
  };
  function honestSheet(key) {
    var h = HONEST[key]; if (!h) return;
    track('honest_view', { topic: key });
    open('<div class="ash-aware-sheet"><span class="ash-shield big" aria-hidden="true"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l7 3v5c0 5-3.2 8.5-7 10-3.8-1.5-7-5-7-10V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/></svg></span>' +
      '<h2 class="ash-h">' + esc(h.t) + '</h2><p class="ash-muted">' + esc(h.s) + '</p></div>' +
      '<h3 class="ash-h3">What it means for you</h3>' +
      h.p.map(function (x) { return '<div class="ash-perk tick"><b>' + esc(x[0]) + '</b><span>' + esc(x[1]) + '</span></div>'; }).join('') +
      '<a class="ash-cta alt" href="story.html">Read our story</a><button class="ash-cta" data-ash-close>Got it, thanks</button>', h.t);
  }

  /* ---------- order ---------- */
  function place(via) {
    var a = defaultAddress(), err = $('#ash-err');
    if (!a) { afterAddress = 'cart'; addressSheet(); return; }
    if (!$('#ash-18').checked) { err.textContent = hasRx() ? 'Please confirm you are 18+ and the prescription items are for your own use.' : 'Please confirm you are 18+.'; return; }
    var line = ($('#ash-line') && $('#ash-line').value.trim()) || '', lineOk = !!($('#ash-line-ok') && $('#ash-line-ok').checked);
    profile.friendLine = line; profile.friendLineOk = lineOk; store.set('profile', profile);
    var id = 'ASN-' + Date.now().toString(36).toUpperCase().slice(-6);
    var items = Object.keys(cart).map(function (k) { return { p: k, q: cart[k] }; });
    var text = 'Hi Asanoha, new order ' + id + '\n\n' + items.map(function (i) { return '\u2022 ' + byId[i.p].name + ' (' + byId[i.p].pack + ') x ' + i.q; }).join('\n') +
      '\n\nUse Noha Money: ' + (useNoha ? 'Yes (balance ' + inr(wallet.balance) + ')' : 'No') +
      (hasRx() ? '\nPrescription: ' + (rxChoice === 'consult' ? 'Please book a free consultation for me' : 'I will attach it in this chat') : '') +
      (store.get('refBy', '') && !store.get('orders2', []).length ? '\nReferred by: ' + store.get('refBy', '') : '') +
      (line ? '\nLine for my friend: "' + line + '"' + (lineOk ? ' (OK to print, first name and city)' : ' (do not print)') : '') +
      '\nDelivery: ' + (loc && loc.quick ? 'Quick, 2 hours (Bengaluru)' : 'Standard, 3 to 5 days') +
      '\n\nDeliver to (' + a.label + '):\n' + a.name + ', ' + a.phone + '\n' + addrLine(a) +
      '\n\nI confirm I am 18+' + (hasRx() ? ' and each prescription item is for my own use' : '') + '. Please confirm the price and send a payment link.';
    var orders = store.get('orders2', []);
    orders.push({ id: id, date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), items: items, addressId: a.id });
    store.set('orders2', orders); sync();
    track('generate_lead', { order_id: id, items: items.length, rx: rxChoice });
    cart = {}; saveCart(); close();
    if (via === 'wa') window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    else location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('New order ' + id) + '&body=' + encodeURIComponent(text);
    toast('Order ' + id + ' is ready to send');
  }

  /* ---------- chrome injected on every page ---------- */
  function mountChrome() {
    var actions = $('.top .actions'), cartBtn = $('.top .cart-btn');
    if (actions && cartBtn && !$('.ash-coinbtn')) {
      var coin = document.createElement('button'); coin.className = 'ash-coinbtn'; coin.setAttribute('data-ash-open', 'noha'); coin.setAttribute('aria-label', 'Noha Money');
      coin.innerHTML = '<span class="ash-coin" aria-hidden="true"></span><span class="ash-coinbal">\u20B90</span>';
      var me = document.createElement('button'); me.className = 'ash-mebtn'; me.setAttribute('data-ash-open', 'me'); me.setAttribute('aria-label', 'Your account');
      me.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>';
      actions.insertBefore(coin, cartBtn); actions.insertBefore(me, cartBtn);
    }
    var wrap = document.createElement('div');
    wrap.innerHTML = '<button class="ash-pill" id="ash-pill" hidden data-ash-open="cart"><span class="ash-pill-th" id="ash-pill-th"></span><span>View cart<small id="ash-pill-n">1 item</small></span><span class="ash-pill-go" aria-hidden="true">\u203A</span></button>' +
      '<div class="ash-scrim" id="ash-scrim"></div>' +
      '<div class="ash-sheet" id="ash-sheet" role="dialog" aria-modal="true" aria-label="Details"><div class="ash-grab" aria-hidden="true"></div><button class="ash-x" id="ash-close" data-ash-close aria-label="Close">\u00D7</button><div class="ash-sheet-body" id="ash-sheet-body"></div></div>' +
      '<div class="ash-toast" id="ash-toast" role="status" aria-live="polite"></div>' +
      '<button class="ash-top" id="ash-top" hidden><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>Back to top</button>';
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
  }

  /* ---------- events ---------- */
  // The header cart button opens this cart, not the old drawer.
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.top .cart-btn')) { e.preventDefault(); e.stopPropagation(); cartSheet(); }
  }, true);
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button, a'); if (!t) return;
    var d = t.dataset;
    if (t.id === 'ash-scrim') return;
    if (d.ashAdd) {
      var p = byId[d.ashAdd]; if (!p || p.status !== 'live') return;
      cart[p.id] = (cart[p.id] || 0) + 1; saveCart();
      track('add_to_cart', { item_id: p.id, item_name: p.name, quantity: 1 });
      if (d.ashThen === 'cart' || ($('#ash-sheet').classList.contains('on') && $('#ash-noha-sw'))) cartSheet(); else if ($('#ash-theme')) profileSheet(); else toast(p.name + ' added');
      return;
    }
    if (d.ashDec) { cart[d.ashDec]--; if (cart[d.ashDec] <= 0) delete cart[d.ashDec]; saveCart(); if ($('#ash-noha-sw')) cartSheet(); else if ($('#ash-theme')) profileSheet(); return; }
    if (d.ashPd) { pdSheet(d.ashPd); return; }
    if (d.ashOpen) {
      e.preventDefault();
      if (d.ashOpen === 'cart') cartSheet();
      else if (d.ashOpen === 'address') { if ($('#ash-noha-sw')) afterAddress = 'cart'; addressSheet(); }
      else if (d.ashOpen === 'noha') nohaSheet();
      else if (d.ashOpen === 'me') profileSheet();
      else if (d.ashOpen === 'bday') bdaySheet();
      else if (d.ashOpen === 'learn') learnSheet();
      else if (d.ashOpen === 'loc') locSheet();
      else if (d.ashOpen.indexOf('honest-') === 0) honestSheet(d.ashOpen.slice(7));
      return;
    }
    if (d.ashPick !== undefined) { profile.addressId = d.ashPick; store.set('profile', profile); paintChrome(); sync(); if (afterAddress === 'cart') { afterAddress = null; cartSheet(); } else addressSheet(); return; }
    if (d.ashEdit) { addressSheet(d.ashEdit); return; }
    if (d.ashDel) {
      if (!confirm('Delete this address?')) return;
      addresses = addresses.filter(function (a) { return a.id !== d.ashDel; });
      if (profile.addressId === d.ashDel) profile.addressId = addresses[0] ? addresses[0].id : '';
      store.set('addresses', addresses); store.set('profile', profile); paintChrome(); sync(); addressSheet(); return;
    }
    if (t.hasAttribute('data-ash-newaddr')) { addressForm(); return; }
    if (d.ashLabel) { $$('#ash-labels .ash-chip').forEach(function (c) { c.setAttribute('aria-pressed', c === t); }); $('#ash-addr-form').dataset.label = d.ashLabel; return; }
    if (t.id === 'ash-noha-sw') { useNoha = !useNoha; t.setAttribute('aria-checked', useNoha); return; }
    if (d.ashRx) { rxChoice = d.ashRx; $$('#ash-rx .ash-chip').forEach(function (c) { c.setAttribute('aria-pressed', c === t); }); return; }
    if (d.ashPlace) { place(d.ashPlace); return; }
    if (d.ashReorder) {
      var o = store.get('orders2', []).filter(function (x) { return x.id === d.ashReorder; })[0];
      if (o) { o.items.forEach(function (i) { if (byId[i.p] && byId[i.p].status === 'live') cart[i.p] = (cart[i.p] || 0) + i.q; }); saveCart(); cartSheet(); }
      return;
    }
    if (d.ashTheme) { applyThemePref(d.ashTheme); $$('#ash-theme .ash-chip').forEach(function (c) { c.setAttribute('aria-pressed', c === t); }); return; }
    if (t.hasAttribute('data-ash-signin')) { var au1 = window.ASANOHA.auth; au1.signIn().catch(function (er) { toast(er && er.code === 'auth/unauthorized-domain' ? 'Add this website to Firebase authorised domains.' : 'Sign-in was cancelled. Try again.'); }); return; }
    if (t.hasAttribute('data-ash-signout')) { window.ASANOHA.auth.signOut().then(function () { toast('Signed out'); profileSheet(); }); return; }
    if (t.hasAttribute('data-ash-goto-grid')) { var gg = $('#ash-grid'); if (gg) { var hh = $('.top') ? $('.top').getBoundingClientRect().height : 64; window.scrollTo({ top: gg.getBoundingClientRect().top + window.scrollY - hh - 60, behavior: 'smooth' }); } return; }
    if (t.hasAttribute('data-ash-geo')) {
      var eg = $('#ash-loc-err'); t.disabled = true; t.textContent = 'Finding you\u2026';
      useGeo().then(function (l) { setLoc(l); close(); toast(loc.quick ? '\u26A1 2-hour delivery available' : 'Standard delivery in 3 to 5 days'); })
        .catch(function (er) { if (eg) eg.textContent = er.message; t.disabled = false; t.textContent = 'Use my current location'; });
      return;
    }
    if (t.hasAttribute('data-ash-geo-fill')) {
      t.disabled = true;
      useGeo().then(function (l) {
        var f = $('#ash-addr-form'); if (!f) return;
        if (l.area && !f.area.value) f.area.value = l.area; if (l.pin) f.pin.value = l.pin; if (l.city) f.city.value = l.city;
        if (l.state) { var opt = Array.prototype.filter.call(f.state.options, function (o) { return o.text.toLowerCase() === l.state.toLowerCase(); })[0]; if (opt) f.state.value = opt.value; }
        t.textContent = 'Location added. Add your flat and street.';
      }).catch(function (er) { t.disabled = false; toast(er.message); });
      return;
    }
    if (t.id === 'ash-top') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (d.ashSeg) { $$('[data-ash-seg]').forEach(function (b) { b.setAttribute('aria-selected', b === t); }); $('#ash-seg-note').textContent = d.ashSeg === 'auto' ? 'Automatically add this amount when your balance goes below \u20B9300' : 'Enter amount to add'; return; }
    if (t.hasAttribute('data-ash-copyref')) { var lk = refLink(); (navigator.clipboard ? navigator.clipboard.writeText(lk) : Promise.reject()).then(function () { toast('Link copied'); }).catch(function () { prompt('Copy your link', lk); }); return; }
    if (t.hasAttribute('data-ash-shareref')) {
      var msg = 'I use Asanoha for Ayurveda made right. Use my code ' + refCode() + ' on your first order: ' + refLink();
      track('share', { method: 'referral' });
      if (navigator.share) navigator.share({ title: 'Asanoha', text: msg, url: refLink() }).catch(function () {}); else window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank', 'noopener');
      return;
    }
    if (d.ashAmt) { $$('#ash-amts .ash-chip').forEach(function (c) { c.setAttribute('aria-pressed', c === t); }); $('[data-ash-topup]').textContent = 'Add ' + inr(+d.ashAmt); if ($('#ash-amt')) $('#ash-amt').textContent = inr(+d.ashAmt); return; }
    if (t.hasAttribute('data-ash-topup')) { toast('Top-ups open with payments at launch. Claim your \u20B9100 below.'); return; }
    if (d.ashF) { filter = d.ashF; $$('[data-ash-f]').forEach(function (b) { b.setAttribute('aria-pressed', b === t); }); renderGrid(); return; }
    if (t.hasAttribute('data-ash-close')) {
      close();
      if (d.ashGoto) { var g = $(d.ashGoto); if (g) g.scrollIntoView({ behavior: 'smooth' }); }
    }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (f.id === 'ash-addr-form') { e.preventDefault(); saveAddress(f); }
    if (f.id === 'ash-bday') { e.preventDefault(); if (!f.d.value) return; profile.bday = f.d.value; store.set('profile', profile); sync(); toast('Birthday saved'); profileSheet(); }
    if (f.id === 'ash-claim') {
      e.preventDefault(); if (f.website.value) return;
      var em = f.email.value.trim(), msg = $('#ash-claim-msg');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) { msg.textContent = 'That email looks incomplete. Check it and try again.'; return; }
      var ok = function () { profile.email = em; store.set('profile', profile); msg.textContent = 'Done. \u20B9100 Noha Money will be waiting for ' + em + ' at launch.'; track('sign_up', { method: 'noha_claim' }); };
      if (window.ASANOHA && window.ASANOHA.subscribe) window.ASANOHA.subscribe(em, location.pathname + ' noha-claim').then(ok).catch(function () {
        location.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Noha Money \u20B9100 claim') + '&body=' + encodeURIComponent('Please add ' + em + ' to the Noha Money launch list.'); ok();
      });
    }
  });
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'ash-pinform') return;
    e.preventDefault();
    var pin = (e.target.pin.value || '').trim(), er = $('#ash-loc-err');
    if (!/^[1-9]\d{5}$/.test(pin)) { er.textContent = 'Enter a 6-digit pincode.'; return; }
    lookupPin(pin).then(function (l) { l.source = 'pincode'; setLoc(l); close(); toast(loc.quick ? '\u26A1 2-hour delivery available' : 'Standard delivery in 3 to 5 days'); });
  });
  // Pincode typed in the address form fills city and state.
  document.addEventListener('input', function (e) {
    var f = e.target.form; if (!f || f.id !== 'ash-addr-form' || e.target.name !== 'pin' || !/^[1-9]\d{5}$/.test(e.target.value)) return;
    lookupPin(e.target.value).then(function (l) {
      if (l.city && !f.city.value) f.city.value = l.city;
      if (l.state && !f.state.value) { var opt = Array.prototype.filter.call(f.state.options, function (o) { return o.text.toLowerCase() === l.state.toLowerCase(); })[0]; if (opt) f.state.value = opt.value; }
    });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#ash-sheet') && $('#ash-sheet').classList.contains('on')) close(); });
  document.addEventListener('input', function (e) { if (e.target.id === 'ash-q') { query = e.target.value.trim().toLowerCase(); renderGrid(); } });

  var minY = 1400;
  (function captureRef() {
    try { var r = new URLSearchParams(location.search).get('ref'); if (r && /^[A-Z0-9]{3,12}$/i.test(r) && r.toUpperCase() !== store.get('refCode', '') && !store.get('orders2', []).length) store.set('refBy', r.toUpperCase()); } catch (e) {}
  })();
  function init() {
    mountChrome();
    var ft = $('footer.site'); if (ft && !$('.ash-sign')) { var sg = document.createElement('p'); sg.className = 'ash-sign'; sg.setAttribute('aria-hidden', 'true'); sg.innerHTML = 'India\u2019s sabai sabai app <span>\u2665</span>'; ft.appendChild(sg); }
    // Back to top, like quick-commerce apps.
    var topBtn = $('#ash-top'), ticking = false, lastY = window.scrollY;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        // Show only when scrolling back up, well below where the visitor started.
        topBtn.hidden = !(y < lastY - 4 && y > minY);
        lastY = y; ticking = false;
      });
    }, { passive: true });
    // Phones opening the home page land straight on the range.
    if ($('#shop') && !location.hash && window.matchMedia && matchMedia('(max-width: 767px)').matches) {
      var landed = false; try { landed = sessionStorage.getItem('asanoha:landed'); sessionStorage.setItem('asanoha:landed', '1'); } catch (e) {}
      if (!landed) {
        // Let the hero animation play, then glide to the range. Any touch or scroll by the visitor cancels it.
        var cancelled = false, stop = function () { cancelled = true; };
        ['touchstart', 'wheel', 'keydown'].forEach(function (ev) { window.addEventListener(ev, stop, { once: true, passive: true }); });
        var glide = function () {
          if (cancelled || window.scrollY > 80 || document.body.classList.contains('ash-open')) return;
          var gate = document.getElementById('gate'); if (gate && !gate.hidden && getComputedStyle(gate).display !== 'none') { setTimeout(glide, 800); return; }
          var head = $('.top'), h = head ? head.getBoundingClientRect().height : 64;
          var anchor = $('#shop .section-head') || $('#shop');
          var y = anchor.getBoundingClientRect().top + window.scrollY - h - 12;
          minY = y + 1400;
          window.scrollTo({ top: y, behavior: 'smooth' });
        };
        window.addEventListener('load', function () { setTimeout(glide, 2600); });
      }
    }
    document.addEventListener('asanoha:auth', function () {
      addresses = store.get('addresses', []); if (!Array.isArray(addresses)) addresses = [];
      profile = store.get('profile', {}) || {};
      paintChrome();
      if ($('#ash-theme')) profileSheet();
    });
    $('#ash-scrim').addEventListener('click', close);
    renderGrid(); paintChrome(); saveCart(); if (loc) checkShiprocket(loc); maybeAskLocation();
    if (/[#&]cart\b/.test(location.hash)) cartSheet();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
