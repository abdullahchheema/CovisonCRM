import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export function FinalCta() {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-24 text-center">
      <Reveal>
        <h2 className="font-display text-h2 text-foreground md:text-h1">
          Bring your team into one workspace.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-text-2">
          Set up your pipeline in minutes and see everything in one place
          from day one.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/auth/sign-up">Get started</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
