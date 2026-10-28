// Builds a player's bookmarklet. It reuses lib/extract.js verbatim (minus `export`),
// so the bookmarklet and the tests run the same extraction code.
import { readFileSync } from 'node:fs';
import { SLUGS } from './games.js';

const extractSource = readFileSync(new URL('./extract.js', import.meta.url), 'utf8')
  .split('\n')
  .filter(line => !line.trim().startsWith('//'))
  .join('\n')
  .replace(/^export /gm, '');

// The script that runs on linkedin.com: fetch each game page, extract results,
// then go to the site with them in the URL fragment (never sent to any server as part of the URL).
export function bookmarkletSource({ key, siteUrl }) {
  return `(async () => {
${extractSource}
if (!/(^|\\.)linkedin\\.com$/.test(location.hostname)) { alert('Open linkedin.com first, then click this again.'); return; }
const results = [];
for (const game of ${JSON.stringify(SLUGS)}) {
  const html = await fetch('/games/' + game + '/', { credentials: 'include' }).then(r => r.text());
  const result = extractResult(html);
  if (result) results.push({ game, ...result });
}
location.href = ${JSON.stringify(siteUrl.replace(/\/$/, '') + '/#submit=')} + encodeURIComponent(JSON.stringify({ key: ${JSON.stringify(key)}, results }));
})();`;
}

export function buildBookmarklet(options) {
  return 'javascript:' + encodeURIComponent(bookmarkletSource(options));
}
