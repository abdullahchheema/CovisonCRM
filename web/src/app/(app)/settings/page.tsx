import Link from "next/link";
import { requireOrgContext } from "@/lib/supabase/org-context";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { WorkspaceSettingsForm } from "@/components/settings/workspace-settings-form";

export default async function SettingsPage() {
  const { supabase, profile, org } = await requireOrgContext();

  // logo_url isn't in requireOrgContext()'s selection (every page pays for
  // that query; only this one needs the logo) — a small extra lookup here,
  // then a signed URL since org-files is a private bucket.
  const { data: orgWithLogo } = await supabase
    .from("organizations")
    .select("logo_url")
    .eq("id", org.id)
    .single();

  let logoSignedUrl: string | null = null;
  if (orgWithLogo?.logo_url) {
    const { data: signed } = await supabase.storage
      .from("org-files")
      .createSignedUrl(orgWithLogo.logo_url, 3600);
    logoSignedUrl = signed?.signedUrl ?? null;
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-xl font-semibold text-foreground">Settings</h1>
      <ProfileSettingsForm
        userId={profile.id}
        email={profile.email}
        fullName={profile.full_name}
      />
      <WorkspaceSettingsForm
        organizationId={org.id}
        name={org.name}
        slug={org.slug}
        logoSignedUrl={logoSignedUrl}
      />
      <Link href="/settings/activity" className="text-sm text-primary hover:underline">
        View activity log →
      </Link>
    </div>
  );
}
