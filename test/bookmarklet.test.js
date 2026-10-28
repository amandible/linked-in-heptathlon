import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { buildBookmarklet } from '../lib/bookmarklet.js';

const fixture = name => readFileSync(new URL('./fixtures/' + name, import.meta.url), 'utf8');

// Runs a built bookmarklet in a sandbox with a fake linkedin.com and returns where it navigated.
async function run(bookmarklet, hostname, pages) {
  assert.ok(bookmarklet.startsWith('javascript:'));
  const location = { hostname, href: null };
  const alerts = [];
  const context = {
    location,
    alert: msg => alerts.push(msg),
    fetch: async url => ({ text: async () => pages[url] ?? '<html></html>' }),
  };
  await vm.runInNewContext(decodeURIComponent(bookmarklet.slice('javascript:'.length)), context);
  return { href: location.href, alerts };
}

test('bookmarklet collects solved games and sends them to the site', async () => {
  const bookmarklet = buildBookmarklet({ key: 'k123', siteUrl: 'https://example.test/' });
  const { href } = await run(bookmarklet, 'www.linkedin.com', {
    '/games/zip/': fixture('zip-solved.html'),
    '/games/crossclimb/': fixture('crossclimb-solved.html'),
    '/games/tango/': fixture('zip-unplayed.html'),
  });
  const prefix = 'https://example.test/#submit=';
  assert.ok(href.startsWith(prefix), href);
  assert.deepEqual(JSON.parse(decodeURIComponent(href.slice(prefix.length))), {
    key: 'k123',
    results: [
      { game: 'zip', edition: 588, seconds: 8 },
      { game: 'crossclimb', edition: 909, seconds: 19 },
    ],
  });
});

test('bookmarklet refuses to run off LinkedIn', async () => {
  const { href, alerts } = await run(buildBookmarklet({ key: 'k', siteUrl: 'https://example.test' }), 'example.com', {});
  assert.equal(href, null);
  assert.equal(alerts.length, 1);
});
