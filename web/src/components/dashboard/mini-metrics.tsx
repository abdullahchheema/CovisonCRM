interface Metric {
  label: string;
  value: string;
  hint?: string;
}

// The 1/3-width stacked column beside PipelineHero — replaces 3 of the old
// 4 identical StatCards with rows in one tonal panel instead of 3 separate
// boxes.
export function MiniMetrics({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="flex h-full flex-col divide-y divide-line-soft rounded-xl bg-surface-2">
      {metrics.map((metric) => (
        <div key={metric.label} className="flex flex-1 flex-col justify-center px-5 py-4">
          <p className="text-xs text-text-2">{metric.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {metric.value}
          </p>
          {metric.hint && <p className="mt-0.5 text-xs text-warning">{metric.hint}</p>}
        </div>
      ))}
    </div>
  );
}
