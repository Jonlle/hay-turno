# HayTurno

HayTurno is a mobile-first queue management MVP for single-chair barbershops in Barranquilla, Colombia.

The product is designed to let clients check the Queue from a link or QR code, join remotely without downloading an app, and let barbers or managers control the Queue quickly from an authenticated admin area.

## MVP Goals

- Public Queue view for a Barbershop
- Remote Turn join flow without login
- Walk-in registration by admin users
- Fast `Next` action for queue control
- Day, week, and month stats for attended Turns
- Real-time synchronization across connected devices

## Approved Stack

- React 18 + Vite + TypeScript
- React Router
- Tailwind CSS v4
- shadcn/ui
- React Hook Form + Zod
- TanStack Query
- Zustand
- Supabase (Auth, Realtime, PostgreSQL)
- Recharts
- date-fns + date-fns-tz
- Vitest + React Testing Library + MSW
- Vercel

## Commands

```bash
pnpm dev          # Start Vite dev server
pnpm build        # Production build
pnpm test         # Run all tests
pnpm test:watch   # Run tests in watch mode
pnpm typecheck    # TypeScript type checking
```

## Project Documentation

- [AGENTS.md](AGENTS.md) — project instructions for coding agents
- [docs/sdd/proposal.md](docs/sdd/proposal.md) — MVP proposal
- [docs/sdd/design.md](docs/sdd/design.md) — technical design
- [docs/sdd/spec.md](docs/sdd/spec.md) — functional and non-functional specification
- [docs/sdd/tasks.md](docs/sdd/tasks.md) — implementation task breakdown
- [docs/sdd/proposal-phase5-whatsapp.md](docs/sdd/proposal-phase5-whatsapp.md) — Phase 5: WhatsApp Bot proposal
- [docs/diagrams/README.md](docs/diagrams/README.md) — flow and architecture diagrams
- [.atl/skill-registry.md](.atl/skill-registry.md) — installed skills registry

## Current Status

**MVP fully implemented and polished.** All 17 tasks across 4 phases complete.

🌐 **Production**: <https://hayturno.vercel.app/b/demo>

- Data services: barbershops, queue, auth, memberships, stats, realtime
- Public UI: queue board, remote join form, not-found page
- Admin UI: login, queue control (walk-in, next, cancel turn), day/week/month stats
- Realtime subscriptions for live queue updates
- Colombia timezone-aware stats aggregation
- Per-barbershop theme customization (CSS variables)
- Dev seed environment (auto-creates demo barbershop + admin on startup)
- Neutral Colombian Spanish throughout
- **77 tests passing** across 13 test files

### Dev Setup

1. Create a Supabase project and add credentials to `.env`
2. Run migrations from `supabase/migrations/` in SQL Editor (001, 002, 003)
3. Run `seed_demo_environment()` function in SQL Editor
4. Disable email confirmation in Auth settings (dev only)
5. `pnpm dev` — app runs at `http://localhost:5173`

Demo credentials (local/dev seed only — never for staging/production): `admin@demo.com` / `demo1234`

## Notes

- Public routes are tenant-aware and use Barbershop slug paths (`/b/:slug`)
- Admin access is authenticated and scoped by Barbershop membership (`/admin/:slug/*`)
- Future multitenancy and tenant theming are planned from day one
