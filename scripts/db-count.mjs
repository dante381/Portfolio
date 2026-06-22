// One-off: read .env.local, count rows in events/sessions on Neon.
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const m = env.match(/DATABASE_URL\s*=\s*"?([^"\n]+)"?/);
if (!m) { console.error('no DATABASE_URL'); process.exit(1); }
const sql = neon(m[1].trim());

const ev = await sql`select count(*)::int as n from events`;
const se = await sql`select count(*)::int as n from sessions`;
const last = await sql`select type, path, section, country, device, os, browser, referrer_host, session_id, created_at from events order by created_at desc limit 3`;
console.log('events:', ev[0].n, 'sessions:', se[0].n);
console.log('last events:', JSON.stringify(last, null, 2));
