// The one brand asset this redesign needed that couldn't come from a
// design token: a small monogram mark, authored as inline SVG (crisp at
// any size, no binary asset, and reads correctly under both themes since
// its gradient stops are CSS custom properties, not baked-in hex).
export function CovisonMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="9" fill="url(#covison-mark-gradient)" />
      <path
        d="M21.5 12.1a6.2 6.2 0 1 0 0 7.8"
        stroke="var(--on-brand)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      <defs>
        <linearGradient
          id="covison-mark-gradient"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--brand)" />
          <stop offset="1" stopColor="var(--brand-violet)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
