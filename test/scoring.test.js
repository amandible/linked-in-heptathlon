import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SLUGS } from '../lib/games.js';
import { dailyTotal, leaderboard, weekOverWeek, dayOverDay } from '../lib/scoring.js';

// All seven games for one player on one date, each taking `seconds` (or per-game overrides).
function day(player, date, seconds, overrides = {}) {
  return SLUGS.map(game => ({ player, game, date, seconds: overrides[game] ?? seconds }));
}
const without = (results, game) => results.filter(r => r.game !== game);

test('dailyTotal sums all seven games', () => {
  assert.equal(dailyTotal({ queens: 16, tango: 34, zip: 8, crossclimb: 19, 'mini-sudoku': 34, patches: 13, wend: 12 }), 136);
});

test('dailyTotal is null when a game is missing', () => {
  assert.equal(dailyTotal({ queens: 16, tango: 34 }), null);
});

test('leaderboard ranks complete totals fastest first, incomplete players last', () => {
  const results = [
    ...day('ann', '2026-10-26', 20),
    ...day('bea', '2026-10-26', 10),
    ...without(day('cal', '2026-10-26', 1), 'wend'),
    ...day('dee', '2026-10-25', 5), // other day, ignored
  ];
  const board = leaderboard(results, '2026-10-26');
  assert.deepEqual(board.map(r => [r.player, r.total]), [['bea', 70], ['ann', 140], ['cal', null]]);
  assert.equal(board[2].times.zip, 1);
});

test('weekOverWeek compares with the same weekday a week earlier', () => {
  const results = [
    ...day('ann', '2026-10-19', 20),
    ...day('ann', '2026-10-25', 1), // the day before: must not be used
    ...day('ann', '2026-10-26', 20, { zip: 15 }),
  ];
  const wow = weekOverWeek(results, 'ann', '2026-10-26');
  assert.equal(wow.previousDate, '2026-10-19');
  assert.equal(wow.total, 135);
  assert.equal(wow.previousTotal, 140);
  assert.equal(wow.delta, -5);
  assert.deepEqual(wow.games.zip, { seconds: 15, previous: 20, delta: -5 });
  assert.equal(wow.games.queens.delta, 0);
});

test('dayOverDay compares with the day before', () => {
  const results = [
    ...day('ann', '2026-10-25', 30),
    ...day('ann', '2026-10-26', 20, { zip: 40 }),
  ];
  const dod = dayOverDay(results, 'ann', '2026-10-26');
  assert.equal(dod.previousDate, '2026-10-25');
  assert.equal(dod.total, 160);
  assert.equal(dod.previousTotal, 210);
  assert.equal(dod.delta, -50);
  assert.deepEqual(dod.games.zip, { seconds: 40, previous: 30, delta: 10 });
});

test('weekOverWeek gives null deltas where last week is missing', () => {
  const results = [...without(day('ann', '2026-10-19', 20), 'tango'), ...day('ann', '2026-10-26', 20)];
  const wow = weekOverWeek(results, 'ann', '2026-10-26');
  assert.equal(wow.previousTotal, null);
  assert.equal(wow.delta, null);
  assert.equal(wow.games.tango.delta, null);
  assert.equal(wow.games.zip.delta, 0);
});
