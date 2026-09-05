// Four small CSS-composed mockups, one per feature story on the homepage.
// Same rule as product-preview.tsx: built from tokens, not screenshots, so
// they can't go stale and need no demo data or image assets.

function VisualFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface p-6 shadow-lg ring-1 ring-line-soft">
      {children}
    </div>
  );
}

export function ContactVisual() {
  return (
    <VisualFrame>
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-brand-soft text-sm font-medium text-primary">
          JS
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Jane Sample</p>
          <p className="text-xs text-text-3">jane@acmecorp.com</p>
        </div>
        <span className="ml-auto inline-flex items-center rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
          Qualified
        </span>
      </div>
      <div className="mt-5 flex flex-col gap-3 border-t border-line-soft pt-4">
        {["Called about renewal", "Sent proposal", "Booked a demo"].map((note, i) => (
          <div key={note} className="flex items-center gap-3 text-xs">
            <span className="size-1.5 shrink-0 rounded-full bg-brand" />
            <span className="text-text-2">{note}</span>
            <span className="ml-auto shrink-0 text-text-3">{i + 1}d ago</span>
          </div>
        ))}
      </div>
    </VisualFrame>
  );
}

export function PipelineVisual() {
  const columns = [
    { name: "Qualified", cards: 2 },
    { name: "Proposal", cards: 1 },
    { name: "Won", cards: 2 },
  ];
  return (
    <VisualFrame>
      <div className="flex gap-3">
        {columns.map((col) => (
          <div key={col.name} className="flex-1 rounded-xl bg-surface-2 p-2">
            <p className="mb-2 px-1 text-xs font-medium text-text-2">{col.name}</p>
            <div className="flex flex-col gap-2">
              {Array.from({ length: col.cards }).map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-surface shadow-xs" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </VisualFrame>
  );
}

export function TaskVisual() {
  const tasks = [
    { label: "Follow up with Acme Corp", done: true },
    { label: "Prep Q3 pipeline review", done: true },
    { label: "Send onboarding checklist", done: false },
    { label: "Schedule renewal call", done: false },
  ];
  return (
    <VisualFrame>
      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <div key={task.label} className="flex items-center gap-3">
            <span
              className={
                task.done
                  ? "flex size-4 items-center justify-center rounded-sm bg-brand text-[10px] text-on-brand"
                  : "size-4 rounded-sm border border-border"
              }
            >
              {task.done ? "✓" : ""}
            </span>
            <span className={task.done ? "text-sm text-text-3 line-through" : "text-sm text-foreground"}>
              {task.label}
            </span>
          </div>
        ))}
      </div>
    </VisualFrame>
  );
}

export function ReportVisual() {
  const bars = [45, 62, 38, 70, 55, 80, 64];
  return (
    <VisualFrame>
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-text-2">
        Deals created, last 7 weeks
      </p>
      <div className="flex h-32 items-end gap-3">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-t-md bg-brand/70" style={{ height: `${h}%` }} />
        ))}
      </div>
    </VisualFrame>
  );
}
