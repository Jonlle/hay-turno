# Proposal: HayTurno MVP Foundation

## Intent

Establish the first production-ready MVP foundation for a mobile-first, real-time Queue system for single-chair Barbershops, while preserving multi-tenant structure for future expansion.

## Scope

### In Scope

- Public anonymous Queue view and Remote Turn join flow via `/b/:slug`
- Authenticated admin foundation via `/admin/:slug` for owner/manager, Walk-in registration, Next, and attended-Turn stats
- Tenant-aware Supabase data model, realtime subscriptions, and neutral theme tokens via tenant settings + CSS variables

### Out of Scope

- Full multi-Barbershop management UX
- Advanced theming system, payments, appointments, notifications, or multi-chair operations

## Approach

Build a React + Vite frontend on Vercel with Supabase Auth, Postgres, and Realtime. Keep public Queue reads anonymous, protect admin/stats behind auth, and model all business entities with `barbershop_id` or membership relations from day one.

## Explicit Decisions

- Anonymous public Queue; no login for Remote clients
- Authenticated admin area with initial roles `owner`, `manager`
- PostgreSQL as source of truth; no in-memory-only queue state
- TanStack Query for server state, Zustand for UI-only state
- Minimal shadcn/ui usage; no full design system now

## Affected Areas

| Area                                  | Impact | Description                            |
| ------------------------------------- | ------ | -------------------------------------- |
| `src/app`, `src/pages`                | New    | Public and admin route foundation      |
| `src/services/supabase`               | New    | Auth, DB, Realtime integration         |
| `src/hooks`, `src/stores`             | New    | Queue/realtime hooks and UI state      |
| `src/components/{queue,barber,stats}` | New    | MVP screens and flows                  |
| `supabase/*`                          | New    | Schema, roles, policies, subscriptions |

## Risks

| Risk                              | Likelihood | Mitigation                                     |
| --------------------------------- | ---------- | ---------------------------------------------- |
| Realtime race conditions on Next  | Med        | DB-backed ordering, transactional updates      |
| Premature multi-tenant complexity | Med        | Structural readiness only, defer UX            |
| Anonymous access leakage          | Med        | Separate public/admin queries and RLS planning |

## Rollback Plan

Disable realtime/admin flows and fall back to read-only public Queue while reverting schema/UI changes behind the MVP routes.

## Dependencies

- Supabase project/configuration
- Vercel deployment pipeline

## Success Criteria

- [x] Public Queue and Remote join work without login
- [x] Walk-in, Next, and stats work for authenticated admin users
- [x] Queue updates sync across devices in ~1 second
- [x] Data model remains Barbershop-scoped and theme-ready
