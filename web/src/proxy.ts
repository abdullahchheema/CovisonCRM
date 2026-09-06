import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";

// Next.js 16 renamed middleware.ts -> proxy.ts (same behavior, new name and
// export). See node_modules/next/dist/docs/01-app/03-api-reference/
// 03-file-conventions/proxy.md if this ever needs revisiting.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Skip static assets and image optimization, running the session
    // refresh on every CSS/JS/image request would be pure overhead, and
    // Next.js still runs proxy for /_next/data/* regardless of this pattern
    // (see the proxy.md "Good to know" on negative matching).
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
