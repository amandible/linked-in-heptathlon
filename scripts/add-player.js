// Adds a player and writes their personal bookmarklet (Firefox) to tmp/bookmarklet-<name>.txt
// and their Chrome extension to the folder tmp/extension-<name>/.
// The key exists only inside those (the database keeps a hash), so give the player the one
// they need and then delete both.
// Usage: node --env-file=.env.local scripts/add-player.js <name> <site-url>
import { mkdirSync, writeFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';
import { addPlayer, newKey } from '../lib/db.js';
import { buildBookmarklet } from '../lib/bookmarklet.js';
import { extensionFiles } from '../lib/extension.js';

const [name, siteUrl] = process.argv.slice(2);
if (!name || !siteUrl) {
  console.error('Usage: node --env-file=.env.local scripts/add-player.js <name> <site-url>');
  process.exit(1);
}

const key = newKey();
const player = await addPlayer(neon(process.env.DATABASE_URL), name, key);

const safeName = name.replace(/[^\w-]/g, '_');
mkdirSync(new URL('../tmp/', import.meta.url), { recursive: true });
const file = new URL(`../tmp/bookmarklet-${safeName}.txt`, import.meta.url);
writeFileSync(file, buildBookmarklet({ key, siteUrl }) + '\n');

const dir = new URL(`../tmp/extension-${safeName}/`, import.meta.url);
mkdirSync(dir, { recursive: true });
for (const [filename, contents] of Object.entries(extensionFiles({ name, key, siteUrl }))) {
  writeFileSync(new URL(filename, dir), contents);
}

console.log(`Added ${player.name} (id ${player.id}).`);
console.log(`Bookmarklet (Firefox): ${file.pathname}`);
console.log(`Extension folder (Chrome): ${dir.pathname}`);
