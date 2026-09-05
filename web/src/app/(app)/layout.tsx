import { requireOrgContext } from "@/lib/supabase/org-context";
import { CommandPalette } from "@/components/command-palette";
import { NotificationBell } from "@/components/notification-bell";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { UserMenu } from "@/components/shell/user-menu";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { org, profile, supabase } = await requireOrgContext();

  // Same signed-URL pattern as settings/page.tsx: logo_url isn't part of
  // requireOrgContext()'s selection since most pages don't need it.
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
    <div className="flex min-h-svh w-full bg-bg">
      {/* Sidebar: tonal surface-2, borderless — the tone shift against the
          bg-bg main column does the separating work instead of a border. */}
      <aside className="flex w-64 shrink-0 flex-col gap-4 bg-surface-2 p-4">
        <div className="flex items-center gap-2 truncate px-1 font-display text-lg text-foreground">
          {logoSignedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed Supabase Storage URL, not a static asset
            <img
              src={logoSignedUrl}
              alt=""
              className="size-7 shrink-0 rounded-md object-cover"
            />
          ) : (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand text-sm text-on-brand">
              {org.name.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="truncate">{org.name}</span>
        </div>

        <SidebarNav />

        <div className="border-t border-line-soft pt-3">
          <UserMenu name={profile.full_name ?? ""} email={profile.email} />
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-bg/80 px-6 py-3 backdrop-blur-sm">
          <CommandPalette />
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 px-6 py-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
