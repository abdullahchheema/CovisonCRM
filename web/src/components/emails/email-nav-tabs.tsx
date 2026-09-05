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
    <div className="mb-6 flex gap-1 border-b border-border">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "border-b-2 px-3 py-2 text-sm",
            pathname === tab.href
              ? "border-primary font-medium text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
