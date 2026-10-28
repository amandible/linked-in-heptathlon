import { neon } from '@neondatabase/serverless';
import { submit } from '../lib/api.js';

const sql = neon(process.env.DATABASE_URL);

export function POST(request) {
  return submit(sql, request);
}
