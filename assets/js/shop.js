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
  function saveCart() {
    store.set('bag', cart);
    $$('.cart-count').forEach(function (e) { e.textContent = count(); });
    renderGrid(); renderPill();
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
  function paintChrome() {
    $$('.ash-coinbal').forEach(function (e) { e.textContent = inr(wallet.balance); });
    var a = defaultAddress(), el = $('#ash-deliver');
    if (el) el.innerHTML = a ? '<span>Delivering to <b>' + esc(a.label) + '</b>: ' + esc(addrLine(a)) + '</span> <button data-ash-open="address" aria-label="Change or edit delivery address">Change</button>'
      : 'Delivering across India. <button data-ash-open="address">Add your address</button>';
  }

  /* ---------- sheet ---------- */
  var lastFocus = null;
  function open(html, title) {
    lastFocus = document.activeElement;
    $('#ash-sheet-body').innerHTML = html;
    $('#ash-sheet').setAttribute('aria-label', title || 'Details');
    document.body.classList.add('ash-open');
    $('#ash-sheet').classList.add('on'); $('#ash-scrim').classList.add('on');
    renderPill();
    setTimeout(function () { var c = $('#ash-close'); if (c) c.focus(); }, 60);
  }
  function close() {
    $('#ash-sheet').classList.remove('on'); $('#ash-scrim').classList.remove('on');
    document.body.classList.remove('ash-open'); renderPill();
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
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
      '<div class="ash-box"><b>Earn 10% Noha Money</b><span>Cashback lands after delivery and can be used on your next order.</span></div>' +
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
      '<div class="ash-box ash-row"><span><b>Use Noha Money</b><span>Balance ' + inr(wallet.balance) + '. Cashback covers up to 15% of an order.</span></span><button class="ash-switch" role="switch" aria-checked="' + useNoha + '" id="ash-noha-sw" aria-label="Use Noha Money"></button></div>' +
      (hasRx() ? '<div class="ash-box"><b>Prescription</b><span>How would you like to share it?</span><div class="ash-chips" id="ash-rx">' +
      '<button class="ash-chip" aria-pressed="' + (rxChoice === 'upload') + '" data-ash-rx="upload">I have a prescription</button>' +
      '<button class="ash-chip" aria-pressed="' + (rxChoice === 'consult') + '" data-ash-rx="consult">Book a free consult</button></div></div>' : '') +
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
    var a = addresses.filter(function (x) { return x.id === editId; })[0] || { label: 'Home', name: profile.name || '', phone: profile.phone || '' };
    var lab = function (l) { return '<button type="button" class="ash-chip" aria-pressed="' + (a.label === l) + '" data-ash-label="' + l + '">' + l + '</button>'; };
    open('<h2 class="ash-h">' + (editId ? 'Edit address' : 'Add delivery address') + '</h2>' +
      '<form id="ash-addr-form" class="ash-form" novalidate data-id="' + esc(editId || '') + '">' +
      '<div class="ash-chips" id="ash-labels">' + lab('Home') + lab('Work') + lab('Other') + '</div>' +
      '<div class="ash-two"><label>Full name<input name="name" autocomplete="name" value="' + esc(a.name) + '" required></label>' +
      '<label>Mobile number<input name="phone" inputmode="tel" autocomplete="tel" maxlength="14" value="' + esc(a.phone) + '" required></label></div>' +
      '<label>Flat, house no., building<input name="house" autocomplete="address-line1" value="' + esc(a.house) + '" required></label>' +
      '<label>Area, street, sector<input name="area" autocomplete="address-line2" value="' + esc(a.area) + '" required></label>' +
      '<label>Landmark <span class="ash-muted">(optional)</span><input name="landmark" value="' + esc(a.landmark) + '"></label>' +
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
    store.set('addresses', addresses); store.set('profile', profile); paintChrome(); sync();
    toast('Address saved');
    if (afterAddress === 'cart') { afterAddress = null; cartSheet(); } else addressSheet();
  }

  function nohaSheet() {
    var tx = wallet.txns.length ? wallet.txns.slice().reverse().map(function (t) {
      return '<div class="ash-line"><span class="ash-meta"><b>' + esc(t.note) + '</b><span>' + esc(t.date) + '</span></span><b>' + (t.amt >= 0 ? '+' : '\u2212') + inr(Math.abs(t.amt)) + '</b></div>';
    }).join('') : '<p class="ash-muted">No activity yet. Your first cashback lands after your first delivery.</p>';
    open('<div class="ash-wallet"><span class="ash-coin big" aria-hidden="true"></span><h2 class="ash-h">Noha Money</h2><div class="ash-bal">' + inr(wallet.balance) + '</div><span class="ash-muted">Your balance</span></div>' +
      '<div class="ash-perk"><b>10% back on every order</b><span>Credited after delivery. It is our only discount, and it stays valid for 12 months.</span></div>' +
      '<div class="ash-perk"><b>One-tap checkout</b><span>Pay from your balance without waiting for OTPs.</span></div>' +
      '<div class="ash-perk"><b>Instant refunds</b><span>If an order is cancelled after verification, the amount comes back here straight away.</span></div>' +
      '<div class="ash-perk"><b>Top-up bonus</b><span>Add \u20B92,000 and get \u20B9100 extra. Add \u20B95,000 and get \u20B9350 extra.</span></div>' +
      '<h3 class="ash-h3">Add money</h3><div class="ash-chips" id="ash-amts"><button class="ash-chip" aria-pressed="false" data-ash-amt="1000">\u20B91,000</button><button class="ash-chip" aria-pressed="true" data-ash-amt="2000">\u20B92,000 +\u20B9100</button><button class="ash-chip" aria-pressed="false" data-ash-amt="5000">\u20B95,000 +\u20B9350</button></div>' +
      '<button class="ash-cta" data-ash-topup>Add \u20B92,000</button>' +
      '<h3 class="ash-h3">Claim \u20B9100 at launch</h3><p class="ash-muted">Leave your email and we add \u20B9100 Noha Money to your account on launch day.</p>' +
      '<form id="ash-claim" class="ash-form" novalidate><input type="email" name="email" placeholder="you@email.com" autocomplete="email" aria-label="Email address" value="' + esc(profile.email || '') + '"><input type="text" name="website" tabindex="-1" autocomplete="off" class="ash-hp" aria-hidden="true"><button class="ash-cta alt" type="submit">Claim \u20B9100</button><p class="ash-muted" id="ash-claim-msg" role="status"></p></form>' +
      '<h3 class="ash-h3">Activity</h3>' + tx +
      '<ul class="ash-notes"><li>Usable only on Asanoha, valid for 12 months from the date it is added.</li><li>Cashback can pay up to 15% of an order. Money you add can pay for the full order.</li><li>Cannot be transferred to a bank account or another person, as per RBI rules for closed-system payment instruments.</li><li>Top-ups and cashback go live with payments at launch.</li></ul>', 'Noha Money');
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
          : '<span class="ash-muted small">' + (!au ? 'Loading sign-in\u2026' : !au.ready ? 'Loading sign-in\u2026' : 'Google sign-in couldn\u2019t load here. Open asanoha.co.in in your browser and try again. Your details are saved on this device meanwhile.') + '</span>') + '</div>';
    var cartBox = n
      ? '<div class="ash-box"><div class="ash-row"><b>Your cart</b><span class="ash-muted small" style="flex:0 0 auto">' + n + (n === 1 ? ' item' : ' items') + '</span></div>' +
        Object.keys(cart).map(function (k) { var p = byId[k]; return '<div class="ash-line"><span class="ash-th"><img src="' + p.img + '" alt=""></span><span class="ash-meta"><b>' + esc(p.name) + '</b><span>' + esc(p.pack) + '</span></span>' + addBtn(p) + '</div>'; }).join('') +
        '<button class="ash-cta" data-ash-open="cart">Go to checkout</button></div>'
      : '<div class="ash-box"><b>Your cart is empty</b><span>Add a product from the range to get started.</span><button class="ash-link" data-ash-close data-ash-goto="#shop">Browse the range</button></div>';
    var menu = $$('#nav a').map(function (l) { return '<a href="' + esc(l.getAttribute('href')) + '" data-ash-close>' + esc(l.textContent) + '<span aria-hidden="true">\u203A</span></a>'; }).join('');
    open('<h2 class="ash-h">Your account</h2>' + acct +
      '<div class="ash-tiles four"><button data-ash-open="cart"><span aria-hidden="true">\uD83D\uDECD\uFE0F</span>Cart' + (n ? ' (' + n + ')' : '') + '</button><button data-ash-open="noha"><span class="ash-coin" aria-hidden="true"></span>Noha Money</button><button data-ash-open="address"><span aria-hidden="true">\uD83D\uDCCD</span>Addresses</button><a href="' + SUPPORT + '" data-ash-close><span aria-hidden="true">\uD83D\uDCAC</span>Support</a></div>' +
      cartBox +
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

  /* ---------- order ---------- */
  function place(via) {
    var a = defaultAddress(), err = $('#ash-err');
    if (!a) { afterAddress = 'cart'; addressSheet(); return; }
    if (!$('#ash-18').checked) { err.textContent = hasRx() ? 'Please confirm you are 18+ and the prescription items are for your own use.' : 'Please confirm you are 18+.'; return; }
    var id = 'ASN-' + Date.now().toString(36).toUpperCase().slice(-6);
    var items = Object.keys(cart).map(function (k) { return { p: k, q: cart[k] }; });
    var text = 'Hi Asanoha, new order ' + id + '\n\n' + items.map(function (i) { return '\u2022 ' + byId[i.p].name + ' (' + byId[i.p].pack + ') x ' + i.q; }).join('\n') +
      '\n\nUse Noha Money: ' + (useNoha ? 'Yes (balance ' + inr(wallet.balance) + ')' : 'No') +
      (hasRx() ? '\nPrescription: ' + (rxChoice === 'consult' ? 'Please book a free consultation for me' : 'I will attach it in this chat') : '') +
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
    if (t.id === 'ash-top') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (d.ashAmt) { $$('#ash-amts .ash-chip').forEach(function (c) { c.setAttribute('aria-pressed', c === t); }); $('[data-ash-topup]').textContent = 'Add ' + inr(+d.ashAmt); return; }
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
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#ash-sheet') && $('#ash-sheet').classList.contains('on')) close(); });
  document.addEventListener('input', function (e) { if (e.target.id === 'ash-q') { query = e.target.value.trim().toLowerCase(); renderGrid(); } });

  function init() {
    mountChrome();
    // Back to top, like quick-commerce apps.
    var topBtn = $('#ash-top'), ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () { topBtn.hidden = window.scrollY < 900; ticking = false; });
    }, { passive: true });
    // Phones opening the home page land straight on the range.
    if ($('#shop') && !location.hash && window.matchMedia && matchMedia('(max-width: 767px)').matches) {
      var landed = false; try { landed = sessionStorage.getItem('asanoha:landed'); sessionStorage.setItem('asanoha:landed', '1'); } catch (e) {}
      if (!landed) {
        var go = function () {
          if (!(window.scrollY < 50 || go.first)) return; go.first = false;
          var head = $('.top'), h = head ? head.getBoundingClientRect().height : 64;
          var y = $('#shop').getBoundingClientRect().top + window.scrollY - h + 8;
          document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, y); document.documentElement.style.scrollBehavior = '';
        };
        go.first = true; setTimeout(go, 60);
        window.addEventListener('load', function () { go.first = true; go(); setTimeout(function () { go.first = true; go(); }, 400); });
      }
    }
    document.addEventListener('asanoha:auth', function () {
      addresses = store.get('addresses', []); if (!Array.isArray(addresses)) addresses = [];
      profile = store.get('profile', {}) || {};
      paintChrome();
      if ($('#ash-theme')) profileSheet();
    });
    $('#ash-scrim').addEventListener('click', close);
    renderGrid(); paintChrome(); saveCart();
    if (/[#&]cart\b/.test(location.hash)) cartSheet();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
