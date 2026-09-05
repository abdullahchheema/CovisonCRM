import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

// Replaces the 9 identical `rounded-xl border ... p-8 text-center` empty
// states duplicated across contacts-table, companies-table, tickets-table,
// tasks-list, tags, projects, settings/activity, emails/templates, and
// emails/groups.
interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: LucideIcon;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

function EmptyState({ icon: Icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl bg-surface-2 p-12 text-center",
        className,
      )}
      {...props}
    >
      {Icon && (
        <div className="flex size-10 items-center justify-center rounded-full bg-surface text-text-2">
          <Icon className="size-5" />
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="mt-1 text-sm text-text-2">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export { EmptyState };
