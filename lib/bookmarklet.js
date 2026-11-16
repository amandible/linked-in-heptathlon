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

// Setup steps for an iPhone (Safari) player, sent alongside their bookmarklet. Untested on
// iPhone so far, so it asks the player to report what happens.
export function iphoneInstructions({ name, siteUrl }) {
  return `Heptathlon on iPhone (Safari), for ${name}

This is a "bookmarklet": a bookmark that runs a little code instead of opening a page.
When you tap it on linkedin.com, it reads your times for LinkedIn's seven daily puzzles
(in your own browser, using your LinkedIn login) and sends them to the leaderboard at
${siteUrl}, which then opens. Nothing else is read or sent.

This hasn't been tried on an iPhone yet, so please report what happens (see the end).

SET UP (once)
1. In Safari, open any page (the leaderboard is fine: ${siteUrl}).
2. Tap the Share button, then "Add Bookmark". Name it Heptathlon, save it in
   Favorites, and tap Save.
3. In the message with the code (it starts with "javascript:"), long-press it and tap
   Copy.
4. In Safari, tap the Bookmarks button (the open book), then Edit. Tap the Heptathlon
   bookmark, clear its address (the x in the address field), paste the code, and tap
   Done.

DAILY USE
1. Finish all seven puzzles (in the LinkedIn app or in Safari).
2. Open linkedin.com in Safari, logged in. If LinkedIn offers to open the app, stay in
   Safari.
3. Tap the address bar, type Heptathlon, and tap the Heptathlon bookmark in the
   suggestions (or open it from Bookmarks > Favorites).
Games still in progress aren't counted. Tapping it again later is harmless: it just
replaces your earlier times.

PLEASE REPORT BACK
- The leaderboard opened saying "Saved N games": it works!
- Nothing happened: Safari is probably blocking it.
- It said "No finished games found": LinkedIn may show iPhones different pages.

PRIVACY
The code contains your personal key, which is your identity on the leaderboard.
Don't share it. If it's lost, ask for a new one.
`;
}
