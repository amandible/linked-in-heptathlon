import { test } from 'node:test';
import assert from 'node:assert/strict';
import { submit, results } from '../lib/api.js';
import { hashKey } from '../lib/db.js';

// A fake `sql` tagged template that recognizes the queries lib/db.js makes
// and keeps players and results in memory.
function fakeSql() {
  const players = [{ id: 1, name: 'ann', key_hash: hashKey('good-key') }];
  const rows = [];
  const sql = (strings, ...values) => {
    const q = strings.join('?');
    if (q.includes('FROM players WHERE key_hash')) {
      return Promise.resolve(players.filter(p => p.key_hash === values[0]));
    }
    if (q.includes('INSERT INTO results')) {
      const [player_id, game, edition, date, seconds] = values;
      const existing = rows.find(r => r.player_id === player_id && r.game === game && r.edition === edition);
      if (existing) existing.seconds = seconds;
      else rows.push({ player_id, game, edition, date, seconds });
      return Promise.resolve([]);
    }
    if (q.includes('max(puzzle_date)')) {
      const dates = rows.map(r => r.date).sort();
      return Promise.resolve([{ date: dates.at(-1) ?? null }]);
    }
    if (q.includes('puzzle_date = ANY')) {
      return Promise.resolve(rows.filter(r => values[0].includes(r.date)).map(r => ({
        player: players.find(p => p.id === r.player_id).name, game: r.game, date: r.date, seconds: r.seconds,
      })));
    }
    throw new Error('Unexpected query: ' + q);
  };
  return { sql, rows };
}

const post = body => new Request('https://x.test/api/submit', { method: 'POST', body: JSON.stringify(body) });
const get = query => new Request('https://x.test/api/results' + query);

test('submit saves results dated by edition', async () => {
  const { sql, rows } = fakeSql();
  const res = await submit(sql, post({ key: 'good-key', results: [{ game: 'zip', edition: 589, seconds: 8 }] }));
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { player: 'ann', saved: 1 });
  assert.deepEqual(rows, [{ player_id: 1, game: 'zip', edition: 589, date: '2026-10-27', seconds: 8 }]);
});

test('resubmitting a game replaces its time', async () => {
  const { sql, rows } = fakeSql();
  await submit(sql, post({ key: 'good-key', results: [{ game: 'zip', edition: 589, seconds: 8 }] }));
  await submit(sql, post({ key: 'good-key', results: [{ game: 'zip', edition: 589, seconds: 9 }] }));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].seconds, 9);
});

test('submit rejects unknown keys and bad results', async () => {
  const { sql, rows } = fakeSql();
  assert.equal((await submit(sql, post({ key: 'nope', results: [] }))).status, 401);
  assert.equal((await submit(sql, post({ key: 'good-key', results: [{ game: 'chess', edition: 1, seconds: 5 }] }))).status, 400);
  assert.equal((await submit(sql, post({ key: 'good-key', results: [{ game: 'zip', edition: 1, seconds: 0 }] }))).status, 400);
  assert.equal((await submit(sql, new Request('https://x.test', { method: 'POST', body: 'not json' }))).status, 400);
  assert.equal(rows.length, 0);
});

test('results returns the latest date, the day before, and a week earlier', async () => {
  const { sql } = fakeSql();
  await submit(sql, post({ key: 'good-key', results: [
    { game: 'zip', edition: 588, seconds: 8 },  // 2026-10-26
    { game: 'zip', edition: 587, seconds: 9 },  // 2026-10-25
    { game: 'zip', edition: 581, seconds: 10 }, // 2026-10-19
    { game: 'zip', edition: 584, seconds: 99 }, // 2026-10-22, not included
  ] }));
  const body = await (await results(sql, get(''))).json();
  assert.equal(body.date, '2026-10-26');
  assert.deepEqual(body.results.map(r => r.date).sort(), ['2026-10-19', '2026-10-25', '2026-10-26']);
});

test('results with no data and with a bad date', async () => {
  const { sql } = fakeSql();
  assert.deepEqual(await (await results(sql, get(''))).json(), { date: null, results: [] });
  assert.equal((await results(sql, get('?date=yesterday'))).status, 400);
});
