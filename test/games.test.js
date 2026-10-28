import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, puzzleDate } from '../lib/games.js';

test('addDays crosses month and year boundaries', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2027-01-01', -1), '2026-12-31');
});

test('puzzleDate counts one edition per day from the anchor', () => {
  assert.equal(puzzleDate('zip', 588), '2026-10-26');
  assert.equal(puzzleDate('zip', 589), '2026-10-27');
  assert.equal(puzzleDate('queens', 902), '2026-10-19');
});

test('puzzleDate rejects unknown games', () => {
  assert.throws(() => puzzleDate('chess', 1));
});
