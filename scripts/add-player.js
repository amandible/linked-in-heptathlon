// Adds a player and writes their personal bookmarklet to tmp/bookmarklet-<name>.txt.
// The key exists only inside that bookmarklet (the database keeps a hash), so give the file
// to the player and then delete it.
// Usage: node --env-file=.env.local scripts/add-player.js <name> <site-url>
import { mkdirSync, writeFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { addPlayer, newKey } from '../lib/db.js';
import { buildBookmarklet } from '../lib/bookmarklet.js';

const [name, siteUrl] = process.argv.slice(2);
if (!name || !siteUrl) {
  console.error('Usage: node --env-file=.env.local scripts/add-player.js <name> <site-url>');
  process.exit(1);
}

const key = newKey();
const player = await addPlayer(neon(process.env.DATABASE_URL), name, key);

mkdirSync(new URL('../tmp/', import.meta.url), { recursive: true });
const file = new URL(`../tmp/bookmarklet-${name.replace(/[^\w-]/g, '_')}.txt`, import.meta.url);
writeFileSync(file, buildBookmarklet({ key, siteUrl }) + '\n');
console.log(`Added ${player.name} (id ${player.id}). Bookmarklet written to ${file.pathname}`);
