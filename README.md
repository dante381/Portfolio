# anish-portfolio

Personal portfolio + private analytics dashboard for [anish-portfolio-dante381.netlify.app](https://anish-portfolio-dante381.netlify.app).

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript strict + React 19 |
| Styling | Tailwind CSS v4 |
| Database | Neon serverless Postgres via Drizzle ORM |
| Auth | jose (JWT HS256 2h) + bcryptjs (cost 12) + httpOnly cookie |
| Rate limiting | @upstash/ratelimit + in-memory fallback |
| Animation | framer-motion (DAG hero) + recharts (dashboard) |
| Hosting | Netlify (@netlify/plugin-nextjs v5 / OpenNext) |

## Local dev

```bash
npm install
cp .env.example .env.local   # fill in values
npx drizzle-kit push          # sync schema to Neon
npm run dev
```

Generate admin credentials:
```bash
node scripts/gen-admin.mjs <username> <password>
```

## Env vars

See `.env.example`. Required:

```
DATABASE_URL        # Neon connection string
AUTH_SECRET         # 32-byte base64 secret for JWT signing
ADMIN_USERNAME      # dashboard login username
ADMIN_PASSWORD_HASH # bcrypt hash — escape $ as \$ in .env.local
HASH_SALT           # daily-rotating salt for visitor_hash (sha256)
```

Upstash vars optional — falls back to in-memory rate limiting when absent.

## Commands

```bash
npm run dev        # local dev server
npm run build      # production build
npm run test       # vitest (155 tests across 14 files)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

## Architecture

```
src/
├── app/
│   ├── page.tsx              # portfolio (public)
│   ├── dashboard/            # analytics dashboard (auth-gated)
│   ├── login/                # admin login
│   └── api/
│       ├── track/            # POST event ingest (rate-limited, PII-minimised)
│       ├── stats/            # GET aggregates (auth-gated)
│       └── auth/             # login / logout
├── lib/
│   ├── db/{client,schema}.ts # Drizzle + Neon
│   ├── auth.ts               # JWT sign/verify, bcrypt, session cookie
│   ├── analytics.ts          # visitor_hash, UA→device, DNT
│   ├── ratelimit.ts          # Upstash + in-memory fallback
│   └── validation.ts         # zod schemas
└── tests/                    # vitest unit + component + security
```

## Security

- CSP: `script-src 'self' 'unsafe-inline'` (unsafe-eval removed; unsafe-inline required for Next.js 16 bootstrap — see ISSUES.md I-018)
- HSTS 1yr + includeSubDomains + preload
- Visitor PII: sha256(ip+ua+daily-salt) stored — no raw IP/UA
- DNT/Sec-GPC honoured → skip tracking
- Full threat model and checklist in [SECURITY.md](./SECURITY.md)
