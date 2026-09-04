import { requireOrgContext } from "@/lib/supabase/org-context";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { WorkspaceSettingsForm } from "@/components/settings/workspace-settings-form";

export default async function SettingsPage() {
  const { profile, org } = await requireOrgContext();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <h1 className="text-xl font-semibold text-foreground">Settings</h1>
      <ProfileSettingsForm
        userId={profile.id}
        email={profile.email}
        fullName={profile.full_name}
      />
      <WorkspaceSettingsForm organizationId={org.id} name={org.name} slug={org.slug} />
    </div>
  );
}
