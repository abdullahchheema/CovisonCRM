import Link from "next/link";
import { CovisonMark } from "@/components/brand/covison-mark";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line-soft bg-bg/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <CovisonMark className="size-10" />
          <span className="font-display text-xl text-foreground">Covison</span>
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
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/auth/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/sign-up">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
