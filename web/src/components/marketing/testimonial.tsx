import { Reveal } from "@/components/marketing/reveal";

// The plan's copy-discipline rule is explicit: no invented customers,
// quotes, or stats. Rather than fabricate a persona, this stays an
// honestly-labeled placeholder — dashed border and all — until a real
// customer story exists to put here.
export function Testimonial() {
  return (
    <section className="mx-auto w-full max-w-2xl px-6 py-20">
      <Reveal className="rounded-2xl border border-dashed border-line p-10 text-center">
        <p className="font-display text-h2 text-text-2">
          &ldquo;Customer stories will live here.&rdquo;
        </p>
        <p className="mt-3 text-sm text-text-3">
          None published yet — this space is reserved for a real one.
        </p>
      </Reveal>
    </section>
  );
}
