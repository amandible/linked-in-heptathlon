// Database access. Every function takes `sql`, a tagged-template query function
// (Neon's `neon(url)` in production, a fake in tests), so this module never reads env vars.
import { createHash, randomBytes } from 'node:crypto';

export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS players (
    id serial PRIMARY KEY,
    name text NOT NULL UNIQUE,
    key_hash text NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS results (
    player_id integer NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    game text NOT NULL,
    edition integer NOT NULL,
    puzzle_date date NOT NULL,
    seconds real NOT NULL,
    submitted_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (player_id, game, edition)
  )`,
  `CREATE INDEX IF NOT EXISTS results_puzzle_date ON results (puzzle_date)`,
];

// Players are identified by a private key kept in their bookmarklet; only its hash is stored.
export function newKey() {
  return randomBytes(24).toString('base64url');
}

export function hashKey(key) {
  return createHash('sha256').update(key).digest('hex');
}

export async function addPlayer(sql, name, key) {
  const rows = await sql`INSERT INTO players (name, key_hash) VALUES (${name}, ${hashKey(key)}) RETURNING id, name`;
  return rows[0];
}

export async function findPlayer(sql, key) {
  const rows = await sql`SELECT id, name FROM players WHERE key_hash = ${hashKey(key)}`;
  return rows[0] ?? null;
}

// Re-submitting the same game and edition replaces the earlier time.
export async function saveResult(sql, playerId, { game, edition, date, seconds }) {
  await sql`
    INSERT INTO results (player_id, game, edition, puzzle_date, seconds)
    VALUES (${playerId}, ${game}, ${edition}, ${date}, ${seconds})
    ON CONFLICT (player_id, game, edition)
    DO UPDATE SET seconds = EXCLUDED.seconds, submitted_at = now()`;
}

// Results for the given dates, in the shape lib/scoring.js expects.
export async function resultsOn(sql, dates) {
  const rows = await sql`
    SELECT p.name AS player, r.game, to_char(r.puzzle_date, 'YYYY-MM-DD') AS date, r.seconds
    FROM results r JOIN players p ON p.id = r.player_id
    WHERE r.puzzle_date = ANY(${dates}::date[])`;
  return rows;
}

export async function latestDate(sql) {
  const rows = await sql`SELECT to_char(max(puzzle_date), 'YYYY-MM-DD') AS date FROM results`;
  return rows[0]?.date ?? null;
}
