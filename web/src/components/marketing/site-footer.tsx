import Link from "next/link";
import { CovisonMark } from "@/components/brand/covison-mark";

export function SiteFooter() {
  return (
    <footer className="border-t border-line-soft">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-6 py-10 text-sm text-text-3 md:flex-row md:justify-between">
        <div className="flex items-center gap-2">
          <CovisonMark className="size-5" />
          <span className="text-text-2">Covison</span>
        </div>
        <p>&copy; {new Date().getFullYear()} Covison. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/auth/login" className="hover:text-foreground">
            Log in
          </Link>
          <Link href="/auth/sign-up" className="hover:text-foreground">
            Sign up
          </Link>
        </div>
      </div>
    </footer>
  );
}
