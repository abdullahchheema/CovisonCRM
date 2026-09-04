import { Suspense } from "react";
import { SignUpForm } from "@/components/sign-up-form";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {/* SignUpForm reads ?next= via useSearchParams — same Suspense
        requirement as auth/login/page.tsx. */}
        <Suspense>
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  );
}
