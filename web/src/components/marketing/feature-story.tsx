import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";

interface FeatureStoryProps {
  eyebrow: string;
  title: string;
  description: string;
  reverse?: boolean;
  visual: React.ReactNode;
}

// One reusable alternating row, fed 4 times from page.tsx (Centralize /
// Track / Collaborate / Grow). Each pass supplies its own small CSS
// mockup as `visual` (see feature-visuals.tsx) rather than this component
// knowing anything about what it's illustrating.
export function FeatureStory({ eyebrow, title, description, reverse, visual }: FeatureStoryProps) {
  return (
    <Reveal className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:gap-16">
      <div className={cn(reverse && "md:order-2")}>
        <p className="text-xs font-medium uppercase tracking-wide text-brand">{eyebrow}</p>
        <h2 className="mt-3 font-display text-h2 text-foreground md:text-h1">{title}</h2>
        <p className="mt-4 text-text-2">{description}</p>
      </div>
      <div className={cn(reverse && "md:order-1")}>{visual}</div>
    </Reveal>
  );
}
