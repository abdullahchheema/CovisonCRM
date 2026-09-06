import * as React from "react";

import { cn } from "@/lib/utils";

// Replaces `<div className="mb-6 flex items-center justify-between">` +
// `<h1 className="text-xl font-semibold text-foreground">` repeated
// verbatim across all 20 app pages (6 of them use the items-start variant
// for a subtitle underneath, pass `align="start"` for that case).
interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  align?: "center" | "start";
}

function PageHeader({
  title,
  description,
  actions,
  align = "center",
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex justify-between gap-4",
        align === "start" ? "items-start" : "items-center",
        className,
      )}
      {...props}
    >
      <div className="min-w-0">
        <h1 className="font-display text-h2 text-foreground">{title}</h1>
        {description && <p className="mt-1 text-sm text-text-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export { PageHeader };
