# Setting up Supabase for Tiny CRM

This is a step-by-step walkthrough for taking the SQL files in
`supabase/migrations/` and turning them into a working, tenant-isolated
Postgres database on Supabase. No prior Supabase experience assumed.

You do **not** need the Supabase CLI or Node installed for this — everything
below uses the web dashboard. There's an optional CLI section at the end for
later, once the app itself is being built.

---

## 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account).
2. Click **New Project**.
3. Pick an organization (Supabase's own concept of "organization" — a
   billing/account grouping, unrelated to the `organizations` table this
   schema creates), give the project a name (e.g. `tinycrm`), set a strong
   database password (**save this somewhere** — you'll need it if you ever
   connect a non-Supabase tool directly to the database), and pick a region
   close to your users.
4. Wait ~2 minutes for provisioning.

## 2. Run the migrations, in order

Every file in `supabase/migrations/` is numbered so it runs in the right
order — each one depends on tables the previous ones created.

1. In the Supabase dashboard, open **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open `supabase/migrations/20260904000001_extensions_and_helpers.sql` in
   this repo, copy its entire contents, paste into the SQL Editor, and click
   **Run**. You should see "Success. No rows returned."
4. Repeat for every file in `supabase/migrations/`, **strictly in filename
   order** (the numbers sort correctly):

   ```
   20260904000001_extensions_and_helpers.sql
   20260904000002_organizations_and_profiles.sql
   20260904000003_members_and_invitations.sql
   20260904000004_companies.sql
   20260904000005_contacts.sql
   20260904000006_tags.sql
   20260904000007_pipelines_and_deals.sql
   20260904000008_tasks.sql
   20260904000009_activities.sql
   20260904000010_audit_logs.sql
   20260904000011_rls_helpers.sql
   20260904000012_rls_policies.sql
   20260904000013_rpc_functions.sql
   20260904000014_auth_hook_and_trigger.sql
   20260904000015_storage.sql
   ```

If any file errors, **stop and fix it before continuing** — later files
depend on earlier ones existing correctly. The most likely mistake is
running them out of order or skipping one.

## 3. Verify RLS is actually on everywhere

Open `supabase/tests/rls_meta.sql`, paste its contents into a new SQL Editor
query, and run it. **Both queries must return zero rows.** If either returns
rows, something is misconfigured — a table without RLS enabled, or RLS
enabled with no policies. Don't proceed to step 4 until this is clean.

## 4. Enable the Custom Access Token Hook

This is the step that makes tenant isolation actually work — without it,
every RLS policy that checks `current_org_id()` will see nothing and block
everything, since the JWT won't carry `active_org_id` yet.

1. In the dashboard, go to **Authentication → Hooks** (sometimes listed
   under Authentication → Attack Protection / Hooks depending on the current
   dashboard version — search "hooks" in the left sidebar search if you
   can't find it).
2. Find **Customize Access Token (JWT) Claims hook**.
3. Enable it and select the Postgres function `public.custom_access_token_hook`.
4. Save.

## 5. Set the access token lifetime to 15 minutes

This bounds how long a removed member's old token keeps working (see the
note in `20260904000014_auth_hook_and_trigger.sql`).

1. **Authentication → Settings** (or **Authentication → Sessions**,
   depending on dashboard version).
2. Find **JWT expiry limit** (sometimes called "Access token expiry").
3. Set it to `900` seconds (15 minutes).
4. Save.

## 6. Set up Google OAuth (optional, can do later)

Only needed once you're ready to test "Continue with Google." Email/password
sign-up works without this.

1. In [Google Cloud Console](https://console.cloud.google.com/), create (or
   pick) a project → **APIs & Services → Credentials → Create Credentials →
   OAuth client ID** → Application type: **Web application**.
2. Under **Authorized redirect URIs**, add the callback URL Supabase shows
   you in the next step (looks like
   `https://<your-project-ref>.supabase.co/auth/v1/callback`).
3. Copy the generated **Client ID** and **Client Secret**.
4. In Supabase: **Authentication → Providers → Google**. Enable it, paste
   the Client ID and Secret, save.

## 7. Get your API keys

**Project Settings → API.** You'll need these when the Next.js app is built:

- **Project URL** — `NEXT_PUBLIC_SUPABASE_URL`
- **anon / publishable key** — `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Safe
  to expose in the browser — it can only do what RLS allows.
- **service_role key** — **never** put this in frontend code or an
  environment variable Vercel exposes to the browser. It bypasses RLS
  entirely. It's only for server-only code (migrations, the cron worker,
  admin scripts).

## 8. Manually verify tenant isolation actually works

This is the most important test in the whole setup — it proves two
companies' data can't leak into each other. Do it before building anything
on top of this schema.

1. **Create two test users.** Dashboard → **Authentication → Users → Add
   user** (or sign up through the app once it exists). Create
   `test-a@example.com` and `test-b@example.com` with any password.
2. **Create an org for each, as each user.** The `create_organization()`
   function needs to run *as* that user (it uses `auth.uid()` internally),
   so the SQL Editor — which runs as an admin role — can't call it directly
   on their behalf. The practical way to do this before the app exists:
   Dashboard → **Authentication → Users** → click a user → there's no
   built-in "run as this user" console, so the real test happens once you
   have a login page (M1 UI) or by calling the REST API directly with that
   user's access token:

   ```bash
   # 1. Sign in as test-a to get a real access token
   curl -X POST 'https://<project-ref>.supabase.co/auth/v1/token?grant_type=password' \
     -H "apikey: <anon-key>" -H "Content-Type: application/json" \
     -d '{"email":"test-a@example.com","password":"<password>"}'
   # copy the "access_token" from the response

   # 2. Create an org as test-a
   curl -X POST 'https://<project-ref>.supabase.co/rest/v1/rpc/create_organization' \
     -H "apikey: <anon-key>" -H "Authorization: Bearer <test-a-access-token>" \
     -H "Content-Type: application/json" \
     -d '{"org_name":"Company A","org_slug":"company-a"}'

   # 3. Repeat 1-2 for test-b with "Company B" / "company-b"
   ```

3. **As test-a, create a contact:**

   ```bash
   curl -X POST 'https://<project-ref>.supabase.co/rest/v1/contacts' \
     -H "apikey: <anon-key>" -H "Authorization: Bearer <test-a-access-token>" \
     -H "Content-Type: application/json" -H "Prefer: return=representation" \
     -d '{"organization_id":"<company-a-org-id>","name":"Alice Testperson"}'
   ```

4. **As test-b, try to read contacts:**

   ```bash
   curl 'https://<project-ref>.supabase.co/rest/v1/contacts?select=*' \
     -H "apikey: <anon-key>" -H "Authorization: Bearer <test-b-access-token>"
   ```

   **This must return an empty array `[]`.** If it returns Alice, RLS is not
   isolating tenants and nothing else in this plan is safe to build on top
   of it yet — stop and flag it back to me with what you see.

5. **As test-b, try to read test-a's contact by guessing its ID directly:**

   ```bash
   curl 'https://<project-ref>.supabase.co/rest/v1/contacts?id=eq.<alice-contact-id>' \
     -H "apikey: <anon-key>" -H "Authorization: Bearer <test-b-access-token>"
   ```

   Must also return `[]`. This is the "can't reach another org's record by
   URL/ID" test — the same one a real attacker would try first.

If both come back empty, tenant isolation is working end to end, on the real
project, not just in the SQL — which is the standard this needs to meet.

---

## Optional: using the Supabase CLI instead of the dashboard

Once you're comfortable, the CLI lets you apply all migrations in one
command instead of pasting files one at a time, and is what CI will use
later:

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

This reads every file in `supabase/migrations/` in order and applies
whichever ones haven't run yet — same effect as steps 2-3 above, just
faster for repeat use.

---

## What you have after this

A Postgres database with: multi-tenant organizations, invitations, five
roles, and RLS-enforced isolation across contacts, companies, tags, deals
(with configurable pipelines), tasks, an activity feed, and audit logs — with
no application code pointed at it yet. That's the next step, and it's a
separate, larger piece of work (the Next.js frontend + auth pages + the
actual CRUD screens) — this setup is the foundation it gets built on.
