interface PipelineHeroProps {
  value: number;
  dealCount: number;
  trend: number[];
}

// A small inline sparkline built from real data (cumulative open-pipeline
// value by day, over the trailing 14 days), not a decorative squiggle.
// Hand-rolled SVG rather than pulling recharts into this, since a static
// line from server-computed points doesn't need a charting library or a
// "use client" boundary.
function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;

  const width = 240;
  const height = 56;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - ((p - min) / range) * height;
    return [x, y] as const;
  });

  const linePath = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-14 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="pipeline-sparkline-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#pipeline-sparkline-fill)" />
      <path d={linePath} fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function PipelineHero({ value, dealCount, trend }: PipelineHeroProps) {
  const formatted = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

  return (
    <div className="flex h-full flex-col justify-between rounded-xl bg-surface p-6 shadow-sm">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-text-2">Open pipeline</p>
        <p className="mt-2 font-display text-metric tabular-nums text-foreground">{formatted}</p>
        <p className="mt-1 text-sm text-text-2">
          {dealCount} open deal{dealCount === 1 ? "" : "s"}
        </p>
      </div>
      <div className="mt-6">
        <Sparkline points={trend} />
        <p className="mt-1 text-xs text-text-3">Cumulative value by creation date, last 14 days</p>
      </div>
    </div>
  );
}
