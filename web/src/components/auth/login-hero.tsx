import Link from "next/link";
import { CovisonMark } from "@/components/brand/covison-mark";

// The bespoke half of the login page's split composition (the plan's only
// auth page that gets one. The other 5 share the plainer AuthShell).
// Composed entirely from tokens and CSS, per the "build the hero in
// HTML/CSS, not an image" decision: no screenshot of the real app is
// possible here anyway (this renders while signed out), and a hand-drawn
// approximation would go stale the moment the real UI changes.
const STAGES = [
  { label: "Qualified", value: 68, count: 12 },
  { label: "Proposal", value: 42, count: 7 },
  { label: "Won", value: 90, count: 15 },
];

function PipelinePreview() {
  return (
    <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="mb-3 flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-white/20" />
        <span className="size-2 rounded-full bg-white/20" />
        <span className="size-2 rounded-full bg-white/20" />
        <span className="ml-2 text-xs text-white/50">Pipeline</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {STAGES.map((stage) => (
          <div key={stage.label}>
            <div className="mb-1 flex items-center justify-between text-xs text-white/60">
              <span>{stage.label}</span>
              <span className="tabular-nums">{stage.count}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-brand to-brand-violet"
                style={{ width: `${stage.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LoginHero() {
  return (
    <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-ink p-10 md:flex lg:p-14">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 size-96 rounded-full bg-brand/25 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-[-4rem] size-80 rounded-full bg-brand-violet/20 blur-3xl" />
      </div>

      <Link href="/" className="relative z-10 flex items-center gap-2">
        <CovisonMark className="size-11" />
        <span className="font-display text-xl text-white">Covison</span>
      </Link>

      <div className="relative z-10 max-w-md">
        <p className="font-display text-hero leading-tight text-white">
          Every deal, every conversation, one calm view.
        </p>
        <p className="mt-4 text-white/70">
          Covison brings contacts, pipeline, and tasks into a single
          workspace built for teams who&apos;d rather sell than juggle tools.
        </p>
      </div>

      <div className="relative z-10">
        <PipelinePreview />
      </div>
    </div>
  );
}
