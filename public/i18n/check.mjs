// Check a translation file against source.json: every string present, same HTML tags, same numbers.
//   node public/i18n/check.mjs hi
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const code = process.argv[2];
const { strings } = JSON.parse(fs.readFileSync(path.join(HERE, 'source.json'), 'utf8'));
const file = JSON.parse(fs.readFileSync(path.join(HERE, `${code}.json`), 'utf8'));
const t = file.t || {};
const tags = (s) => (s.match(/<\/?[a-z][^>]*>/gi) || []).map((x) => x.replace(/\s(aria-label|title|alt)="[^"]*"/g, '')).sort().join('|');
const nums = (s) => (s.replace(/<[^>]+>/g, '').match(/\d[\d,.]*/g) || []).map((n) => n.replace(/[,.]$/, '')).sort().join(' ');
const bad = [];
for (const k of strings) {
  const v = t[k];
  if (!v || !v.trim()) { bad.push(['missing', k]); continue; }
  if (tags(k) !== tags(v)) bad.push(['tags differ', k]);
  if (nums(k) !== nums(v)) bad.push(['numbers differ', k, nums(k), '->', nums(v)]);
}
const extra = Object.keys(t).filter((k) => !strings.includes(k));
for (const b of bad.slice(0, 40)) console.log(b.map((x) => String(x).slice(0, 90)).join(' :: '));
console.log(`${code}: ${strings.length} strings, ${bad.length} problems, ${extra.length} unknown keys`);
process.exit(bad.length ? 1 : 0);
