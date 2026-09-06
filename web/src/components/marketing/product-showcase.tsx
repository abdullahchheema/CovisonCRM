import { Reveal } from "@/components/marketing/reveal";

// A second, larger composed mockup, distinct from the hero's
// product-preview (a dashboard) and the feature stories' small visuals.
// This one echoes the detail-page layout (raised activity panel + tonal
// metadata rail) built in the app's own Phase 6, giving the page real
// variety instead of the same screenshot resized three times.
export function ProductShowcase() {
  return (
    <section id="features" className="mx-auto w-full max-w-6xl px-6 py-20">
      <Reveal className="mb-12 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-brand">Every record</p>
        <h2 className="mx-auto mt-3 max-w-2xl font-display text-h2 text-foreground md:text-h1">
          The whole story, not just the deal.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-text-2">
          Every contact, company, and deal keeps its own timeline, notes,
          calls, and status changes, in one place instead of scattered
          across inboxes and spreadsheets.
        </p>
      </Reveal>

      <Reveal className="grid gap-4 rounded-2xl bg-surface p-4 shadow-xl ring-1 ring-line-soft md:grid-cols-[1fr_280px] md:p-6">
        <div className="rounded-xl bg-surface p-5">
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-text-2">
            Activity
          </p>
          <div className="relative flex flex-col gap-5 pl-5">
            <div className="absolute inset-y-1 left-[3px] w-px bg-line" />
            {[
              { label: "Called about renewal, seems positive.", time: "Today" },
              { label: "Sent updated proposal with new pricing.", time: "2d ago" },
              { label: "Deal moved to Proposal.", time: "4d ago" },
            ].map((item) => (
              <div key={item.label} className="relative">
                <span className="absolute -left-5 top-1 size-1.5 rounded-full bg-brand ring-4 ring-surface" />
                <div className="flex items-center justify-between text-xs text-text-3">
                  <span>{item.time}</span>
                </div>
                <p className="mt-1 text-sm text-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5 rounded-xl bg-surface-2 p-5">
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-2">
              Details
            </p>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-text-2">Company</dt>
                <dd className="text-foreground">Acme Corp</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-2">Value</dt>
                <dd className="tabular-nums text-foreground">$24,000</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-text-2">Owner</dt>
                <dd className="text-foreground">You</dd>
              </div>
            </dl>
          </div>
          <div className="h-px bg-line" />
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-text-2">
              Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-surface-3 px-2 py-0.5 text-xs font-medium text-text-2">
                VIP
              </span>
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-primary">
                Renewal
              </span>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
