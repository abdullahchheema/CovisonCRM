import { requireOrgContext } from "@/lib/supabase/org-context";

export default async function DashboardPage() {
  const { org, profile } = await requireOrgContext();

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">
        Welcome to {org.name}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Signed in as {profile.email}. Contacts and companies are in the
        sidebar.
      </p>
    </div>
  );
}
