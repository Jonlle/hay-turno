# HayTurno — Technical Exploration (Fase 0)

> Archived note: this was an early exploration document and contains superseded decisions.
> Current source of truth is `docs/sdd/` and `AGENTS.md`.

## Executive Summary

**HayTurno** is a zero-download, mobile-first queue management MVP for single-chair barbershops in Barranquilla. After investigating four critical technical decisions, the recommendation is: **Supabase Realtime** for backend, **no auth (public queue with barber admin URL)** for security, **persisted PostgreSQL database** for data architecture, and **Vercel** for deployment. This stack minimizes infrastructure cost, maximizes developer velocity, and keeps the MVP path laser-focused on solving the barbershop queue problem without over-engineering.

---

## 1. Real-time Backend: Supabase Realtime vs Firebase Realtime Database

### Decision Matrix — Supabase vs Firebase

| Criterion                | Supabase Realtime                                         | Firebase Realtime DB                     | Weight |
| ------------------------ | --------------------------------------------------------- | ---------------------------------------- | ------ |
| **Free tier generosity** | 500MB DB, unlimited API calls, 50K MAUs                   | 1GB storage, 50K daily reads (hard cap)  | High   |
| **Real-time latency**    | <50ms (PostgreSQL LISTEN/NOTIFY)                          | ~80ms (proven at massive scale)          | High   |
| **TypeScript SDK**       | Excellent (`@supabase/supabase-js`, auto-generated types) | Good (mature but no auto type-gen)       | Medium |
| **Setup complexity**     | Low (SQL-first, familiar patterns)                        | Low (JSON document model)                | Medium |
| **Vendor lock-in**       | Low (standard PostgreSQL, self-hostable)                  | High (proprietary Firestore format)      | High   |
| **Offline/reconnection** | Basic (WebSocket reconnection)                            | Excellent (offline persistence built-in) | Low    |
| **Colombia latency**     | Good (AWS regions near LATAM)                             | Good (Google Cloud CDN)                  | Medium |

### Scoring (1-5, higher = better for HayTurno MVP)

| Criterion             | Supabase | Firebase |
| --------------------- | -------- | -------- |
| Cost at MVP scale     | **5**    | 3        |
| Real-time reliability | 4        | **5**    |
| TypeScript DX         | **5**    | 4        |
| Setup simplicity      | **5**    | 4        |
| Lock-in risk          | **5**    | 2        |
| **Total**             | **24**   | **18**   |

### Recommendation: **Supabase Realtime**

**Why**: Supabase wins on three critical MVP dimensions: (1) free tier has NO daily read/write caps—Firebase's 50K daily reads limit would throttle a moderately-used barbershop queue within hours; (2) PostgreSQL foundation means we write standard SQL, not Firestore's proprietary query language; (3) auto-generated TypeScript types from DB schema eliminate an entire class of runtime errors. Firebase's offline advantage matters for mobile apps with intermittent connectivity, but HayTurno is a web app where users have WiFi/LTE in a barbershop.

**Risks**:

- Supabase's real-time is less battle-tested at extreme scale (irrelevant for single-chair barbershops)
- If we ever need push notifications, we'd need to add a separate service (Firebase Cloud Messaging or OneSignal)

---

## 2. Authentication Strategy: No Auth vs Simple Auth vs Full Auth

### Decision Matrix — No Auth vs Simple vs Full

| Approach                         | Description                                                                          | MVP Complexity | Security Level |
| -------------------------------- | ------------------------------------------------------------------------------------ | -------------- | -------------- |
| **No auth (public queue)**       | Queue is fully public via URL. Barber controls via a secret admin URL or simple PIN. | ⭐ Lowest      | Low            |
| **Simple auth (barber only)**    | Barber logs in with email/password. Queue remains public for clients.                | ⭐⭐ Low       | Medium         |
| **Full auth (barber + clients)** | Both barber and clients authenticate.                                                | ⭐⭐⭐ High    | High           |

### Analysis

**Can the queue be fully public?** YES. The queue data (turns, positions) is not sensitive—clients in a barbershop already see who's ahead of them physically. The only thing worth protecting is the barber's "Next" button and the ability to add walk-ins.

**Does the barber need to log in?** For MVP: NO. A secret admin URL like `/barber/abc123-admin` with a simple PIN or just the URL itself is sufficient. Nobody will brute-force guess a UUID-based admin path. We can add proper auth in v2.

**What's the minimum viable auth?**

```text
Public URL:    https://hayturno.com/barberia-juan
Admin URL:     https://hayturno.com/barberia-juan/admin?k=secret-key
```

The admin key is a long random string embedded in the URL. The barber bookmarks this URL. That's it.

### Scoring (1-5)

| Approach    | Simplicity | Security | MVP Speed | User Experience                   |
| ----------- | ---------- | -------- | --------- | --------------------------------- |
| No auth     | **5**      | 2        | **5**     | **5** (zero friction for clients) |
| Simple auth | 3          | 4        | 4         | 4                                 |
| Full auth   | 1          | 5        | 2         | 2                                 |

### Recommendation: **No auth (public queue) + Admin URL for barber**

**Why**: The MVP goal is ZERO friction. Clients scan a QR → see the queue → done. No login, no signup, no password. The barber gets a special URL with an embedded secret key that unlocks admin controls. This is how Notion's share links work, how Calendly's admin links work—proven pattern. We can add Supabase Auth for the barber in v2 when we need multi-barber support or analytics.

**Risks**:

- If the admin URL leaks, anyone can advance the queue → Mitigation: add a simple 4-digit PIN in v1.1
- No audit trail of who made changes → Acceptable for MVP single-barber scenario

---

## 3. Data Architecture

### 3.1 In-Memory vs Persisted Database

| Aspect                   | In-Memory (server)             | Persisted (Supabase PostgreSQL) |
| ------------------------ | ------------------------------ | ------------------------------- |
| Survives server restarts | ❌ No                          | ✅ Yes                          |
| Cost at MVP              | $0 (needs custom server)       | $0 (Supabase free tier)         |
| Complexity               | Medium (need WebSocket server) | Low (Supabase handles it)       |
| Multi-device sync        | Manual implementation          | Built-in via Realtime           |

**Decision**: **Persisted in Supabase PostgreSQL**. The free tier (500MB) is more than enough for queue data. No need to manage a custom WebSocket server.

### 3.2 Barbershop Identification

**Recommended**: URL slug + UUID hybrid

```text
Public:  https://hayturno.com/{slug}          → /barberia-juan
Admin:   https://hayturno.com/{slug}/admin?k={uuid}  → /barberia-juan/admin?k=a1b2c3d4-...
```

- `slug`: Human-readable, SEO-friendly, used for public queue view
- `uuid`: Server-generated, embedded in admin URL, used for write operations
- Lookup: `SELECT * FROM barbershops WHERE slug = 'barberia-juan'`

### 3.3 Turn Lifecycle & Required Fields

```text
Turn Status Flow:
  created → waiting → in-chair → done
     ↓
  (auto-expire after X hours)
```

**Core Fields**:

```typescript
interface Turn {
  id: string; // UUID, primary key
  barbershop_id: string; // FK to barbershops
  client_name: string; // Display name (e.g., "Juan P.")
  client_type: "walk-in" | "remote"; // How they joined
  position: number; // Queue order (1-based)
  status: "waiting" | "in-chair" | "done";
  created_at: string; // ISO timestamp
  started_at: string | null; // When status → 'in-chair'
  completed_at: string | null; // When status → 'done'
  estimated_wait_minutes: number; // Calculated field
}

interface Barbershop {
  id: string; // UUID
  slug: string; // URL slug (unique)
  admin_key: string; // Secret for admin access
  name: string; // Display name
  avg_service_minutes: number; // For wait time estimation (default: 20)
  created_at: string;
}

interface Queue {
  barbershop_id: string;
  current_turn: Turn | null; // Who's in the chair
  waiting_turns: Turn[]; // Ordered by position
  total_waiting: number;
  estimated_wait_minutes: number; // Sum of avg_service for turns ahead
}
```

### 3.4 Cleanup Strategy

**Recommended**: Auto-expire via PostgreSQL function + pg_cron (Supabase supports this)

```sql
-- Daily cleanup at midnight (Colombia time, UTC-5)
SELECT cron.schedule(
  'cleanup-old-turns',
  '0 5 * * *',  -- 5 AM UTC = midnight Colombia
  $$UPDATE turns SET status = 'done' WHERE status != 'done' AND created_at < NOW() - INTERVAL '1 day'$$
);
```

Alternative: Mark turns as done when barbershop "closes" (manual action in admin panel).

---

## 4. Deployment & Hosting

### Decision Matrix — Vercel vs Netlify vs Cloudflare

| Platform             | Free Tier                                 | React SPA Support         | Cold Starts            | Global CDN     | Colombia Latency |
| -------------------- | ----------------------------------------- | ------------------------- | ---------------------- | -------------- | ---------------- |
| **Vercel**           | 100GB bandwidth, 100 builds/day           | ⭐⭐⭐ Best (zero-config) | ~250ms (serverless)    | ✅             | Good             |
| **Netlify**          | 100GB bandwidth, 300 build mins           | ⭐⭐ Great                | ~250ms                 | ✅             | Good             |
| **Cloudflare Pages** | **Unlimited bandwidth**, 500 builds/month | ⭐⭐ Good                 | **~0ms** (V8 isolates) | ✅ (300+ PoPs) | Excellent        |

### Scoring (1-5 for React SPA MVP)

| Criterion            | Vercel | Netlify | Cloudflare Pages |
| -------------------- | ------ | ------- | ---------------- |
| Setup simplicity     | **5**  | 4       | 3                |
| Free tier generosity | 4      | 4       | **5**            |
| Edge performance     | 4      | 4       | **5**            |
| React ecosystem      | **5**  | 4       | 4                |
| Custom domain ease   | **5**  | **5**   | **5**            |
| **Total**            | **23** | 21      | **22**           |

### Recommendation: **Vercel**

**Why**: Vercel has the tightest React/Vite integration (zero-config deployment), preview deploys on every PR, and the simplest custom domain setup. For a React SPA (not Next.js), Vercel still excels—the framework auto-detection works perfectly with Vite. Cloudflare Pages is a close second with its unlimited bandwidth, but Vercel's DX (developer experience) edge wins for MVP speed.

**Where does the real-time backend live?** Supabase hosts the PostgreSQL database and Realtime server. Our Vercel deployment is just the static React SPA. The architecture is:

```text
[Mobile Browser] → [Vercel CDN (React SPA)] → [Supabase (PostgreSQL + Realtime)]
```

### QR Code Generation

**Recommended**: `qrcode.react` (4.2M weekly downloads, battle-tested)

- Client-side generation: no server needed
- Generate QR for: `https://hayturno.com/{barbershop-slug}`
- Barber prints/stickers the QR in their shop
- Static URL—no dynamic generation needed

```tsx
import { QRCodeSVG } from "qrcode.react";

function BarberShopQR({ slug }: { slug: string }) {
  const url = `https://hayturno.com/${slug}`;
  return <QRCodeSVG value={url} size={200} />;
}
```

### Custom Domain Considerations for Colombia

- `.com.co` domains: ~$15-25/year (recommended for local trust)
- `.com` domains: ~$12/year (global recognition)
- Vercel supports custom domains with automatic HTTPS
- Recommendation: Start with Vercel subdomain (`hayturno.vercel.app`), add custom domain when revenue supports it

---

## Domain Model Sketch (TypeScript Interfaces)

```typescript
// src/types/queue.ts

export interface Barbershop {
  id: string; // UUID, primary key
  slug: string; // URL slug (unique, lowercase, hyphenated)
  admin_key: string; // Secret UUID for admin access
  name: string; // Display name (e.g., "Barbería Juan")
  avg_service_minutes: number; // Default: 20
  created_at: string; // ISO 8601
}

export interface Turn {
  id: string; // UUID
  barbershop_id: string; // FK → Barbershop.id
  client_name: string; // e.g., "Juan P.", "María"
  client_type: TurnType;
  position: number; // 1-based queue position
  status: TurnStatus;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export type TurnType = "walk-in" | "remote";
export type TurnStatus = "waiting" | "in-chair" | "done";

export interface QueueView {
  barbershop_name: string;
  current_turn: Turn | null;
  waiting_turns: TurnSummary[];
  total_waiting: number;
  estimated_wait_minutes: number;
}

export interface TurnSummary {
  id: string;
  client_name: string;
  position: number;
  client_type: TurnType;
}

// DTOs for mutations
export interface CreateTurnDTO {
  client_name: string;
  client_type: TurnType;
}

export interface NextTurnDTO {
  admin_key: string;
}
```

---

## Risks & Tradeoffs

### What We Gain

| Decision                    | Gain                                                     |
| --------------------------- | -------------------------------------------------------- |
| Supabase over Firebase      | 40-60% cheaper at scale, no vendor lock-in, standard SQL |
| No auth (public queue)      | Zero friction for clients, fastest MVP path              |
| Persisted DB over in-memory | Reliability, no custom WebSocket server needed           |
| Vercel over self-hosting    | Zero DevOps, automatic HTTPS, preview deploys            |

### What We Lose

| Decision           | Tradeoff                                | Mitigation                                          |
| ------------------ | --------------------------------------- | --------------------------------------------------- |
| Supabase real-time | Less battle-tested at extreme scale     | Irrelevant for single-chair barbershops             |
| No auth            | Anyone with admin URL can control queue | Add PIN in v1.1, rotate admin key                   |
| Persisted DB       | Supabase free tier has 500MB limit      | Queue data is tiny; won't hit limit for years       |
| Vercel free tier   | 100GB bandwidth limit                   | Static SPA + Supabase handles data; won't hit limit |
| Client-side QR     | Requires JS enabled                     | All modern mobile browsers support JS               |

---

## Key Learnings (Non-Obvious Discoveries)

1. **Supabase free tier has NO daily read/write caps** — Firebase's 50K daily reads would throttle a busy barbershop queue within hours. This is the deciding factor for MVP.

2. **PostgreSQL LISTEN/NOTIFY via WebSockets achieves <50ms sync** — More than fast enough for queue updates. No need for Firebase's infrastructure.

3. **URL-based admin access is a proven pattern** — Notion, Calendly, and many SaaS products use secret URLs for sharing/admin. No need for auth in MVP.

4. **Supabase auto-generates TypeScript types from DB schema** — Eliminates manual type definitions and ensures DB/client type safety. Firebase doesn't offer this.

5. **Cloudflare Pages has unlimited bandwidth on free tier** — But Vercel's DX for React is superior. For MVP, DX > bandwidth savings.

6. **qrcode.react generates QR codes entirely client-side** — No server-side generation needed. Barber just prints the QR from the admin panel.

7. **pg_cron in Supabase can auto-expire old turns** — No need for a cleanup job or cron service. One SQL function handles daily cleanup.

---

## Implementation Priority (for next phases)

1. **Phase 1 - Core Queue**: Supabase project + React SPA + basic queue CRUD
2. **Phase 2 - Real-time**: Supabase Realtime subscriptions for live queue updates
3. **Phase 3 - Admin Panel**: Secret admin URL with PIN, walk-in registration
4. **Phase 4 - QR & Polish**: QR code generation, mobile-optimized UI, estimated wait times

---

## Next Steps for Orchestrator

This exploration is **ready for proposal**. The technical decisions are clear:

- ✅ Backend: Supabase
- ✅ Auth: No auth (public queue + admin URL)
- ✅ Data: PostgreSQL with the interfaces above
- ✅ Deployment: Vercel

The orchestrator should proceed to **sdd-propose** to formalize these decisions into a change proposal.
