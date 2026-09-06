import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductPreview } from "@/components/marketing/product-preview";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* hero-glow.webp is a near-black image, so it only works over the
          dark theme — in light mode it would read as a dark slab dropped
          on the ivory background. Light mode keeps the CSS bloom instead,
          so both themes look deliberate rather than one being a
          compromise. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-12rem] size-[36rem] -translate-x-1/2 rounded-full bg-brand/10 blur-3xl dark:hidden" />
        <div className="absolute inset-0 hidden dark:block">
          <Image
            src="/hero-glow.webp"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-70"
          />
          {/* Fades the image out before the section ends so it blends into
              the page rather than stopping at a hard edge. */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg" />
        </div>
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
