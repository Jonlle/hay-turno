# Tasks: HayTurno MVP Foundation

## Phase 1: Foundation

- [x] 1.1 Create `src/app/providers.tsx`, `src/services/supabase/client.ts`, and env typing to bootstrap Query + Supabase in one place.
- [x] 1.2 Add `supabase/migrations/0001_mvp_foundation.sql` for `barbershops`, `profiles`, `barbershop_memberships`, and `turns` with constraints, indexes, and `barbershop_id` scoping.
- [x] 1.3 Add `supabase/migrations/0002_queue_access.sql` with RLS/policies for public Queue reads, Remote Turn inserts, and membership-gated admin access.
- [x] 1.4 Create `src/schemas/turn.ts`, `src/utils/time.ts`, and `src/app/theme.ts` for Turn validation, Colombia timezone grouping, and CSS variable mapping from `theme_settings`.
- [x] 1.5 Write `src/schemas/turn.test.ts` and `src/utils/time.test.ts` for form validation and day/week/month grouping.

## Phase 2: Data Services

- [x] 2.1 Create `src/services/supabase/barbershops.ts` and `queue.ts` for slug lookup, public Queue reads, Remote join, and Walk-in creation.
- [x] 2.2 Add `supabase/migrations/0003_next_rpc.sql` implementing race-safe `Next` for one `barbershop_id` and returning affected Turns.
- [x] 2.3 Create `src/services/supabase/auth.ts` and `memberships.ts` to resolve session, membership, and role checks for `/admin/:slug/*`.
- [x] 2.4 Create `src/services/supabase/stats.ts` and `realtime.ts` for attended-Turn aggregates and Barbershop-scoped subscriptions.
- [x] 2.5 Write service tests for queue, auth, and stats with vi.mock (30 tests).

## Phase 3: Routes and UI

- [x] 3.1 Create `src/app/router.tsx` with `/b/:slug`, `/b/:slug/join`, `/admin/:slug/login`, `/admin/:slug/queue`, and `/admin/:slug/stats` plus auth/tenant guards.
- [x] 3.2 Create `src/hooks/usePublicQueue.ts`, `useAdminQueue.ts`, `useQueueRealtime.ts`, and `useAttendStats.ts` to wrap Query keys, mutations, and invalidation.
- [x] 3.3 Build `src/pages/public/*` and `src/components/queue/*` for public Queue view, not-found state, and Remote join form.
- [x] 3.4 Build `src/pages/admin/*`, `src/components/barber/*`, and `src/components/stats/*` for login gate, Walk-in form, `Next`, and day/week/month stats.
- [x] 3.5 Apply mobile-first layout and neutral CSS variables in `src/index.css` so core flows work at 360px without exposing admin-only data.

## Phase 4: Integration Verification

- [x] 4.1 Add component tests for public Queue load, invalid slug, and Remote join validation/success (8 tests).
- [x] 4.2 Add component/integration tests for admin authorization, Walk-in registration, and single-advance `Next` behavior (14 tests).
- [x] 4.3 Add realtime/stats tests proving Queue refresh across views, Colombia-timezone aggregation, and cross-Barbershop isolation (8 tests).

## Summary

All 17 tasks complete. **75 tests passing** across 13 test files. MVP functional with polish: public queue, remote join, admin login, walk-in, next (including finish without queue), cancel turn, stats, realtime, theme customization, dev seed environment, and neutral Colombian Spanish.
