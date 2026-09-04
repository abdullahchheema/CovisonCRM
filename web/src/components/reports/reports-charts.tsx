"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartDatum {
  label: string;
  value: number;
}

// Every chart here is one measure across an axis-encoded category (deals
// per stage, contacts per status, deals per month) — not per-slice
// identity, so a single consistent hue is correct rather than a
// categorical palette. Reads the CSS custom property directly so it
// tracks light/dark automatically without recomputing anything in JS.
const BAR_FILL = "var(--color-primary)";

function TooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">{payload[0].value}</p>
    </div>
  );
}

function SingleSeriesBarChart({ data }: { data: ChartDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          axisLine={{ stroke: "var(--color-border)" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={32}
        />
        <Tooltip content={<TooltipContent />} cursor={{ fill: "var(--color-muted)" }} />
        <Bar dataKey="value" fill={BAR_FILL} radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DealsByStageChart({ data }: { data: ChartDatum[] }) {
  return <SingleSeriesBarChart data={data} />;
}

export function ContactsByStatusChart({ data }: { data: ChartDatum[] }) {
  return <SingleSeriesBarChart data={data} />;
}

export function DealsByMonthChart({ data }: { data: ChartDatum[] }) {
  return <SingleSeriesBarChart data={data} />;
}
