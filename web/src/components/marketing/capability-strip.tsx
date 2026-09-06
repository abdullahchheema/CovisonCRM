import { Users, GitBranch, CheckSquare, LifeBuoy, BarChart3 } from "lucide-react";

// Stands in for the usual "trusted by" logo strip, this product has no
// customers to name yet (see the plan's copy-discipline rule: no invented
// logos or stats), so this names real product areas instead of fabricated
// social proof.
const CAPABILITIES = [
  { label: "Contacts & companies", icon: Users },
  { label: "Sales pipeline", icon: GitBranch },
  { label: "Tasks", icon: CheckSquare },
  { label: "Tickets", icon: LifeBuoy },
  { label: "Reports", icon: BarChart3 },
];

export function CapabilityStrip() {
  return (
    <section className="border-y border-line-soft bg-surface-2 py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6">
        {CAPABILITIES.map(({ label, icon: Icon }) => (
          <div key={label} className="flex items-center gap-2 text-sm text-text-2">
            <Icon className="size-4 text-text-3" />
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}
