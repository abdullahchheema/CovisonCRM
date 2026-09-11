# Rewrite TODO

Living tracker for the Next.js + Supabase rewrite (`web/`, branch `web-app`).
Update this file whenever a task starts, finishes, or gets descoped,
don't let it drift from reality. Check items off in place rather than
deleting them, so history of what shipped stays visible.

## Action needed from you (not engineering work)

- [x] Apply migrations `20260905000003` through `20260905000009` to the live
      Supabase project, done (confirmed indirectly: the seed script inserts
      into tickets/projects/email_groups/saved_views successfully).
- [x] Apply `20260906000001_lead_types_and_custom_fields`, done.
- [x] Apply `20260911000001_fix_invite_pgcrypto_search_path`, done and
      confirmed working (invite flow tested).
- [x] Apply `20260911000002_contacted_stage_and_auto_move`, done. Its
      behavior has since been revised, see the next item.
- [ ] Apply `20260911000003_contact_auto_create_first_stage` to the live
      Supabase project. Revises 20260911000002: that one added a dedicated
      "Contacted" stage and only moved an *existing* deal into it; what was
      actually wanted was simpler, a contacted lead with no deal yet gets
      one created fresh in the pipeline's actual first stage ("Lead" in the
      default seed), and a contact who already has an open deal is left
      wherever it's been manually moved to. This migration removes the
      "Contacted" stage 002 added (moving anything already in it back to
      the first stage first, so the FK doesn't block the drop) and replaces
      `mark_contact_contacted()` accordingly.
- [ ] Create a Resend account, add `RESEND_API_KEY` (and `RESEND_FROM_EMAIL`
      once a sending domain is verified in Resend) as env vars in Vercel.
      Without `RESEND_API_KEY`, "Send email" fails with a clear
      "no email provider configured" error rather than silently no-op'ing.
      Until a domain is verified, `RESEND_FROM_EMAIL` falls back to
      Resend's shared `onboarding@resend.dev`, which only delivers to the
      email the Resend account itself signed up with, fine for a first
      test send, not for real contacts.
- [ ] Apply `20260911000004_follow_up_sequences` to the live Supabase
      project. Adds the three tables and two RPCs behind the new
      Emails → Follow-ups feature, see the Done entry below.
- [ ] Set `CRON_SECRET` (any random value, e.g. `openssl rand -hex 32`) as
      a Vercel env var, matching value the daily follow-up cron checks for.
      Vercel automatically sends it as a Bearer token to cron-triggered
      requests once set; without it, `/api/cron/follow-ups` always 401s
      and no follow-up ever sends, even with steps due.
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` (Supabase dashboard → Project
      Settings → API) as a Vercel env var. The follow-up cron has no
      signed-in user for RLS to check against, so it's the one place in
      the app that needs this. Never used anywhere else.
- [ ] Run `supabase gen types typescript` against the live project after
      applying the migrations above, to replace the hand-added
      `mark_contact_contacted`/`enroll_contact_in_sequence`/
      `stop_enrollment`/follow_up_* entries in `database.types.ts` (added
      by hand this session since regenerating needs live DB access) with
      the real generated ones.
- [ ] Vercel: set Production Branch to `web-app` (Project Settings → Git).
      Pushes currently deploy as *Preview* only, so the live URL keeps
      serving an older commit until each deployment is promoted by hand.
- [ ] Supabase Auth → URL Configuration: confirm Site URL and Redirect URLs
      point at the live Vercel domain. Never verified after the original
      localhost:3000 OAuth misredirect; the stray `?code=...` seen on the
      homepage suggests it may still be wrong.
- [ ] Replace the placeholder text on `/privacy` and `/terms` with real,
      reviewed policy text before the app handles real user data. Both
      pages carry a visible placeholder banner until then.
- [ ] Optional: re-cut the logo as a true vector. `public/logo-mark.png` is
      a 512px raster traced out of the supplied JPEG (background removed).
      It's sharp at every size the app currently renders it, so this is
      polish, not a defect, worth doing if the mark ever needs to go large
      (print, billboard, big hero lockup).
- [ ] Decide on merging `hotfix/w0-security-hardening` into `master` (legacy
      Go app security patches, JWT leak, permission checks, token expiry).
      Merging triggers a live deploy of the old app, so left for your call.
- [ ] Functional regression pass on the deployed app, the items that need a
      real browser session and can't be driven from here: Google OAuth
      round trip preserving `?next=`, signed-out redirect, brand-new-user
      onboarding, `/invite/[token]` flow, and a CRUD/drag/CSV/bulk smoke
      test.

## In progress / next up

Every list view (contacts, companies, deals, tickets, tasks) now has the
same baseline: search/filters, saved views, CSV export, and bulk delete
where the layout supports it. Nothing queued here right now, next
candidates are either in Deferred below (bigger scope, external
accounts) or worth asking the user for direction on:

- [ ] Ticket/task bulk status-change (not just delete), e.g. select
      several tickets and set status to "resolved" in one action.
- [ ] Deals: bulk delete on the pipeline board (cards aren't a
      checkbox-table either, same shape of change as tasks was).

## Deferred, needs an external account or a bigger schema decision

- [ ] Scheduled/recurring template sends (the Frequency/day-of-week/
      day-of-month fields already on the template form). One-time "send
      now" is done, see below; recurring needs a durable job queue on top,
      which this doesn't have yet.
- [ ] Billing/seats (Stripe). M8-sized, no accounts provisioned yet.
- [ ] AI features. M8, explicitly last in the plan.
- [ ] Custom fields as *contacts-list columns*, scoped to a lead-type
      filter. Left out of the lead-types work on purpose: a field belongs
      to one type, so an unscoped column reads "—" for every contact of
      another type.

## Done (recent)

- [x] Follow-up sequences (Emails → Follow-ups): ordered steps (email
      template + days-since-previous-step delay, 7/14/21/30 offered as
      quick-picks but any value works), enroll one or several contacts
      from the Contacts list, a per-sequence detail page listing every
      enrollment with its next-due date (overdue ones called out) and a
      Stop action. A daily Vercel Cron job (`vercel.json`,
      `app/api/cron/follow-ups`) sends whichever step is due using the
      same Resend send path as manual sends, then advances the enrollment
      or marks it completed. Uses a service-role Supabase client
      (`lib/supabase/service-role.ts`) since a cron run has no signed-in
      user, gated by `CRON_SECRET` (see Action needed above); needs both
      that and `SUPABASE_SERVICE_ROLE_KEY` set before it actually runs.
      Modeled on HubSpot Sequences / Salesforce cadences: enroll, timed
      steps, runs until done or manually stopped.
- [x] Real email sending via Resend, replacing the log-only placeholder.
      Per-recipient personalization ({{name}}, {{first_name}}, {{email}},
      {{company}}), click-to-insert placeholder pills in the template
      editor, and `mark_contact_contacted()`: after a send, a contact with
      no open deal yet gets one created fresh in the org's default
      pipeline's first stage; a contact already somewhere in the pipeline
      is left alone, a follow-up email shouldn't undo progress made moving
      it by hand. (First version of this auto-moved an *existing* deal into
      a dedicated new "Contacted" stage instead, revised per the user's
      correction, see migration 20260911000003.) Needs `RESEND_API_KEY` set
      (see Action needed above) to actually send.
- [x] App shell layout fix: sidebar now scrolls independently from the main
      panel instead of both sharing one page-level scroll (was pushing
      Team/Settings far down the sidebar on any tall page).
- [x] Loading-state audit across buttons/forms app-wide: bulk deletes,
      CSV imports, form submits, and team management actions already had
      a pending state; found and fixed the one real gap, the pipeline
      board's inline deal-stage dropdown.
- [x] Brand logo wired in, `public/logo-mark.png` (supplied artwork with
      its white JPEG background cut out) now renders through
      `components/brand/covison-mark.tsx`, so the header, footer, brand
      section, auth shell and login hero all pick it up, as do the
      generated favicon, apple-icon and OG card.
- [x] Marketing artwork on the homepage, hero glow (dark theme only),
      brand-section texture, and four feature illustrations.
- [x] Lead types with per-type custom fields, org-defined types, each
      owning a jsonb field list (text/number/date/dropdown/checkbox,
      required flag, reorderable); `contacts.lead_type_id` +
      `custom_fields`. Self-serve builder at `/lead-types`, dynamic fields
      in the contact create/edit dialogs, a per-type section on the detail
      page, and lead type as a list filter/column. Replaces the old
      "custom fields (per-org field registry)" deferred item.
- [x] Send email to one contact or a whole group, picking a template,
      logs an activity per recipient (no provider connected yet).
- [x] Per-user contacts column customization (show/hide/reorder, saved
      through the existing saved-views `filters` JSON).
- [x] Complete visual reinvention, 10 phases, design tokens, component
      system, app shell, dashboard, list views, detail pages/boards, the
      remaining screens, auth/login, the public marketing site, and a
      mobile drawer + accessibility pass. Typography later switched to a
      single bold Geist family at the user's request.
- [x] Public marketing site at `/` with generated favicon/OG image, plus
      `/privacy` and `/terms` (placeholder legal text, clearly labelled).
- [x] Bulk delete on tasks (TaskRow gained an optional selection
      checkbox).
- [x] CSV import for companies.
- [x] Search, CSV export, and saved views on the pipeline board (deals),
      the last list view without this treatment.
- [x] CSV export on tickets and tasks; bulk delete + select-all on
      tickets (matches contacts/companies).
- [x] Saved views + client-side search/priority filters on tasks
      (replaces the old server-driven `?mine=1`-only page).
- [x] Saved views extended to companies and tickets (contacts was first).
- [x] Activity/notes timeline on ticket and project detail pages,
      activities.ticket_id added, CHECK constraint extended, project_id FK
      finished (was reserved with no FK since the projects table didn't
      exist yet when activities was first created).
- [x] CSV import for contacts, column mapping, per-row validation,
      company auto-create, chunked inserts (papaparse).
- [x] Saved views on contacts (team-shareable, generic component/schema
      ready for other list pages).
- [x] In-app notifications (assignment-triggered, SECURITY DEFINER
      triggers, recipient-scoped RLS, polling bell in the header).
- [x] Contact field parity: priority, expected revenue/close, probability,
      LinkedIn, website, city/country, niche, schema already had these,
      no form exposed them until now.
- [x] Tickets module (list, detail, create/edit, filters, ⌘K entry).
- [x] Projects module, nested kanban (columns + cards, both sortable,
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
  UI against it. The shim script and two-tenant RLS test pattern are
  reusable (see git history for `supabase/migrations/20260905*` commits).
- `Relationships: []` is required on every hand-authored table type in
  `database.types.ts`, or `.from()` calls silently degrade to `never`.
