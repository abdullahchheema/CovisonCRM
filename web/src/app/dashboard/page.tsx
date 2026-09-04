import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Placeholder landing page for the authenticated app. Verifies auth itself
// rather than relying on proxy.ts alone — see the Next.js Data Security
// guide note in lib/supabase/proxy.ts.
export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_organization_id, email")
    .eq("id", userId)
    .single();

  if (!profile?.active_organization_id) {
    redirect("/onboarding");
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", profile.active_organization_id)
    .single();

  return (
    <div className="flex min-h-svh w-full flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <span className="font-semibold text-foreground">
          {org?.name ?? "Tiny CRM"}
        </span>
        <LogoutButton />
      </header>
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Welcome to {org?.name ?? "your workspace"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Signed in as {profile.email}. Contacts, deals, and the rest of the
            CRM land here next.
          </p>
        </div>
      </main>
    </div>
  );
}
