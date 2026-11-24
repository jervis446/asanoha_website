// Investor page translations. English in investors/index.html is the source.
//   node investors/i18n/build.mjs extract   writes i18n/source.json, every string to translate
//   node investors/i18n/build.mjs build     writes investors/<lang>/index.html from i18n/<lang>.json
// No dependencies. A "segment" is the outermost element that holds text of its own; its inner HTML
// (with inline tags such as <b> or <a>) is translated as one string. Elements with translate="no",
// <code>, <script> and <style> are left alone. Missing translations fall back to English.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(HERE, '..');
const SRC = path.join(DIR, 'index.html');
const ORIGIN = 'https://asanoha.co.in/investors/';

// code, native name, hreflang/html lang, og locale, dir, Google Fonts sans, serif
export const LANGS = [
  ['en', 'English', 'en-IN', 'en_IN', 'ltr'],
  ['hi', 'हिन्दी', 'hi-IN', 'hi_IN', 'ltr', 'Noto Sans Devanagari', 'Noto Serif Devanagari'],
  ['bn', 'বাংলা', 'bn-IN', 'bn_IN', 'ltr', 'Noto Sans Bengali', 'Noto Serif Bengali'],
  ['mr', 'मराठी', 'mr-IN', 'mr_IN', 'ltr', 'Noto Sans Devanagari', 'Noto Serif Devanagari'],
  ['te', 'తెలుగు', 'te-IN', 'te_IN', 'ltr', 'Noto Sans Telugu', 'Noto Serif Telugu'],
  ['ta', 'தமிழ்', 'ta-IN', 'ta_IN', 'ltr', 'Noto Sans Tamil', 'Noto Serif Tamil'],
  ['gu', 'ગુજરાતી', 'gu-IN', 'gu_IN', 'ltr', 'Noto Sans Gujarati', 'Noto Serif Gujarati'],
  ['kn', 'ಕನ್ನಡ', 'kn-IN', 'kn_IN', 'ltr', 'Noto Sans Kannada', 'Noto Serif Kannada'],
  ['ml', 'മലയാളം', 'ml-IN', 'ml_IN', 'ltr', 'Noto Sans Malayalam', 'Noto Serif Malayalam'],
  ['pa', 'ਪੰਜਾਬੀ', 'pa-IN', 'pa_IN', 'ltr', 'Noto Sans Gurmukhi', 'Noto Serif Gurmukhi'],
  ['zh', '简体中文', 'zh-Hans', 'zh_CN', 'ltr', 'Noto Sans SC', 'Noto Serif SC'],
  ['ja', '日本語', 'ja', 'ja_JP', 'ltr', 'Noto Sans JP', 'Noto Serif JP'],
  ['ar', 'العربية', 'ar', 'ar_AE', 'rtl', 'Noto Sans Arabic', 'Noto Naskh Arabic'],
  ['fr', 'Français', 'fr', 'fr_FR', 'ltr'],
  ['de', 'Deutsch', 'de', 'de_DE', 'ltr'],
  ['es', 'Español', 'es', 'es_ES', 'ltr'],
];

const VOID = new Set('area base br col embed hr img input link meta source track wbr'.split(' '));
const SKIP = new Set(['code', 'script', 'style', 'head']);
const ATTRS = ['aria-label', 'placeholder', 'title', 'alt'];
const HEAD_META = ['description', 'og:title', 'og:description', 'twitter:title', 'twitter:description'];
const clean = (s) => s.replace(/\s+/g, ' ').trim();
const hasWords = (s) => /\p{L}{2,}/u.test(s.replace(/&[a-z]+;|&#\d+;/g, ''));

function parse(html) {
  const re = /<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<\/([a-zA-Z][\w-]*)\s*>|<([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|[^<]+/g;
  const top = { tag: '#root', children: [], text: false };
  const stack = [top];
  let m;
  while ((m = re.exec(html))) {
    const cur = stack[stack.length - 1];
    const tok = m[0];
    if (tok.startsWith('<!--')) continue;
    if (/^<(script|style)\b/.test(tok)) { cur.children.push({ tag: tok.startsWith('<script') ? 'script' : 'style', children: [], skip: true }); continue; }
    if (m[1]) { // closing tag
      const name = m[1].toLowerCase();
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === name) { stack[i].closeStart = m.index; stack.length = i; break; }
      }
      continue;
    }
    if (m[2]) {
      const name = m[2].toLowerCase();
      const node = { tag: name, attrs: m[3] || '', start: m.index, openEnd: m.index + tok.length, children: [], text: false };
      cur.children.push(node);
      if (!VOID.has(name) && !/\/\s*$/.test(m[3] || '')) stack.push(node);
      continue;
    }
    if (hasWords(tok)) cur.text = true; // text with letters, not just numbers or symbols
  }
  return top;
}

function segments(html) {
  const out = [];
  (function walk(n) {
    for (const c of n.children) {
      if (c.skip || SKIP.has(c.tag) || /\btranslate="no"/.test(c.attrs || '')) continue;
      if (c.text && c.closeStart != null) { out.push([c.openEnd, c.closeStart]); continue; }
      walk(c);
    }
  })(parse(html));
  return out;
}

function bodyRange(html) {
  const a = html.indexOf('<body');
  return [html.indexOf('>', a) + 1, html.lastIndexOf('</body>')];
}

function collect(html) {
  const keys = new Set();
  const [b0, b1] = bodyRange(html);
  const body = html.slice(b0, b1);
  for (const [s, e] of segments(body)) { const k = clean(body.slice(s, e)); if (k) keys.add(k); }
  for (const m of body.matchAll(/\s(aria-label|placeholder|title|alt)="([^"]+)"/g)) if (hasWords(m[2])) keys.add(clean(m[2]));
  keys.add(clean(html.match(/<title>([\s\S]*?)<\/title>/)[1]));
  for (const k of HEAD_META) {
    const m = html.match(new RegExp(`<meta (?:name|property)="${k}" content="([^"]*)"`));
    if (m) keys.add(clean(m[1]));
  }
  return [...keys];
}

const jsStrings = () => [...fs.readFileSync(path.join(DIR, 'investors.js'), 'utf8').matchAll(/\bT\('((?:[^'\\]|\\.)*)'\)/g)].map((m) => m[1]);

function langBlocks(code) {
  const hreflang = LANGS.map(([c, , hl]) => `<link rel="alternate" hreflang="${hl}" href="${ORIGIN}${c === 'en' ? '' : c + '/'}">`)
    .concat(`<link rel="alternate" hreflang="x-default" href="${ORIGIN}">`)
    // the language menu shows every native name on every page: load only those letters of each script
    .concat(`<link href="https://fonts.googleapis.com/css2?${[...new Set(LANGS.map((l) => l[5]).filter(Boolean))].map((f) => 'family=' + f.replace(/ /g, '+')).join('&')}&text=${encodeURIComponent(LANGS.map((l) => l[1]).join(''))}&display=swap" rel="stylesheet">`)
    .join('\n');
  const items = LANGS.map(([c, name, hl]) =>
    `<li><a href="/investors/${c === 'en' ? '' : c + '/'}" hreflang="${hl}" lang="${hl}"${c === code ? ' aria-current="page"' : ''}>${name}</a></li>`).join('');
  return { hreflang, items };
}

function setBlock(html, name, inner) {
  const re = new RegExp(`(<!-- i18n:${name} -->)[\\s\\S]*?(<!-- /i18n:${name} -->)`);
  if (!re.test(html)) throw new Error(`marker i18n:${name} missing in index.html`);
  return html.replace(re, `$1\n${inner}\n$2`);
}

function translate(html, t, L) {
  const [code, , hl, locale, dir, sans, serif] = L;
  const tr = (s) => { const k = clean(s); return Object.prototype.hasOwnProperty.call(t, k) && t[k] ? t[k] : s; };
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const unesc = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
  let [b0, b1] = bodyRange(html);
  let body = html.slice(b0, b1);
  const segs = segments(body);
  for (let i = segs.length - 1; i >= 0; i--) {
    const [s, e] = segs[i];
    const k = clean(body.slice(s, e));
    if (t[k]) body = body.slice(0, s) + t[k] + body.slice(e);
  }
  body = body.replace(/(\s(?:aria-label|placeholder|title|alt)=")([^"]+)"/g, (_, a, v) => `${a}${esc(tr(unesc(v)))}"`);
  body = body.replace(/href="\/investors\/"/g, `href="/investors/${code}/"`).replace(/data-src="media\//g, 'data-src="../media/');
  let head = html.slice(0, b0);
  head = head.replace(/<html lang="[^"]*"/, `<html lang="${hl}" dir="${dir}"`)
    .replace(/<title>([\s\S]*?)<\/title>/, (_, x) => `<title>${tr(x)}</title>`)
    .replace(/(<meta (?:name|property)="(?:description|og:title|og:description|twitter:title|twitter:description)" content=")([^"]*)"/g, (_, a, v) => `${a}${esc(tr(unesc(v)))}"`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${ORIGIN}${code}/">`)
    .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${ORIGIN}${code}/"`)
    .replace(/(<meta property="og:locale" content=")[^"]*"/, `$1${locale}"`)
    .replace(/href="investors\.css/, 'href="../investors.css');
  head = head.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/, (_, a, json, c) => {
    const d = JSON.parse(json);
    for (const n of d['@graph']) {
      if (n['@type'] === 'WebPage') {
        n['@id'] = `${ORIGIN}${code}/#webpage`; n.url = `${ORIGIN}${code}/`; n.inLanguage = hl; n.name = tr(n.name);
      }
      if (n['@type'] === 'FAQPage') {
        n['@id'] = `${ORIGIN}${code}/#faq`; n.inLanguage = hl;
        for (const q of n.mainEntity) { q.name = tr(q.name); q.acceptedAnswer.text = tr(q.acceptedAnswer.text); }
      }
    }
    return a + JSON.stringify(d).replace(/</g, '\\u003c') + c;
  });
  if (sans) {
    const fam = [sans, serif].map((f) => 'family=' + f.replace(/ /g, '+') + ':wght@400;500').join('&');
    head = head.replace('</head>', `<link href="https://fonts.googleapis.com/css2?${fam}&display=swap" rel="stylesheet">
<style>:root{--sans:'Manrope','${sans}',system-ui,sans-serif;--serif:'Fraunces','${serif}',Georgia,serif}h1,h2,h3{letter-spacing:0;line-height:1.3}body{line-height:1.75}</style>
</head>`);
  }
  const js = {};
  for (const k of jsStrings()) if (t[k]) js[k] = t[k];
  const out = head + body + html.slice(b1);
  if (!/<script src="investors\.js/.test(out)) throw new Error('investors.js script tag not found');
  return out.replace(/<script src="investors\.js/, `<script>window.INV_T=${JSON.stringify(js).replace(/</g, '\\u003c')};</script>\n<script src="../investors.js`);
}

function syncEnglish() {
  let html = fs.readFileSync(SRC, 'utf8');
  const { hreflang, items } = langBlocks('en');
  html = setBlock(html, 'hreflang', hreflang);
  html = setBlock(html, 'langs', items);
  fs.writeFileSync(SRC, html);
  return html;
}

const cmd = process.argv[2];
if (cmd === 'extract') {
  const html = syncEnglish();
  const strings = [...new Set([...collect(html), ...jsStrings().map(clean)])];
  fs.writeFileSync(path.join(HERE, 'source.json'), JSON.stringify({ count: strings.length, strings }, null, 1) + '\n');
  console.log(`source.json: ${strings.length} strings`);
} else if (cmd === 'build') {
  const html = syncEnglish();
  const want = collect(html).concat(jsStrings()).map(clean);
  for (const L of LANGS.slice(1)) {
    const f = path.join(HERE, `${L[0]}.json`);
    if (!fs.existsSync(f)) { console.log(`${L[0]}: no translation file, skipped`); continue; }
    const t = JSON.parse(fs.readFileSync(f, 'utf8')).t || {};
    const missing = want.filter((k) => !t[k]);
    let out = setBlock(html, 'langs', langBlocks(L[0]).items);
    out = translate(out, t, L);
    fs.mkdirSync(path.join(DIR, L[0]), { recursive: true });
    fs.writeFileSync(path.join(DIR, L[0], 'index.html'), out);
    console.log(`${L[0]}: built, ${missing.length} missing${missing.length ? ': ' + missing.slice(0, 3).map((s) => s.slice(0, 40)).join(' | ') : ''}`);
  }
} else {
  console.log('usage: node investors/i18n/build.mjs extract|build');
}
