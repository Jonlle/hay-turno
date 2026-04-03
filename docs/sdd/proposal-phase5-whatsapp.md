# Proposal: Phase 5 — WhatsApp Bot Integration

## Intent

Enable clients to check their queue status and receive real-time updates via WhatsApp by linking the barbershop's WhatsApp Business number to the HayTurno platform.

## Scope

### In Scope

- Meta Cloud API integration (free tier: 1,000 service conversations/month — **as of 2026-04-02, per Meta WhatsApp Business Platform docs; verify current pricing before implementation**)
- Webhook handler for incoming WhatsApp messages
- Phone number matching to active turns in the queue
- Automated keyword-based responses:
  - `estado` / `turno` → "Tu turno es #X, hay Y personas delante tuyo."
  - `unirme` → Link to join the queue remotely
  - `ayuda` → List of available commands
- Barbershop configuration: link WhatsApp Business number in admin settings

### Out of Scope

- Natural language AI processing (deferred to Phase 6)
- Broadcast notifications (e.g., "Estás a 2 turnos")
- Multi-number routing or shared WhatsApp inboxes
- Payment integration via WhatsApp

## Approach

Use **Meta Cloud API** (official WhatsApp API) with a **Vercel Serverless Function** or **Supabase Edge Function** as the webhook handler. When a message arrives, the function:

1. Extracts the sender's phone number.
2. Queries the `turns` table for an active turn matching that phone number.
3. Responds with the current queue status using the WhatsApp Send API.

Phone numbers will be collected during the Remote join flow (optional field initially, then required for WhatsApp features). **Data lifecycle: phone numbers are retained for 90 days after a turn is completed, then anonymized. Users may request deletion at any time. Phone data is never logged in plaintext — masked in audit trails and error logs. Only the barbershop owner and HayTurno admins can access raw phone data.**

## Explicit Decisions

- Use Meta Cloud API (free tier) instead of Twilio to keep costs at $0 for MVP validation.
- Keyword-based commands initially — no AI/NLP until we validate usage patterns.
- Phone number is optional for Remote join, but required to use WhatsApp features.
- Each barbershop links their own WhatsApp Business number (no shared pool).

## Affected Areas

| Area                                       | Impact | Description                                        |
| ------------------------------------------ | ------ | -------------------------------------------------- |
| `supabase/migrations/0004_phone_field.sql` | New    | Add `phone` column to `turns` table                |
| `api/whatsapp-webhook.ts`                  | New    | Vercel Serverless Function to handle Meta webhooks |
| `src/services/whatsapp.ts`                 | New    | WhatsApp API client for sending messages           |
| `src/pages/admin/SettingsPage.tsx`         | New    | UI to link WhatsApp Business number                |
| `src/pages/public/JoinPage.tsx`            | Update | Add optional phone input for Remote join           |

## Risks

| Risk                                 | Likelihood | Mitigation                                                   |
| ------------------------------------ | ---------- | ------------------------------------------------------------ |
| Meta API rate limits or downtime     | Low        | Fallback to email/SMS if available, queue messages for retry |
| Phone number privacy concerns        | Med        | Clear consent UI, GDPR/Colombia data law compliance          |
| Webhook delivery failures            | Low        | Idempotent processing, retry logic in Supabase/Vercel        |
| Barbers don't have WhatsApp Business | High       | Provide setup guide, allow manual linking later              |

## Rollback Plan

1. Disable the webhook endpoint in Vercel/Supabase.
2. **Backup**: Export `turns.phone` to CSV or create `turns_phone_backup` table before any schema changes.
3. **Non-destructive migration**: Make `turns.phone` nullable or add a `phone_deprecated` flag — do NOT drop the column immediately.
4. Revert admin settings UI.
5. **Restore migration**: If needed, re-populate `turns.phone` from backup and re-enable the column.
6. Retain backup for 30 days, then purge.

## Dependencies

- Meta Business Account (free to create)
- WhatsApp Business Number (verified)
- Vercel (Hobby or Pro) for serverless functions, or Supabase Edge Functions
  - **Note**: Vercel Serverless Functions are available on the Hobby plan. Evaluate Hobby plan limits (invocations, duration, memory) against expected webhook workload before mandating Pro.

## Success Criteria

- [ ] Client receives automated reply within 5 seconds of sending a command
- [ ] Barbers can link their WhatsApp Business number in admin settings
- [ ] Works for 100% of active turns with a linked phone number
- [ ] Zero cost for up to 1,000 conversations/month per barbershop
