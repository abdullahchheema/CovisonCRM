import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

// OAuth (Google, etc.) callback. Supabase redirects here with a `code` to
// exchange for a session. See src/lib/supabase/client.ts's
// signInWithOAuth({ options: { redirectTo: ".../auth/callback?next=..." } }).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error.message)}`,
    );
  }

  return NextResponse.redirect(
    `${origin}/auth/error?error=${encodeURIComponent("No code provided")}`,
  );
}
