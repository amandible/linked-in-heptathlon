// The seven LinkedIn games. `slug` is the path under linkedin.com/games/.
// `anchor` pins one known edition to its date; other editions are assumed to be
// one per day with no gaps (see puzzleDate).
export const GAMES = [
  { slug: 'queens', name: 'Queens', anchor: { edition: 909, date: '2026-10-26' } },
  { slug: 'tango', name: 'Tango', anchor: { edition: 749, date: '2026-10-26' } },
  { slug: 'zip', name: 'Zip', anchor: { edition: 588, date: '2026-10-26' } },
  { slug: 'crossclimb', name: 'Crossclimb', anchor: { edition: 909, date: '2026-10-26' } },
  { slug: 'mini-sudoku', name: 'Mini Sudoku', anchor: { edition: 441, date: '2026-10-26' } },
  { slug: 'patches', name: 'Patches', anchor: { edition: 223, date: '2026-10-26' } },
  { slug: 'wend', name: 'Wend', anchor: { edition: 140, date: '2026-10-26' } },
];

export const SLUGS = GAMES.map(g => g.slug);

// Dates are 'YYYY-MM-DD' strings; arithmetic is done in UTC so time zones can't shift the day.
export function addDays(date, days) {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// The date a given edition of a game was published.
export function puzzleDate(slug, edition) {
  const game = GAMES.find(g => g.slug === slug);
  if (!game) throw new Error('Unknown game: ' + slug);
  return addDays(game.anchor.date, edition - game.anchor.edition);
}
