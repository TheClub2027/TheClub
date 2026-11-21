# The Club

A browser-based football management game built with Next.js, TypeScript, and Supabase-ready online career saves.

## Start locally

```bash
pnpm install
pnpm dev
```

Without Supabase credentials, careers save in this browser. For account-backed saves, copy `.env.example` to `.env.local`, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and apply `supabase/migrations/20261121172753_create_career_saves.sql` to your Supabase project. Row-level security restricts every career to its authenticated owner. Never put a Supabase secret key in browser code.

## Checks

```bash
pnpm test
pnpm typecheck
pnpm build
```

## Current playable scope

Create or continue a career, manage a fictional 12-club league, edit squad selection and tactics, play a 22-match season, negotiate player deals, manage finances and sponsors, and design or expand a stadium. Seasons continue indefinitely with youth intakes, aging, retirements, and history. Additional countries and European competitions are planned as later expansions.
