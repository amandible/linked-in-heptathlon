# LinkedIn Heptathlon

Adds up the times for LinkedIn's seven daily puzzles (Queens, Tango, Zip, Crossclimb,
Mini Sudoku, Patches, Wend) into one daily "heptathlon" score, with a leaderboard for
friends.

## How it works (planned)

1. Each person has their own bookmarklet, containing a private key that identifies them.
2. Clicked on any linkedin.com page while logged in, it fetches the seven game pages
   (the same as opening them) and reads today's edition and solve time from each.
3. It then opens the heptathlon site with those times in the URL fragment; the site
   saves them to the database (Neon Postgres) through a small API on Vercel.

Nobody's LinkedIn credentials ever leave their own browser.

## Scoring

- A day's heptathlon total is the sum of all seven times. If any game is missing, there
  is no total that day; the finished games are still shown.
- Today's leaderboard ranks totals fastest first, then lists players missing a game.
- Week-over-week: each day is compared only with the same weekday a week earlier,
  because puzzle difficulty varies by weekday.
- Each result is dated by its puzzle edition, not by when it was submitted, assuming
  every game publishes exactly one edition per day (anchors in `lib/games.js`).

## Code

- `lib/games.js`: the game list, and edition → date.
- `lib/extract.js`: reads `{ edition, seconds }` from a game page's HTML. LinkedIn uses
  two page formats; see `test/fixtures/README.md`.
- `lib/scoring.js`: daily totals, leaderboard, week-over-week deltas.
- `scripts/probe-linkedin-times.js`: paste into the DevTools console on linkedin.com to
  check that extraction still works against live pages.

## Tests

```
npm test
```

Uses Node's built-in test runner; no dependencies.

## Status

Done: extraction, scoring, edition dating, unit tests.
To do: bookmarklet build, Vercel site + API, Neon schema, handling of unplayed /
in-progress games.
