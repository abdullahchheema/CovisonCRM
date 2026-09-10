import Image from "next/image";
import { CovisonMark } from "@/components/brand/covison-mark";
import { cn } from "@/lib/utils";

// For surfaces that follow the site theme (header, footer, auth shell) —
// NOT the permanently-dark --ink surfaces (login hero, brand section),
// which already render CovisonMark + literal white text unconditionally
// and have no reason to use this.
//
// logo-full.jpg is the mark + "Covison" wordmark flattened into one JPEG
// on a flat white background: correct on a light surface, but it has no
// transparency, so on a dark surface it would show as a visible white box.
// Dark theme swaps to the transparent mark plus live text instead, which
// is what the .dark selector below is doing (CSS-only, no client component
// or theme hook needed, same pattern hero.tsx uses to swap its own
// light/dark background).
export function CovisonLogo({
  markClassName,
  lockupClassName,
  textClassName,
}: {
  markClassName?: string;
  lockupClassName?: string;
  textClassName?: string;
}) {
  return (
    <>
      <Image
        src="/logo-full.jpg"
        alt="Covison"
        width={1450}
        height={528}
        priority
        className={cn("w-auto dark:hidden", lockupClassName)}
      />
      <span className="hidden items-center gap-2 dark:flex">
        <CovisonMark className={markClassName} />
        <span
          className={cn(
            "font-display font-bold tracking-tight text-foreground",
            textClassName,
          )}
        >
          Covison
        </span>
      </span>
    </>
  );
}
