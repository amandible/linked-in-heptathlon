// Runs the site locally with `vercel dev`, passing along DATABASE_URL from .env.local
// (vercel dev doesn't read it there, because Vercel's Development environment lacks it).
// Usage: node --env-file=.env.local scripts/dev.js [port]
import { spawn } from 'node:child_process';

const port = process.argv[2] ?? '3000';
spawn('npx', ['vercel', 'dev', '--listen', port], { stdio: 'inherit', env: process.env });
