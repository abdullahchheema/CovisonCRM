import Image from "next/image";
import { CovisonMark } from "@/components/brand/covison-mark";
import { Reveal } from "@/components/marketing/reveal";

// The one section that stays dark regardless of the visitor's theme (see
// the --ink token added in Phase 8, used here for the same reason as the
// login hero panel). A deliberate change of register mid-page, the way a
// print magazine will run one page as a full-bleed plate.
export function BrandSection() {
  return (
    <section className="relative overflow-hidden bg-ink py-24">
      {/* This panel is --ink in both themes, so the dark texture sits
          correctly here without a light/dark variant, unlike the hero,
          whose background follows the theme. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Image
          src="/brand-texture.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-60"
        />
        <div className="absolute left-1/2 top-0 size-[32rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-brand/20 blur-3xl" />
      </div>
      <Reveal className="relative mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6 text-center">
        <CovisonMark className="size-20" />
        <p className="font-display text-h2 leading-snug text-white md:text-h1">
          Covison is a quieter kind of software, considered, editorial,
          built to be lived in rather than logged into.
        </p>
        <p className="text-white/60">
          Every screen is designed the same way: state what matters, remove
          what doesn&apos;t, and never make the user work to find the answer.
        </p>
      </Reveal>
    </section>
  );
}
