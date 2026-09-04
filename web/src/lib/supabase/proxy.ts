import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const hasEnvVars = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

// Routes that don't require a signed-in user. Everything under /dashboard is
// the authenticated app; adjust as real route groups land.
const PUBLIC_PATH_PREFIXES = ["/login", "/signup", "/auth"];

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

/**
 * Refreshes the Supabase session on every navigation and redirects signed-out
 * users away from protected routes. Called from the root proxy.ts (Next.js
 * 16 renamed middleware.ts to proxy.ts — see AGENTS.md).
 *
 * Do not add code between createServerClient and supabase.auth.getClaims()
 * below — a stray early return here is exactly the kind of bug that makes
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
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Must return supabaseResponse as-is (or a response built from it) — see
  // the cookie-sync warning in the setAll callback above.
  return supabaseResponse;
}
