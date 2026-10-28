// Heptathlon scoring. A result is { player, game, date, seconds }, where `game` is a slug
// and `date` is the puzzle's date ('YYYY-MM-DD').
// Rule: a day's total exists only if the player has a time for all seven games.
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

// Everyone with at least one result on `date`. Players with a total come first,
// fastest first; players missing a game follow, without a total.
export function leaderboard(results, date) {
  const players = [...new Set(results.filter(r => r.date === date).map(r => r.player))];
  const rows = players.map(player => {
    const times = timesFor(results, player, date);
    return { player, times, total: dailyTotal(times) };
  });
  return rows.sort((a, b) => {
    if (a.total === null && b.total === null) return a.player.localeCompare(b.player);
    if (a.total === null) return 1;
    if (b.total === null) return -1;
    return a.total - b.total || a.player.localeCompare(b.player);
  });
}

// Compares `date` with the same weekday one week earlier, overall and per game.
// A delta is null when either side is missing; negative means faster.
export function weekOverWeek(results, player, date) {
  const previousDate = addDays(date, -7);
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
