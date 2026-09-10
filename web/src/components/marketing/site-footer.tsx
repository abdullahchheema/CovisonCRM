import Link from "next/link";
import { CovisonLogo } from "@/components/brand/covison-logo";

const PRODUCT_LINKS = [
  { href: "/auth/login", label: "Log in" },
  { href: "/auth/sign-up", label: "Sign up" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line-soft">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12 md:flex-row md:justify-between">
        <div className="flex items-center gap-2">
          <CovisonLogo markClassName="size-9" lockupClassName="h-9" textClassName="text-xl" />
        </div>

        <div className="flex flex-wrap gap-x-16 gap-y-8 text-sm">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-text-3">Product</p>
            {PRODUCT_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-text-2 hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-text-3">Legal</p>
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-text-2 hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-line-soft px-6 py-6 text-center text-xs text-text-3">
        &copy; {new Date().getFullYear()} Covison. All rights reserved.
      </div>
    </footer>
  );
}
