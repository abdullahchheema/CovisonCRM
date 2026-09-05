import { cn } from "@/lib/utils";

// The hero's centerpiece visual — composed entirely from real design
// tokens rather than a screenshot. A screenshot would either need a demo
// account (more to maintain, and a privacy/security surface) or would go
// stale the moment the real UI changes; this stays accurate by
// construction since it's built from the same CSS variables as the app.
const NAV_ITEMS = ["Contacts", "Pipeline", "Tasks", "Tickets", "Reports"];
const STAGES = [
  { label: "Qualified", value: 62 },
  { label: "Proposal", value: 41 },
  { label: "Won", value: 88 },
];
const SPARK = [40, 55, 35, 60, 52, 80, 65, 90];

export function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-surface shadow-xl ring-1 ring-line-soft">
      <div className="flex items-center gap-1.5 border-b border-line-soft bg-surface-2 px-4 py-3">
        <span className="size-2.5 rounded-full bg-danger/40" />
        <span className="size-2.5 rounded-full bg-warning/40" />
        <span className="size-2.5 rounded-full bg-success/40" />
      </div>
      <div className="flex">
        <div className="hidden w-36 shrink-0 flex-col gap-3 border-r border-line-soft bg-surface-2 p-4 sm:flex">
          <div className="mb-1 h-2 w-16 rounded-full bg-surface-3" />
          {NAV_ITEMS.map((item, i) => (
            <div
              key={item}
              className={cn("h-2 rounded-full", i === 1 ? "w-24 bg-brand-soft" : "w-20 bg-surface-3")}
            />
          ))}
        </div>

        <div className="flex-1 p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-text-2">
                Open pipeline
              </p>
              <p className="font-display text-metric tabular-nums text-foreground">
                $482,900
              </p>
            </div>
            <div className="flex h-10 items-end gap-1">
              {SPARK.map((h, i) => (
                <span
                  key={i}
                  className="w-1.5 rounded-full bg-brand/70"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {STAGES.map((stage) => (
              <div key={stage.label}>
                <div className="mb-1 flex items-center justify-between text-xs text-text-2">
                  <span>{stage.label}</span>
                  <span className="tabular-nums">{stage.value}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-3">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-brand to-brand-violet"
                    style={{ width: `${stage.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
