# Design: HayTurno MVP Foundation

## Executive Summary

HayTurno will ship as a single React SPA with two tenant-aware areas: anonymous public Queue routes at `/b/:slug` and authenticated admin routes at `/admin/:slug`. Supabase Postgres is the source of truth for Queue state, Auth protects admin actions, and Realtime invalidates/refetches TanStack Query caches so all devices converge on the same Turn order.

## Architecture Overview

Public and admin share one app shell, router, and Supabase client, but use separate page modules, query keys, and service methods.

### Route Map

- `/b/:slug` — public Queue board
- `/b/:slug/join` — Remote join form
- `/admin/:slug/login` — admin sign-in gate
- `/admin/:slug/queue` — live Queue control, Walk-in create, Next
- `/admin/:slug/stats` — day/week/month attended-Turn stats
- `*` — not found

### Frontend Module Design

- `src/app/router.tsx` — route tree and guards
- `src/pages/public/*` — public pages only
- `src/pages/admin/*` — admin pages only
- `src/components/queue|barber|stats/*` — feature UI
- `src/services/supabase/*` — auth, queries, mutations, realtime
- `src/hooks/*` — feature hooks wrapping Query + realtime lifecycle
- `src/stores/ui/*` — Zustand for drawers, filters, optimistic UI flags
- `src/types/*`, `src/schemas/*`, `src/utils/time.ts`

## Data Model Design

Core tables:

- `barbershops(id, slug, name, timezone, theme_settings jsonb, is_active, created_at)`
- `profiles(id auth.users FK, full_name, created_at)`
- `barbershop_memberships(id, barbershop_id, profile_id, role, created_at)` where `role in ('owner','manager')`
- `turns(id, barbershop_id, turn_number, client_name, source, status, joined_at, called_at, completed_at, cancelled_at, created_by_membership_id nullable)` where `source in ('walk-in','remote')` and `status in ('waiting','called','attended','cancelled')`

Tenant-awareness is mandatory: every business row carries `barbershop_id` or reaches it through membership. Stats source-of-truth is `turns.completed_at` for rows with `status='attended'`; dashboards are derived by SQL aggregation in Colombia timezone, not stored counters.

## Queue State Machine / Lifecycle

`waiting -> called -> attended`

Optional exit: `waiting|called -> cancelled`

`Next` must be a DB-owned transaction/RPC: lock the current active Queue rows for one Barbershop, mark any `called` Turn as `attended`, select the oldest `waiting` Turn, mark it `called`, and return both affected rows. This avoids double-advance races across two admin devices. Public Queue state is derived from `turns where status in ('waiting','called') order by turn_number asc`; the first `called` row is the active Turn, the rest are waiting.

## Auth / Access Model

Anonymous users may read public-safe Barbershop fields (`name`, `slug`, `theme_settings`) and create Remote Turns against `/b/:slug`. Authenticated admins may read Queue management data, create Walk-ins, execute Next, and read stats only if they hold a membership for that `barbershop_id`. Future RLS direction: public `select` on safe projections/views, public `insert` on Remote Turn creation with constraints, and membership-based policies for admin tables/actions.

## Realtime Design

Supabase Realtime subscribes to `turns` for a single `barbershop_id`. Events do not become the source of truth; they trigger targeted `queryClient.invalidateQueries` for Queue and stats keys. Mutations use Query for success/error handling, while Zustand only stores transient UI state. This keeps server data single-sourced and consistent with AGENTS rules.

## Theming Design

MVP ships with neutral default tokens. `barbershops.theme_settings` stores future tenant values (primary, accent, surface, logo URL), applied as CSS variables at the route layout level. Defer theme editor UI, advanced branding presets, and per-component variants.

## Testing Design

- Unit: time grouping helpers, Queue selectors, Zod schemas, auth guards.
- Integration: Supabase service adapters, `usePublicQueue`, `useAdminQueue`, `useAttendStats`, and Next mutation/realtime invalidation with MSW.
- Component: public Queue board, Remote join form, admin Queue controls, stats filters.

Critical first flows: anonymous join, Walk-in creation, Next race-safe behavior, cross-tab Queue refresh, and Colombia timezone stats.

## File Changes

| File                                                                 | Action | Description                                   |
| -------------------------------------------------------------------- | ------ | --------------------------------------------- |
| `src/app/router.tsx`                                                 | Create | Tenant-aware public/admin routing             |
| `src/services/supabase/{client,auth,queue,stats,realtime}.ts`        | Create | Data access and subscriptions                 |
| `src/hooks/use{PublicQueue,AdminQueue,QueueRealtime,AttendStats}.ts` | Create | Query/realtime composition                    |
| `src/pages/{public,admin}/*`                                         | Create | Route screens                                 |
| `supabase/migrations/*`                                              | Create | Schema, constraints, indexes, RLS scaffolding |

## Open Questions / Deferred Decisions

- [x] Admin login: email/password implemented (not email link).
- [ ] Cancelled Turns: no reason field — deferred to future iteration.
- [x] Stats: implemented via service functions (`getAttendedStats`) — neither SQL views nor RPCs, but compatible with both if needed later.
