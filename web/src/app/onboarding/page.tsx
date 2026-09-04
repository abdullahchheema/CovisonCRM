import { CreateOrganizationForm } from "@/components/create-organization-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Don't rely on proxy.ts alone for auth — verify again here. See the Next.js
// Data Security guide note referenced in lib/supabase/proxy.ts.
export default async function Page() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_organization_id")
    .eq("id", userId)
    .single();

  // Already in a workspace — nothing to onboard.
  if (profile?.active_organization_id) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <CreateOrganizationForm />
      </div>
    </div>
  );
}
