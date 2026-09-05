import Link from "next/link";
import { CovisonMark } from "@/components/brand/covison-mark";

// Shared wrapper for the 5 auth pages that don't need the bespoke split
// composition (login is the only one that does — see login/page.tsx):
// sign-up, forgot-password, sign-up-success, update-password, error.
// Replaces the identical `flex min-h-svh w-full items-center justify-center
// p-6 md:p-10` div duplicated across all of them with one shared, branded
// frame (mark + soft aurora wash) instead of a flat, unbranded background.
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-bg p-6 md:p-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-10rem] size-96 -translate-x-1/2 rounded-full bg-brand/15 blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <CovisonMark className="size-8" />
          <span className="font-display text-lg text-foreground">Covison</span>
        </Link>
        {children}
      </div>
    </div>
  );
}
