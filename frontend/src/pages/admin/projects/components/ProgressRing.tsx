import { cn } from "@/lib/utils";

interface ProgressRingProps {
  /** 0–100 */
  progress: number;
  size?: number;
  stroke?: number;
  className?: string;
}

/**
 * Animated circular progress indicator. Uses currentColor so the track/fill
 * inherit the app's primary palette and stay theme-consistent.
 */
const ProgressRing = ({
  progress,
  size = 150,
  stroke = 12,
  className,
}: ProgressRingProps) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="text-primary/10"
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-[stroke-dashoffset] duration-700 ease-out"
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums leading-none">
          {clamped}
          <span className="text-lg font-semibold text-muted-foreground">%</span>
        </span>
        <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Complete
        </span>
      </div>
    </div>
  );
};

export default ProgressRing;
