import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductPreview } from "@/components/marketing/product-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-12rem] size-[36rem] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-10 px-6 pb-20 pt-20 text-center md:pt-28">
        <h1 className="max-w-3xl font-display text-display leading-tight text-foreground">
          One calm, uncluttered home for every customer relationship.
        </h1>
        <p className="max-w-xl text-lg text-text-2">
          Covison brings contacts, deals, tasks, and tickets into a single
          workspace — so your team spends less time managing tools and more
          time closing them.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/auth/sign-up">Get started</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#how-it-works">See how it works</a>
          </Button>
        </div>

        <div className="w-full pt-6">
          <ProductPreview />
        </div>
      </div>
    </section>
  );
}
