// Heptathlon scoring. A result is { player, game, date, seconds }, where `game` is a slug
// and `date` is the puzzle's date ('YYYY-MM-DD').
// Leaderboard rule: a skipped game counts as the average of everyone who played it that day
// (a placeholder); a game nobody played that day is left out of every total.
// Personal comparisons use only real times: a total there needs all seven games.
import { SLUGS, addDays } from './games.js';

// { slug: seconds } for one player on one date.
function timesFor(results, player, date) {
  const times = {};
  for (const r of results) {
    if (r.player === player && r.date === date) times[r.game] = r.seconds;
  }
  return times;
}

// Sum of all seven times, or null if any game is missing.
export function dailyTotal(times) {
  if (!SLUGS.every(slug => slug in times)) return null;
  return SLUGS.reduce((sum, slug) => sum + times[slug], 0);
}

// Average real time per game on `date`: { slug: { seconds, players } }, for games someone played.
function averages(results, date) {
  const sums = {};
  for (const r of results) {
    if (r.date !== date) continue;
    const s = (sums[r.game] ??= { total: 0, players: 0 });
    s.total += r.seconds;
    s.players++;
  }
  const out = {};
  for (const [slug, s] of Object.entries(sums)) out[slug] = { seconds: s.total / s.players, players: s.players };
  return out;
}

// Everyone with at least one result on `date`, fastest total first. Each row has:
// - times: real times; placeholders: { slug: { seconds, players } } for games they skipped
// - total: real times plus placeholders
// - beaten: { slug: how many players with a faster total this player beat on that game },
//   counting only those players' real times; ties don't count.
export function leaderboard(results, date) {
  const avg = averages(results, date);
  const players = [...new Set(results.filter(r => r.date === date).map(r => r.player))];
  const rows = players.map(player => {
    const times = timesFor(results, player, date);
    const placeholders = {};
    let total = 0;
    for (const slug of SLUGS) {
      if (slug in times) total += times[slug];
      else if (avg[slug]) {
        placeholders[slug] = avg[slug];
        total += avg[slug].seconds;
      }
    }
    return { player, times, placeholders, total };
  });
  rows.sort((a, b) => a.total - b.total || a.player.localeCompare(b.player));
  for (const row of rows) {
    const ahead = rows.filter(other => other.total < row.total);
    row.beaten = {};
    for (const slug of SLUGS) {
      if (!(slug in row.times)) continue;
      row.beaten[slug] = ahead.filter(o => slug in o.times && row.times[slug] < o.times[slug]).length;
    }
  }
  return rows;
}

// Compares `date` with the same weekday one week earlier: the meaningful comparison,
// since difficulty varies by weekday.
export function weekOverWeek(results, player, date) {
  return compareDays(results, player, date, addDays(date, -7));
}

// Compares `date` with the day before. Puzzles get steadily harder through the week, so this
// is a rough read on form; Monday vs Sunday means little.
export function dayOverDay(results, player, date) {
  return compareDays(results, player, date, addDays(date, -1));
}

// Compares `date` with `previousDate`, overall and per game.
// A delta is null when either side is missing; negative means faster.
export function compareDays(results, player, date, previousDate) {
  const now = timesFor(results, player, date);
  const before = timesFor(results, player, previousDate);
  const diff = (a, b) => (a == null || b == null ? null : a - b);

  const games = {};
  for (const slug of SLUGS) {
    games[slug] = { seconds: now[slug] ?? null, previous: before[slug] ?? null };
    games[slug].delta = diff(games[slug].seconds, games[slug].previous);
  }
  const total = dailyTotal(now);
  const previousTotal = dailyTotal(before);
  return { date, previousDate, total, previousTotal, delta: diff(total, previousTotal), games };
}
