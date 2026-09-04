import { requireOrgContext } from "@/lib/supabase/org-context";
import { LogoutButton } from "@/components/logout-button";
import { CommandPalette } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/contacts", label: "Contacts" },
  { href: "/companies", label: "Companies" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/tasks", label: "Tasks" },
  { href: "/tags", label: "Tags" },
  { href: "/reports", label: "Reports" },
  { href: "/team", label: "Team" },
  { href: "/settings", label: "Settings" },
];

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
    <div className="flex min-h-svh w-full">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface p-4">
        <div className="mb-6 flex items-center gap-2 truncate font-semibold text-foreground">
          {logoSignedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed Supabase Storage URL, not a static asset
            <img
              src={logoSignedUrl}
              alt=""
              className="size-6 shrink-0 rounded object-cover"
            />
          ) : null}
          <span className="truncate">{org.name}</span>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-foreground hover:bg-muted"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <CommandPalette />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {profile.email}
            </span>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
