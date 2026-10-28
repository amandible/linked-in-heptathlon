import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractResult } from '../lib/extract.js';

const fixture = name => readFileSync(new URL('./fixtures/' + name, import.meta.url), 'utf8');

test('reads the new page format (milliseconds, escaped quotes)', () => {
  assert.deepEqual(extractResult(fixture('zip-solved.html')), { edition: 588, seconds: 8 });
});

test('reads the old page format (seconds, &quot; quotes)', () => {
  assert.deepEqual(extractResult(fixture('crossclimb-solved.html')), { edition: 909, seconds: 19 });
});

test('returns null for a page with no result', () => {
  assert.equal(extractResult('<html><body>nothing here</body></html>'), null);
});
