import { requireOrgContext } from "@/lib/supabase/org-context";
import { CommandPalette } from "@/components/command-palette";
import { NotificationBell } from "@/components/notification-bell";
import { SidebarContent } from "@/components/shell/sidebar-content";
import { MobileSidebar } from "@/components/shell/mobile-sidebar";

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
    <div className="flex h-svh w-full overflow-hidden bg-bg">
      {/* Sidebar: tonal surface-2, borderless. The tone shift against the
          bg-bg main column does the separating work instead of a border.
          Hidden below md. MobileSidebar's drawer (triggered from the
          header) takes over there instead of trying to shrink this same
          layout down to a phone width.
          h-full + its own overflow-y-auto is what makes SidebarNav's
          `mt-auto`-pinned Team/Settings section actually pin to the
          bottom of the viewport instead of the bottom of whatever the
          main column's content height happens to be. */}
      <aside className="hidden h-full w-64 shrink-0 flex-col gap-4 overflow-y-auto bg-surface-2 p-4 md:flex">
        <SidebarContent
          orgName={org.name}
          logoSignedUrl={logoSignedUrl}
          profileName={profile.full_name ?? ""}
          profileEmail={profile.email}
        />
      </aside>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-4 bg-bg/80 px-4 py-3 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <MobileSidebar
              orgName={org.name}
              logoSignedUrl={logoSignedUrl}
              profileName={profile.full_name ?? ""}
              profileEmail={profile.email}
            />
            <CommandPalette />
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
