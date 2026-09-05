# Rewrite TODO

Living tracker for the Next.js + Supabase rewrite (`web/`, branch `web-app`).
Update this file whenever a task starts, finishes, or gets descoped —
don't let it drift from reality. Check items off in place rather than
deleting them, so history of what shipped stays visible.

## Action needed from you (not engineering work)

- [ ] Apply migrations `20260905000003` through `20260905000009` to the live
      Supabase project (SQL Editor, same as the first 15) — tickets,
      projects/kanban, email groups/templates, notifications, saved views,
      and the activities extension (ticket_id + project_id FK) schema +
      RLS. Re-run `supabase/tests/rls_meta.sql` after; both queries must
      return 0 rows.
- [ ] Decide on merging `hotfix/w0-security-hardening` into `master` (legacy
      Go app security patches — JWT leak, permission checks, token expiry).
      Merging triggers a live deploy of the old app, so left for your call.
- [ ] Google OAuth / email-password auth already verified working end to end.

## In progress / next up

- [ ] Bulk delete on tasks — its rows are a card list (TaskRow), not a
      checkbox-table like contacts/companies/tickets, so this needs a
      small layout change first rather than being prop-plumbing.
- [ ] CSV import for companies (contacts is the only entity with import
      so far).

## Deferred — needs an external account or a bigger schema decision

- [ ] Real email sending (Resend account + durable job queue — M3 in the
      migration plan). Email Groups/Templates UI is built and ready;
      nothing there needs to change when this lands.
- [ ] Custom fields (per-org field registry, not EAV — see migration plan's
      "Deviations from the brief"). M6-sized.
- [ ] Billing/seats (Stripe). M8-sized, no accounts provisioned yet.
- [ ] Marketing site / AI features. M8, explicitly last in the plan.

## Done (recent)

- [x] Search, CSV export, and saved views on the pipeline board (deals) —
      the last list view without this treatment.
- [x] CSV export on tickets and tasks; bulk delete + select-all on
      tickets (matches contacts/companies).
- [x] Saved views + client-side search/priority filters on tasks
      (replaces the old server-driven `?mine=1`-only page).
- [x] Saved views extended to companies and tickets (contacts was first).
- [x] Activity/notes timeline on ticket and project detail pages —
      activities.ticket_id added, CHECK constraint extended, project_id FK
      finished (was reserved with no FK since the projects table didn't
      exist yet when activities was first created).
- [x] CSV import for contacts — column mapping, per-row validation,
      company auto-create, chunked inserts (papaparse).
- [x] Saved views on contacts (team-shareable, generic component/schema
      ready for other list pages).
- [x] In-app notifications (assignment-triggered, SECURITY DEFINER
      triggers, recipient-scoped RLS, polling bell in the header).
- [x] Contact field parity: priority, expected revenue/close, probability,
      LinkedIn, website, city/country, niche — schema already had these,
      no form exposed them until now.
- [x] Tickets module (list, detail, create/edit, filters, ⌘K entry).
- [x] Projects module — nested kanban (columns + cards, both sortable,
      cross-column drag) via `@dnd-kit/sortable`.
- [x] Email Groups + Templates (data management; sending not wired up).
- [x] Owner-assignment "only mine" filters (contacts/companies/deals/tasks).
- [x] CSV export, bulk delete, bulk tag-add, sortable columns on
      contacts/companies tables.
- [x] Sidebar workspace logo display.

## Design conventions worth remembering

- Every tenant-scoped table: `organization_id`, composite `(id, organization_id)`
  unique constraint, composite FKs on every child table, RLS enabled +
  forced, four-policy shape (select/insert/update/delete) per
  `012_rls_policies.sql`'s pattern.
- Verify every schema change against a real local Postgres before writing
  UI against it — the shim script and two-tenant RLS test pattern are
  reusable (see git history for `supabase/migrations/20260905*` commits).
- `Relationships: []` is required on every hand-authored table type in
  `database.types.ts`, or `.from()` calls silently degrade to `never`.
