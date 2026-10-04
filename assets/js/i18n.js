/* Asanoha language support. English is written in the page. Other languages are applied on top from
   assets/js/i18n/<lang>.js, and only the chosen language is downloaded.
   Choice is stored as asanoha:lang and changed from the account sheet. Loads in <head>. */
(function () {
  'use strict';
  var LANGS = { en: 1, hi: 1, kn: 1, ta: 1, ml: 1, te: 1 };
  var FONTS = { hi: 'Noto+Sans+Devanagari', kn: 'Noto+Sans+Kannada', ta: 'Noto+Sans+Tamil', ml: 'Noto+Sans+Malayalam', te: 'Noto+Sans+Telugu' };
  var FACES = { hi: 'Noto Sans Devanagari', kn: 'Noto Sans Kannada', ta: 'Noto Sans Tamil', ml: 'Noto Sans Malayalam', te: 'Noto Sans Telugu' };
  var lang = 'en';
  try { lang = JSON.parse(localStorage.getItem('asanoha:lang')) || 'en'; } catch (e) {}
  if (!LANGS[lang]) lang = 'en';
  var root = document.documentElement;
  root.setAttribute('lang', lang + '-IN');
  window.ASANOHA_LANG = lang;
  window.ASANOHA_LANGS = [['en', 'English'], ['hi', 'हिन्दी'], ['kn', 'ಕನ್ನಡ'], ['ta', 'தமிழ்'], ['ml', 'മലയാളം'], ['te', 'తెలుగు']];
  window.ASANOHA_VOICE = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN', ta: 'ta-IN', ml: 'ml-IN', te: 'te-IN' }[lang];
  window.ASANOHA_T = function (s) { return s; };
  if (lang === 'en') return;

  var DICT = {}, HTML = {}, PAT = {};
  var clean = function (s) { return String(s).replace(/\s+/g, ' ').trim(); };
  var has = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
  var fill = function (t, v) { return t ? t.replace(/\{(\w)\}/g, function (_, k) { return v[k] != null ? v[k] : ''; }) : null; };
  // text with live values in it (names, counts, prices)
  var PATTERNS = [
    [/^Add (.+)$/, 'add', function (m) { return { x: T(m[1]) }; }],
    [/^View (.+)$/, 'view', function (m) { return { x: T(m[1]) }; }],
    [/^Quantity of (.+)$/, 'qty', function (m) { return { x: T(m[1]) }; }],
    [/^(.+) added$/, 'added', function (m) { return { x: T(m[1]) }; }],
    [/^Order (\S+) is ready to send$/, 'order', function (m) { return { x: m[1] }; }],
    [/^(\d+) items?$/, 'items', function (m) { return { n: m[1] }; }],
    [/^(\d+) products? for “(.+)”$/, 'results', function (m) { return { n: m[1], q: m[2] }; }],
    [/^Balance (₹[\d,]+)\. Cashback covers up to 15% of an order\.$/, 'balance', function (m) { return { x: m[1] }; }],
    [/^⚡ (.+) available$/, 'avail', function (m) { return { x: T(m[1]) }; }],
    [/^By (.+)$/, 'by', function (m) { return { x: m[1] }; }],
    [/^asanoha delivers to (.+)\. (.+)$/, 'to', function (m) { return { x: T(m[1]), y: T(m[2]) }; }],
    [/^asanoha delivery in (.+)\. (.+)$/, 'in', function (m) { return { x: T(m[1]), y: T(m[2]) }; }],
    [/^Sorry, we can’t deliver to (.+)\. (.+)$/, 'sorry', function (m) { return { x: T(m[1]), y: T(m[2]) }; }]
  ];
  function T(s) {
    if (s == null) return s;
    var k = clean(s);
    if (!k) return s;
    if (has(DICT, k)) return DICT[k];
    for (var i = 0; i < PATTERNS.length; i++) {
      var m = k.match(PATTERNS[i][0]);
      if (m && PAT[PATTERNS[i][1]]) return fill(PAT[PATTERNS[i][1]], PATTERNS[i][2](m));
    }
    // "High strength, 2 tins, 20 gummies" style lists: take the longest known run of parts each time
    if (k.indexOf(', ') > 0) {
      var parts = k.split(', '), out = [], p = 0;
      while (p < parts.length) {
        var hit = false;
        for (var j = parts.length; j > p; j--) {
          var seg = parts.slice(p, j).join(', ');
          if (has(DICT, seg)) { out.push(DICT[seg]); p = j; hit = true; break; }
        }
        if (!hit) { if (!/^[\d\s.,]+(mg|ml|g)?$/.test(parts[p])) return s; out.push(parts[p]); p++; }
      }
      return out.join(', ');
    }
    return s;
  }
  window.ASANOHA_T = T;

  root.classList.add('lang-' + lang, 'lang-in', 'i18n-wait');
  var face = FACES[lang];
  var fl = document.createElement('link'); fl.rel = 'stylesheet';
  fl.href = 'https://fonts.googleapis.com/css2?family=' + FONTS[lang] + ':wght@400;500;600;700;800' + (lang === 'hi' ? '&family=Tiro+Devanagari+Sanskrit' : '') + '&display=swap';
  document.head.appendChild(fl);
  var st = document.createElement('style');
  st.textContent = '.i18n-wait body{opacity:0}' +
    'html.lang-in body,html.lang-in button,html.lang-in input,html.lang-in select,html.lang-in textarea{font-family:Manrope,"' + face + '",sans-serif}' +
    (lang === 'hi'
      ? 'html.lang-hi h1,html.lang-hi h2,html.lang-hi h3,html.lang-hi .ash-h,html.lang-hi summary{font-family:"Tiro Devanagari Sanskrit","Noto Sans Devanagari",serif;line-height:1.3}'
      : 'html.lang-in h1,html.lang-in h2,html.lang-in h3,html.lang-in .ash-h,html.lang-in summary{font-family:Fraunces,"' + face + '",serif;line-height:1.35;letter-spacing:0}') +
    'html.lang-in .kicker{letter-spacing:.04em}' +
    (lang === 'hi' ? '' : 'html.lang-in [data-local]{font-family:"' + face + '",sans-serif}') +
    'html.lang-in .ash-appbar .ash-tabs button{font-size:12px}';
  document.head.appendChild(st);

  var SKIP = 'script,style,svg,noscript,code,pre,textarea,[translate="no"],.ash-dl-brand,.brand b';
  var ASKIP = 'script,style,noscript,[translate="no"]';
  var ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
  function textNode(n) {
    var p = n.parentElement; if (!p || p.closest(SKIP) || p.closest('[data-i18n]')) return;
    var v = n.nodeValue, k = clean(v); if (!k) return;
    var t = T(k); if (t === k) return;
    n.nodeValue = v.replace(/^(\s*)[\s\S]*?(\s*)$/, function (_, a, b) { return a + t + b; });
  }
  function attrs(el) {
    if (el.closest && el.closest(ASKIP)) return;
    for (var i = 0; i < ATTRS.length; i++) {
      var a = ATTRS[i], v = el.getAttribute && el.getAttribute(a);
      if (v) { var t = T(v); if (t !== v) el.setAttribute(a, t); }
    }
  }
  function whole(el) {
    if (!el.childElementCount || el.hasAttribute('data-i18n')) return;
    var k = clean(el.textContent);
    if (k.length < 400 && has(HTML, k)) { el.innerHTML = HTML[k]; el.setAttribute('data-i18n', '1'); }
  }
  function run(node) {
    if (!node) return;
    if (node.nodeType === 3) { textNode(node); return; }
    if (node.nodeType !== 1 || node.closest(ASKIP)) return;
    whole(node);
    var els = node.querySelectorAll('*'), i;
    for (i = 0; i < els.length; i++) whole(els[i]);
    attrs(node); for (i = 0; i < els.length; i++) attrs(els[i]);
    var w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT), n, list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(textNode);
  }
  var domReady = document.readyState !== 'loading', dataReady = false, started = false;
  function start() {
    if (started || !domReady || !dataReady) return;
    started = true;
    run(document.body);
    // lines that pair English with a local language now carry the chosen one
    var loc = document.querySelectorAll('[data-local]');
    for (var q = 0; q < loc.length; q++) loc[q].setAttribute('lang', lang);
    root.classList.remove('i18n-wait');
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        if (m.type === 'characterData') textNode(m.target);
        else if (m.type === 'attributes') attrs(m.target);
        else for (var i = 0; i < m.addedNodes.length; i++) run(m.addedNodes[i]);
      });
    }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  // each language file calls this with its dictionary
  window.ASANOHA_I18N_LOAD = function (d) {
    DICT = d.dict || {}; HTML = d.html || {}; PAT = d.patterns || {};
    window.ASANOHA_I18N_DATA = d;
    dataReady = true; start();
    try { document.dispatchEvent(new CustomEvent('asanoha:i18n', { detail: { lang: lang } })); } catch (e) {}
  };
  // a single-file build can ship the dictionaries inline instead of as separate files
  var pre = window.ASANOHA_I18N_PRELOAD && window.ASANOHA_I18N_PRELOAD[lang];
  if (pre) { window.ASANOHA_I18N_LOAD(pre); if (!domReady) document.addEventListener('DOMContentLoaded', function () { domReady = true; start(); }); return; }
  var me = document.currentScript && document.currentScript.src;
  var s = document.createElement('script');
  s.src = (me ? me.replace(/i18n\.js(\?.*)?$/, '') : 'assets/js/') + 'i18n/' + lang + '.js?v=2';
  s.onerror = function () { root.classList.remove('i18n-wait'); };
  document.head.appendChild(s);
  if (!domReady) document.addEventListener('DOMContentLoaded', function () { domReady = true; start(); });
  // never leave the page hidden, even on a slow network
  setTimeout(function () { root.classList.remove('i18n-wait'); }, 2500);
})();
