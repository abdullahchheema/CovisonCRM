import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

// Shared chrome for /privacy and /terms, same header/footer as the
// homepage, a simple prose column for the body.
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-bg">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-6 py-16">
          <h1 className="font-display text-h2 text-foreground md:text-h1">{title}</h1>
          <p className="mt-2 text-sm text-text-3">Last updated {updated}</p>

          <div className="mt-10 flex flex-col gap-6 text-sm leading-relaxed text-text-2">
            {children}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
