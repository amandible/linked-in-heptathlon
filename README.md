# LinkedIn Heptathlon

Adds up the times for LinkedIn's seven daily puzzles (Queens, Tango, Zip, Crossclimb,
Mini Sudoku, Patches, Wend) into one daily "heptathlon" score, with a leaderboard for
friends.

## How it works

1. Each person has their own bookmarklet, containing a private key that identifies them.
2. Clicked on any linkedin.com page while logged in, it fetches the seven game pages
   (the same as opening them) and reads today's edition and solve time from each.
3. It then opens the heptathlon site with those times in the URL fragment; the site
   saves them to the database (Neon Postgres) through a small API on Vercel, and shows
   the leaderboard.

Nobody's LinkedIn credentials ever leave their own browser.

Run the bookmarklet after finishing all seven games: in-progress games aren't detected.
Running it again later is harmless; a re-submitted game replaces its earlier time.

**Browser support:** works in Firefox. Chrome (and likely other Chromium browsers)
applies LinkedIn's Content Security Policy to bookmarklets, which blocks them on
linkedin.com; Chrome users would need a small browser extension instead (not built).

## Scoring

- A day's heptathlon total is the sum of all seven times. If any game is missing, there
  is no total that day; the finished games are still shown.
- The leaderboard ranks totals fastest first, then lists players missing a game.
- Week-over-week: each day is compared only with the same weekday a week earlier,
  because puzzle difficulty varies by weekday. It's shown for whoever last submitted
  from this browser.
- Each result is dated by its puzzle edition, not by when it was submitted: every game
  publishes one edition per day (anchors in `lib/games.js`).

## Setup

- Vercel project linked (`npx vercel link`), with `DATABASE_URL` (Neon, pooled
  connection string) set for Production and Preview.
- `.env.local` holds `DATABASE_URL` for local scripts. It's added by hand, because the
  Vercel variable is a secret and can't be pulled; so don't run `vercel env pull`,
  which would overwrite it.
- Create the tables once: `node --env-file=.env.local scripts/db-setup.js`

## Managing players

```
node --env-file=.env.local scripts/add-player.js <name> <site-url>
node --env-file=.env.local scripts/remove-player.js <name>
```

`add-player` writes the player's bookmarklet to `tmp/bookmarklet-<name>.txt`. The
database keeps only a hash of the key, so that file is the only copy: give it to the
player (they make a bookmark with its contents as the URL), then delete it. A lost
bookmarklet means removing and re-adding the player, which also deletes their results.

## Code

- `index.html`: the site (leaderboard and week-over-week), using `lib/` modules directly.
- `api/submit.js`, `api/results.js`: Vercel functions; logic is in `lib/api.js`.
- `lib/games.js`: the game list, and edition → date.
- `lib/extract.js`: reads `{ edition, seconds }` from a game page's HTML. LinkedIn uses
  two page formats; see `test/fixtures/README.md`.
- `lib/scoring.js`: daily totals, leaderboard, week-over-week deltas.
- `lib/db.js`: schema and queries.
- `lib/bookmarklet.js`: builds a bookmarklet around `lib/extract.js`.
- `scripts/dev.js`: run the site locally (`node --env-file=.env.local scripts/dev.js 3000`).
  Note it uses the real database.
- `scripts/probe-linkedin-times.js`: paste into the DevTools console on linkedin.com to
  check that extraction still works against live pages.

## Tests

```
npm test
```

Uses Node's built-in test runner. API tests use an in-memory fake database.
