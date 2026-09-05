import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/marketing/site-header";
import { Hero } from "@/components/marketing/hero";
import { CapabilityStrip } from "@/components/marketing/capability-strip";
import { FeatureStory } from "@/components/marketing/feature-story";
import {
  ContactVisual,
  PipelineVisual,
  TaskVisual,
  ReportVisual,
} from "@/components/marketing/feature-visuals";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { ProductShowcase } from "@/components/marketing/product-showcase";
import { Differentiation } from "@/components/marketing/differentiation";
import { BrandSection } from "@/components/marketing/brand-section";
import { Testimonial } from "@/components/marketing/testimonial";
import { FinalCta } from "@/components/marketing/final-cta";
import { SiteFooter } from "@/components/marketing/site-footer";

// Deliberately not gated by requireOrgContext() or any redirect — this
// route renders identically (module the header's CTA label) whether the
// visitor is signed in or not, and nothing else in the app links here, so
// it's the one page safe to fully replace without touching auth or
// routing. See the plan's Phase 9 note on why this file was chosen first.
export default async function Home() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const isSignedIn = !!claimsData?.claims?.sub;

  return (
    <div className="flex min-h-svh flex-col bg-bg">
      <SiteHeader isSignedIn={isSignedIn} />
      <main className="flex-1">
        <Hero isSignedIn={isSignedIn} />
        <CapabilityStrip />

        <FeatureStory
          eyebrow="Centralize"
          title="Every contact, in one record."
          description="Names, companies, notes, and history — no more digging through email threads to remember where a relationship left off."
          visual={<ContactVisual />}
        />
        <FeatureStory
          eyebrow="Track"
          title="Watch deals move, stage by stage."
          description="A pipeline built around how your team actually sells, with every deal exactly where it is right now."
          reverse
          visual={<PipelineVisual />}
        />
        <FeatureStory
          eyebrow="Collaborate"
          title="Tasks your whole team can see."
          description="Assign work, track tickets, and leave notes that everyone can find — nothing stuck in a single inbox."
          visual={<TaskVisual />}
        />
        <FeatureStory
          eyebrow="Grow"
          title="Know what's working before you scale it."
          description="Reports on pipeline health and deal velocity, so decisions come from what's actually happening."
          reverse
          visual={<ReportVisual />}
        />

        <ProductShowcase />
        <HowItWorks />
        <Differentiation />
        <BrandSection />
        <Testimonial />
        <FinalCta isSignedIn={isSignedIn} />
      </main>
      <SiteFooter />
    </div>
  );
}
