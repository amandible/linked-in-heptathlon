// Creates the database tables if they don't exist. Safe to run repeatedly.
// Usage: node --env-file=.env.local scripts/db-setup.js
import { neon } from '@neondatabase/serverless';
import { SCHEMA } from '../lib/db.js';

const sql = neon(process.env.DATABASE_URL);
for (const statement of SCHEMA) {
  await sql.query(statement);
}
const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
console.log('Tables:', tables.map(t => t.table_name).join(', '));
