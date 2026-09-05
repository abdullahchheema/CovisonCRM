"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  KanbanSquare,
  ListTodo,
  LifeBuoy,
  FolderKanban,
  Mail,
  Tag,
  BarChart3,
  UsersRound,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

// Grouped nav, replacing the flat 12-item list that had no active state at
// all. Overview stands alone above the groups; Team/Settings are pinned at
// the bottom of the sidebar, below the scrollable group list.
const NAV_GROUPS: NavGroup[] = [
  { items: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard }] },
  {
    label: "Customers",
    items: [
      { href: "/contacts", label: "Contacts", icon: Users },
      { href: "/companies", label: "Companies", icon: Building2 },
      { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
    ],
  },
  {
    label: "Work",
    items: [
      { href: "/tasks", label: "Tasks", icon: ListTodo },
      { href: "/tickets", label: "Tickets", icon: LifeBuoy },
      { href: "/projects", label: "Projects", icon: FolderKanban },
    ],
  },
  {
    label: "Engage",
    items: [
      { href: "/emails/templates", label: "Emails", icon: Mail },
      { href: "/tags", label: "Tags", icon: Tag },
      { href: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  { href: "/team", label: "Team", icon: UsersRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  // "/emails/templates" as a nav target should also stay active for
  // "/emails/groups" and "/emails" (which redirects to /templates) — match
  // on the shared "/emails" prefix rather than the full href.
  const base = href.startsWith("/emails") ? "/emails" : href;
  return pathname === base || pathname.startsWith(`${base}/`);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-brand-soft font-medium text-primary"
          : "text-text-2 hover:bg-surface-3 hover:text-foreground",
      )}
    >
      {active && (
        <span className="absolute -left-1 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-brand" />
      )}
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
      {NAV_GROUPS.map((group, i) => (
        <div key={group.label ?? i} className="flex flex-col gap-1">
          {group.label && (
            <p className="px-3 text-xs font-medium uppercase tracking-wide text-text-3">
              {group.label}
            </p>
          )}
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      ))}

      <div className="mt-auto flex flex-col gap-1 border-t border-line-soft pt-3">
        {BOTTOM_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
}
