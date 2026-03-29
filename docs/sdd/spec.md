# HayTurno MVP Foundation Specification

## Purpose

Define the initial MVP behavior for a tenant-aware, mobile-first Queue system for single-chair Barbershops.

## Requirements

### Requirement: Public Queue View

The system MUST expose `/b/:slug` without login and show only the selected Barbershop name, current called Turn, waiting Turns, and Queue availability.

#### Scenario: Public Queue loads for a valid Barbershop

- GIVEN an active Barbershop slug with waiting or called Turns
- WHEN a Remote user opens `/b/:slug`
- THEN the page shows only that Barbershop Queue ordered by Turn sequence
- AND it does not reveal admin-only fields or other Barbershops

#### Scenario: Invalid Barbershop slug

- GIVEN a slug that does not map to an active Barbershop
- WHEN a user opens `/b/:slug`
- THEN the system SHALL show a safe not-found state

### Requirement: Remote Join Flow

The system MUST allow an anonymous Remote user to create one waiting Turn from `/b/:slug/join` with required client name validation and Barbershop scoping.

#### Scenario: Remote user joins Queue

- GIVEN an active Barbershop accepts Queue joins
- WHEN a valid Remote form is submitted
- THEN the system creates a waiting Turn with source `remote`
- AND the Turn appears in that Barbershop Queue

#### Scenario: Remote join validation fails

- GIVEN an incomplete or invalid form
- WHEN the user submits it
- THEN the system MUST reject the Turn and show actionable feedback

### Requirement: Admin Authentication

The system MUST require authenticated access for `/admin/:slug/*` and SHALL authorize only users with `owner` or `manager` membership for that Barbershop.

#### Scenario: Authorized admin enters Queue controls

- GIVEN an authenticated user with membership for the route Barbershop
- WHEN they open `/admin/:slug/queue`
- THEN the system grants access to Queue controls

#### Scenario: Unauthorized admin access

- GIVEN a user without a valid membership for that Barbershop
- WHEN they request an admin route
- THEN the system MUST deny access

### Requirement: Walk-in Registration

The system MUST let an authorized admin create a waiting Turn with source `walk-in` for the current Barbershop.

#### Scenario: Admin registers Walk-in

- GIVEN an authorized admin on `/admin/:slug/queue`
- WHEN they submit a valid Walk-in form
- THEN a new waiting Turn is added to that Barbershop Queue

### Requirement: Next Action

The system MUST provide a `Next` action that atomically completes the current called Turn as attended, promotes the oldest waiting Turn to called, and prevents double advancement.

#### Scenario: Next advances Queue once

- GIVEN one called Turn and one or more waiting Turns in a Barbershop
- WHEN an authorized admin triggers `Next`
- THEN exactly one Turn becomes `attended` and the oldest waiting Turn becomes `called`

#### Scenario: Concurrent Next requests

- GIVEN two admin devices trigger `Next` nearly simultaneously
- WHEN both requests reach the backend
- THEN the Queue state SHALL reflect only one ordered advancement

### Requirement: Stats Views

The system MUST expose `/admin/:slug/stats` with day, week, and month views derived only from attended Turns grouped in Colombia timezone.

#### Scenario: Admin changes stats range

- GIVEN attended Turns exist across multiple dates
- WHEN the admin selects day, week, or month
- THEN totals SHALL reflect only `attended` Turns for that Barbershop in Colombia timezone

### Requirement: Realtime Synchronization

The system MUST synchronize Queue and stats changes across subscribed devices for the same Barbershop within about 1 second of backend confirmation.

#### Scenario: Public and admin views refresh after mutation

- GIVEN one public device and one admin device on the same Barbershop
- WHEN a Turn is joined, registered, or advanced
- THEN both devices SHALL reflect the updated Queue without manual reload

### Requirement: Tenant Boundaries

The system MUST scope routes, reads, writes, and realtime events to exactly one Barbershop identified by slug and internal Barbershop membership/data relations.

#### Scenario: Cross-tenant isolation

- GIVEN two Barbershops with separate Turns and admins
- WHEN activity occurs in one Barbershop
- THEN the other Barbershop Queue and stats remain unchanged

## Non-Functional Requirements

- The UI MUST be mobile-first and usable at 360px width without horizontal scrolling for core flows.
- Public Queue load and admin action feedback SHOULD begin within 2 seconds on a normal mobile connection.
- User-facing errors MUST be safe, actionable, and MUST NOT expose raw backend details.
- Public routes MUST NOT expose admin-only data; admin routes and stats MUST require authentication.
- Data design MUST remain Barbershop-scoped and ready for future multi-Barbershop growth and theme settings via CSS variables.

## Explicit Non-Goals

- Multi-chair Queue logic
- Appointment scheduling, payments, and notifications
- Full tenant branding editor
- Multi-Barbershop owner management UX
- Public client accounts or login
