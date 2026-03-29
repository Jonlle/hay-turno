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
- Tailwind CSS
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
pnpm test
corepack pnpm test
corepack pnpm exec tsc --noEmit
```

## Project Documentation

- `AGENTS.md` — project instructions for coding agents
- `docs/sdd/proposal.md` — MVP proposal
- `docs/sdd/design.md` — technical design
- `docs/sdd/spec.md` — functional and non-functional specification
- `docs/sdd/tasks.md` — implementation task breakdown

## Current Status

The repository is in the foundation stage.

Completed so far:

- Project agent guidance and installed skills
- SDD planning artifacts materialized in `docs/sdd/`
- Phase 1 foundation setup
- Initial Supabase schema and access migrations
- Validation and Colombia timezone utilities with tests

## Notes

- Public routes are tenant-aware and use Barbershop slug paths
- Admin access is authenticated and scoped by Barbershop membership
- Future multitenancy and tenant theming are planned from day one
