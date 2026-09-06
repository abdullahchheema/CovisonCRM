interface StageDatum {
  id: string;
  name: string;
  value: number;
  count: number;
  isWon: boolean;
  isLost: boolean;
}

// Full-width, no card chrome. A row per pipeline stage with a horizontal
// bar sized relative to the highest-value stage. Genuinely new data (deals
// grouped by stage), not a restyle of something that existed before.
export function PipelineByStage({ stages }: { stages: StageDatum[] }) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  const currency = (n: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div>
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-text-2">
        Pipeline by stage
      </p>
      <div className="flex flex-col gap-3">
        {stages.map((stage) => (
          <div key={stage.id} className="flex items-center gap-4">
            <p className="w-32 shrink-0 truncate text-sm text-foreground">{stage.name}</p>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max((stage.value / max) * 100, stage.value > 0 ? 2 : 0)}%`,
                  backgroundColor: stage.isWon
                    ? "var(--success)"
                    : stage.isLost
                      ? "var(--text-3)"
                      : "var(--brand)",
                }}
              />
            </div>
            <p className="w-28 shrink-0 text-right text-sm tabular-nums text-text-2">
              {currency(stage.value)}
            </p>
            <p className="w-14 shrink-0 text-right text-xs tabular-nums text-text-3">
              {stage.count}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
