import { neon } from '@neondatabase/serverless';
import { results } from '../lib/api.js';

const sql = neon(process.env.DATABASE_URL);

export function GET(request) {
  return results(sql, request);
}
