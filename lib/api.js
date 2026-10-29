// Request handlers for the API, written against standard Request/Response so they can be
// unit-tested with a fake `sql`. The files in api/ wire them to the real database.
import { SLUGS, addDays, puzzleDate } from './games.js';
import { findPlayer, saveResult, resultsOn, latestDate } from './db.js';

const json = (body, status = 200) => Response.json(body, { status });

function validResult(r) {
  return r && SLUGS.includes(r.game)
    && Number.isInteger(r.edition) && r.edition > 0
    && typeof r.seconds === 'number' && r.seconds > 0 && r.seconds < 24 * 60 * 60;
}

// POST { key, results: [{ game, edition, seconds }] }
export async function submit(sql, request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body must be JSON.' }, 400);
  }
  if (typeof body?.key !== 'string' || !Array.isArray(body.results)) {
    return json({ error: 'Expected { key, results }.' }, 400);
  }
  if (!body.results.every(validResult)) {
    return json({ error: 'Unrecognized result.' }, 400);
  }
  const player = await findPlayer(sql, body.key);
  if (!player) return json({ error: 'Unknown player key.' }, 401);

  for (const r of body.results) {
    await saveResult(sql, player.id, { ...r, date: puzzleDate(r.game, r.edition) });
  }
  return json({ player: player.name, saved: body.results.length });
}

// GET ?date=YYYY-MM-DD (default: the latest date with any results).
// Returns that date's results plus the day before and the same weekday a week earlier.
export async function results(sql, request) {
  const param = new URL(request.url).searchParams.get('date');
  if (param && !/^\d{4}-\d{2}-\d{2}$/.test(param)) return json({ error: 'Bad date.' }, 400);
  const date = param ?? await latestDate(sql);
  if (!date) return json({ date: null, results: [] });
  return json({ date, results: await resultsOn(sql, [date, addDays(date, -1), addDays(date, -7)]) });
}
