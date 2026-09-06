import { Reveal } from "@/components/marketing/reveal";

const STEPS = [
  {
    number: "01",
    title: "Bring in your contacts",
    description: "Import your existing list with a CSV, or start a fresh workspace from scratch.",
  },
  {
    number: "02",
    title: "Build your pipeline",
    description: "Customize stages to match how your team actually sells, not a generic template.",
  },
  {
    number: "03",
    title: "Work as one team",
    description: "Assign tasks, tickets, and deals so everyone sees the same picture, in real time.",
  },
  {
    number: "04",
    title: "Review and refine",
    description: "Reports surface where deals stall, so you can fix the real bottleneck.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-4xl px-6 py-20">
      <Reveal>
        <h2 className="mb-14 text-center font-display text-h2 text-foreground md:text-h1">
          How it works
        </h2>
      </Reveal>
      <div className="relative flex flex-col gap-12">
        <div
          aria-hidden
          className="absolute left-[1.15rem] top-2 bottom-2 w-px bg-line md:left-1/2"
        />
        {STEPS.map((step, i) => (
          <Reveal
            key={step.number}
            className="relative flex gap-6 md:odd:flex-row-reverse md:even:pl-[calc(50%+2rem)] md:odd:pr-[calc(50%+2rem)]"
          >
            <span className="relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full bg-surface font-display text-base text-brand shadow-sm ring-1 ring-line-soft">
              {step.number}
            </span>
            <div className={i % 2 === 0 ? "md:text-left" : "md:text-right"}>
              <p className="font-display text-h3 text-foreground">{step.title}</p>
              <p className="mt-2 text-sm text-text-2">{step.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
