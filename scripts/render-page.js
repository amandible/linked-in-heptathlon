// Runs index.html's script in Node against a running local server and prints what the page
// shows, as text: a quick check without a browser. Clicks and CSS aren't exercised.
// Usage (with the dev server running): node scripts/render-page.js <player-name> [port] [date]
import { readFileSync, writeFileSync, rmSync } from 'node:fs';

const [player, port = '3000', date] = process.argv.slice(2);
if (!player) {
  console.error('Usage: node scripts/render-page.js <player-name> [port] [date]');
  process.exit(1);
}

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];

const els = {};
const el = () => ({ innerHTML: '', textContent: '', querySelectorAll: () => [] });
globalThis.document = { getElementById: id => (els[id] ??= el()) };
globalThis.localStorage = { getItem: () => player, setItem() {} };
globalThis.location = { hash: '', pathname: '/', search: '' };
globalThis.history = { replaceState() {} };
const realFetch = fetch;
globalThis.fetch = url => realFetch(`http://localhost:${port}` + url.replace(/^\/api\/results$/, date ? `/api/results?date=${date}` : url));

// The page imports ./lib/...; run it from a temporary module next to index.html.
const tmp = new URL('../.render-page-tmp.mjs', import.meta.url);
writeFileSync(tmp, script);
try {
  await import(tmp.href);
} finally {
  rmSync(tmp);
}

// The comparison rows hold both views; show which is which.
const text = s => s
  .replace(/<span class="rel">/g, ' change ').replace(/<span class="abs">/g, ' / times ')
  .replace(/<[^>]+>/g, ' ').replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
console.log(els.date.textContent);
console.log(text(els.board.innerHTML));
console.log(text(els.wow.innerHTML));
