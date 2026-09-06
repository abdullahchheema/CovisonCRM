import { Reveal } from "@/components/marketing/reveal";

// The plan's copy-discipline rule is explicit: no invented customers,
// quotes, or stats. Rather than fabricate a persona, this stays an
// honestly-labeled placeholder, dashed border and all, until a real
// customer story exists to put here.
export function Testimonial() {
  return (
    <section className="mx-auto w-full max-w-2xl px-6 py-20">
      <Reveal className="rounded-2xl border border-dashed border-line p-10 text-center">
        <p className="font-display text-h3 text-text-2 md:text-h2">
          &ldquo;Customer stories will live here.&rdquo;
        </p>
        <p className="mt-3 text-sm text-text-3">
          None published yet. This space is reserved for a real one.
        </p>
      </Reveal>
    </section>
  );
}
