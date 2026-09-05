import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Replaces the 30 inline card `<div>`s across the app that bypass
// components/ui/card.tsx entirely (dashboard, detail pages, team,
// reports, ...). Two surface treatments, not a border-around-everything
// default:
//   - "raised"  (default) — bg-surface + soft shadow, no border. The
//     card floating above the page.
//   - "tonal"   — bg-surface-2, no border, no shadow. A panel that reads
//     as part of the page rather than a box sitting on it. Use this far
//     more than "raised" — not every piece of information needs a box.
const panelVariants = cva("rounded-xl p-4", {
  variants: {
    variant: {
      raised: "bg-surface shadow-sm",
      tonal: "bg-surface-2",
    },
  },
  defaultVariants: {
    variant: "raised",
  },
});

export interface PanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof panelVariants> {}

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(panelVariants({ variant }), className)} {...props} />
  ),
);
Panel.displayName = "Panel";

export { Panel, panelVariants };
