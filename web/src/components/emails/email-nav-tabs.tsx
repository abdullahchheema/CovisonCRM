"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/emails/templates", label: "Templates" },
  { href: "/emails/groups", label: "Groups" },
];

export function EmailNavTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-6 inline-flex gap-1 rounded-lg bg-surface-2 p-1">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            pathname === tab.href
              ? "bg-surface font-medium text-foreground shadow-xs"
              : "text-text-2 hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
