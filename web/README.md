# web — Tiny CRM (Next.js + Supabase)

The new multi-tenant application. See [../supabase/SETUP.md](../supabase/SETUP.md)
for provisioning the database this talks to.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + publishable key
npm run dev
```

## Notes for future work in this app

- **`proxy.ts`, not `middleware.ts`.** Next.js 16 renamed the middleware file
  convention to Proxy. `src/proxy.ts` is the session-refresh entry point;
  the actual logic lives in `src/lib/supabase/proxy.ts`. See
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
  before touching request-interception logic — this and other API surfaces
  differ from most training data and older tutorials.
- **Supabase client split**: `src/lib/supabase/client.ts` (browser),
  `server.ts` (Server Components/Actions, via `next/headers` cookies), and
  `proxy.ts` (session refresh, called from the root `proxy.ts`). Never create
  a `service_role` client outside server-only code, and never prefix its key
  with `NEXT_PUBLIC_`.
- **Design tokens** live in `src/app/globals.css` as CSS variables
  (Graphite/Paper/Cobalt — see the migration plan), consumed via Tailwind
  v4's `@theme inline`. Dark mode is class-based (`.dark` on `<html>`), ready
  for `next-themes` once that's wired up — not yet installed.
