import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-foreground">Tiny CRM</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          One workspace for contacts, deals, tasks, and communication.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/auth/sign-up">Get started</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/auth/login">Log in</Link>
        </Button>
      </div>
    </main>
  );
}
