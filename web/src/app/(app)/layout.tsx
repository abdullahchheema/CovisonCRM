import { requireOrgContext } from "@/lib/supabase/org-context";
import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/contacts", label: "Contacts" },
  { href: "/companies", label: "Companies" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { org, profile } = await requireOrgContext();

  return (
    <div className="flex min-h-svh w-full">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface p-4">
        <div className="mb-6 truncate font-semibold text-foreground">
          {org.name}
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
          <span className="text-sm text-muted-foreground">
            {profile.email}
          </span>
          <LogoutButton />
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
