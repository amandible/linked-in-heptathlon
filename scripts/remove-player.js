// Removes a player and all their results.
// Usage: node --env-file=.env.local scripts/remove-player.js <name>
import { neon } from '@neondatabase/serverless';

const name = process.argv[2];
if (!name) {
  console.error('Usage: node --env-file=.env.local scripts/remove-player.js <name>');
  process.exit(1);
}
const rows = await neon(process.env.DATABASE_URL)`DELETE FROM players WHERE name = ${name} RETURNING id`;
console.log(rows.length ? `Removed ${name} and their results.` : `No player named ${name}.`);
