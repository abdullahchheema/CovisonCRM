import Link from "next/link";
import { CovisonMark } from "@/components/brand/covison-mark";
import { Button } from "@/components/ui/button";

// Signed-in visitors get "Open CRM" instead of "Get started" — no
// redirect, so the public marketing site stays reachable either way (the
// route table doesn't change based on auth state, only this label does).
export function SiteHeader({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-bg/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <CovisonMark className="size-7" />
          <span className="font-display text-lg text-foreground">Covison</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-text-2 md:flex">
          <a href="#features" className="hover:text-foreground">
            Product
          </a>
          <a href="#how-it-works" className="hover:text-foreground">
            How it works
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {isSignedIn ? (
            <Button asChild>
              <Link href="/dashboard">Open CRM</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
