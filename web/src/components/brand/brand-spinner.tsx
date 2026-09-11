import { CovisonMark } from "@/components/brand/covison-mark";
import { cn } from "@/lib/utils";

// The same pulsing-mark motif (app)/loading.tsx uses for a full page load,
// scaled down for inline use: a delete/remove/revoke action whose pending
// state is tracked through the full round trip (see useTransition +
// router.refresh() in soft-delete-button.tsx and friends), not just the
// mutation, so this stays visible for the entire gap between "click" and
// the item actually being gone, rather than the button going quiet while
// the row sits there stale for another moment.
export function BrandSpinner({ className }: { className?: string }) {
  return <CovisonMark className={cn("animate-pulse", className)} />;
}
