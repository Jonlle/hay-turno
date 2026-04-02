# HayTurno — Agent Instructions

HayTurno is a mobile-first queue management MVP for single-chair barbershops in Barranquilla, Colombia. The product is real-time, zero-download, and designed to evolve from one shop to future multi-tenant operation.

## Product Context

- Market: micro-barbershops with 1 chair
- Region: Barranquilla, Colombia
- Main value: visible queue for Remote clients and fast queue control for Walk-ins
- Core users: Client (Remote), Client (Walk-in), Barber/Manager, Owner

## Approved Stack

- **Language**: TypeScript with strict mode
- **Frontend**: React 18+ with Vite
- **Routing**: React Router
- **Styling**: Tailwind CSS v4
- **UI primitives**: shadcn/ui (minimal MVP usage only)
- **Forms**: React Hook Form + Zod
- **Server state**: TanStack Query
- **Client/UI state**: Zustand
- **Realtime + Auth + DB**: Supabase (Auth, Realtime, PostgreSQL)
- **Charts / stats**: Recharts
- **Date handling**: date-fns + date-fns-tz
- **Notifications**: Sonner
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library + MSW
- **Package manager**: pnpm
- **Hosting**: Vercel

## Build / Dev Commands

```bash
pnpm dev          # Start Vite dev server
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm test         # Run all tests
pnpm test:watch   # Run tests in watch mode
pnpm test:ui      # Open Vitest UI
pnpm typecheck    # TypeScript type checking
```

### Run a Single Test

```bash
# By file path
pnpm vitest run src/schemas/turn.test.ts

# By test name
pnpm vitest run -t "should add turn to queue"

# By file + test name
pnpm vitest run src/hooks/useQueue.test.ts -t "handles next turn"
```

## Installed Skills — Source of Truth

The following installed skills already contain detailed implementation guidance. Do **not** duplicate those instructions in this file; follow the skill directly.

| Skill                                | Use for                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| **shadcn**                           | shadcn/ui component usage, composition, minimal primitive selection          |
| **supabase-postgres-best-practices** | Schema design, SQL, indexes, RLS, concurrency, Postgres performance          |
| **vercel-react-best-practices**      | React architecture, rendering, async/data-fetching, component discipline     |
| **web-design-guidelines**            | Accessibility, touch UX, mobile-first UI, forms, theming, web quality audits |
| **git-commit**                       | Conventional commits, diff analysis, message generation                      |

> Full registry: `.atl/skill-registry.md`

## Project-Specific Rules

These rules are specific to HayTurno and remain authoritative even when skills are installed.

### Domain Vocabulary

Use these exact terms in code, UI, docs, and database naming:

| Term         | Meaning                                       |
| ------------ | --------------------------------------------- |
| `Turn`       | A client's position in the queue              |
| `Queue`      | Ordered list of turns for one barbershop      |
| `Next`       | Action that advances service to the next Turn |
| `Walk-in`    | Client registered manually at the shop        |
| `Remote`     | Client joining through QR or link             |
| `Barbershop` | Tenant / shop boundary                        |

Do not invent synonyms like `ticket`, `line`, `customerSlot`, or `appointment` for queue turns.

### Multi-Tenant Readiness

- Every business entity must be scoped by `barbershop_id` or a membership relation to a barbershop
- Do not assume one user belongs to only one barbershop forever
- Prefer `barbershops`, `profiles`, and `barbershop_memberships` over a flat single-shop user model
- Public routes use `/b/:slug`, admin routes use `/admin/:slug`

### Theming Rules

- Build MVP UI with neutral defaults, keep theme decisions tenant-configurable
- Use CSS variables / design tokens (`--ht-primary`, `--ht-accent`, `--ht-surface`) for tenant branding
- Do not hardcode brand colors across components
- Do not build a full design system yet; use shadcn/ui minimally for MVP speed

### State Boundaries

- TanStack Query owns server data
- Zustand owns UI-only state (drawers, filters, optimistic flags)
- Realtime subscriptions belong in hooks or services, not scattered through components
- Do not mirror Supabase server data into Zustand as the primary source of truth

### Stats and Time Rules

- Stats must support **day**, **week**, and **month** views for admins
- Time grouping must respect **Colombia timezone** (`America/Bogota`), not browser-local assumptions
- Stats are based on completed / attended Turns (`status = 'attended'`), not just created Turns

### Error Handling

- Never swallow errors silently
- Show safe user-facing feedback; do not expose raw backend errors in UI
- Log useful details during development

### Security Rules

- Public queue pages can be anonymous
- Admin pages and stats must require authenticated access
- Never expose admin-only data on public routes
- Design database access with future RLS in mind from the beginning

## Project Structure

```text
src/
├── app/
│   ├── providers.tsx      # QueryClient + Supabase context
│   ├── router.tsx         # Tenant-aware public/admin routing
│   └── theme.ts           # CSS variable mapping from theme_settings
├── components/
│   ├── barber/            # Walk-in form, admin controls
│   ├── queue/             # Public queue board, join form
│   ├── stats/             # Day/week/month charts and filters
│   └── ui/                # Shared primitives
├── hooks/                 # usePublicQueue, useAdminQueue, useQueueRealtime, useAttendStats
├── pages/
│   ├── public/            # /b/:slug, /b/:slug/join
│   └── admin/             # /admin/:slug/login, /admin/:slug/queue, /admin/:slug/stats
├── schemas/               # Zod validation (turn.ts)
├── services/
│   └── supabase/          # client, auth, queue, stats, realtime, barbershops, memberships
├── stores/                # Zustand UI-only state
├── types/                 # Shared TypeScript types
└── utils/                 # time.ts (Colombia timezone grouping)
```

Supabase migrations live in `supabase/migrations/`.

## Commit / PR Rules

- Use conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`) — follow the **git-commit** skill for message format and staging
- Atomic commits: one logical change per commit
- One logical change per PR — create a branch for each logical change or SDD phase
- New hooks and services should include tests
- UI changes should include mobile validation evidence when relevant
- Never add AI attribution to commits or PRs

## Agent Behavior Expectations

- Prefer simple MVP solutions that preserve future tenant scalability
- Do not introduce heavy abstractions before repeated need appears
- Keep public queue flows frictionless
- Keep admin flows fast, obvious, and mobile-friendly
- When a rule is covered by an installed skill, use the skill instead of duplicating or inventing project-local variants
- Full SDD planning artifacts are in `docs/sdd/` (proposal, design, spec, tasks)
