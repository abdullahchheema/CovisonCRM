import { Reveal } from "@/components/marketing/reveal";

const POINTS = [
  {
    title: "Calm by design",
    description:
      "No red badges demanding attention, no dashboards trying to be exciting. Just what you need, laid out clearly.",
  },
  {
    title: "Built for how you sell",
    description:
      "Pipelines, stages, and fields you actually shape yourself, not a generic template you have to work around.",
  },
  {
    title: "One workspace, not five tabs",
    description:
      "Contacts, deals, tasks, and tickets live together, so context never gets lost switching between tools.",
  },
];

export function Differentiation() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-20">
      <Reveal className="mb-12 max-w-xl">
        <p className="text-xs font-medium uppercase tracking-wide text-brand">Why Covison</p>
        <h2 className="mt-3 font-display text-h2 text-foreground md:text-h1">
          Not another cluttered dashboard.
        </h2>
      </Reveal>
      <div className="grid gap-8 md:grid-cols-3">
        {POINTS.map((point) => (
          <Reveal key={point.title}>
            <p className="font-display text-h3 text-foreground">{point.title}</p>
            <p className="mt-2 text-sm text-text-2">{point.description}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
