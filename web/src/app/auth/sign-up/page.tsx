import { Suspense } from "react";
import { SignUpForm } from "@/components/sign-up-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function Page() {
  return (
    <AuthShell>
      {/* SignUpForm reads ?next= via useSearchParams — same Suspense
      requirement as auth/login/page.tsx. */}
      <Suspense>
        <SignUpForm />
      </Suspense>
    </AuthShell>
  );
}
