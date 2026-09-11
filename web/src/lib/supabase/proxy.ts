import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const hasEnvVars = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

// Routes that don't require a signed-in user. Everything under /dashboard
// and /onboarding is the authenticated app; adjust as real route groups land.
// /icon, /apple-icon, and /opengraph-image are the generated brand-asset
// routes (next/og) added with the marketing site, they have no file
// extension in their URL, so the matcher's static-asset exclusion below
// doesn't skip them; they must be listed here explicitly or every browser
// request for the favicon/OG image gets redirected to login instead of an
// image, same as /privacy and /terms would without this entry.
// /robots.txt, /sitemap.xml, and /llms.txt need the same treatment: proxy.ts's
// matcher only excludes image extensions, not .txt/.xml, so without this a
// crawler hitting any of them gets a 307 to /auth/login instead of the file.
// /api/cron has no signed-in user at all (Vercel Cron calls it directly),
// it authenticates itself by checking CRON_SECRET in the route handler
// instead, so it needs the same bypass for a different reason.
const PUBLIC_PATH_PREFIXES = [
  "/auth",
  "/privacy",
  "/terms",
  "/icon",
  "/apple-icon",
  "/opengraph-image",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/api/cron",
];

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

/**
 * Refreshes the Supabase session on every navigation and redirects signed-out
 * users away from protected routes. Called from the root proxy.ts (Next.js
 * 16 renamed middleware.ts to proxy.ts; see AGENTS.md).
 *
 * Do not add code between createServerClient and supabase.auth.getClaims()
 * below. A stray early return here is exactly the kind of bug that makes
 * users get randomly logged out, because the refreshed cookies never make it
 * onto the response.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!hasEnvVars) {
    // Lets every page still render (with its own "not configured" state)
    // instead of every request 500ing before SETUP.md has been followed.
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims() validates the JWT signature locally; getSession()/getUser()
  // alone can serve a stale or forged session in server contexts. This is
  // also what forces a refresh of the app_metadata.active_org_id/org_role
  // claims the RLS policies in supabase/migrations depend on.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user && !isPublicPath(request.nextUrl.pathname)) {
    // Preserve where the user was headed (e.g. an /invite/:token link) so
    // the login/sign-up forms can send them back there instead of always
    // landing on /dashboard.
    const originalPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = "";
    url.searchParams.set("next", originalPath);
    return NextResponse.redirect(url);
  }

  // Must return supabaseResponse as-is (or a response built from it); see
  // the cookie-sync warning in the setAll callback above.
  return supabaseResponse;
}
