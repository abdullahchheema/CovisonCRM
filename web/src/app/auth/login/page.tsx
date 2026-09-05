import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { LoginHero } from "@/components/auth/login-hero";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full">
      <LoginHero />
      <div className="flex w-full flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          {/* LoginForm reads ?next= via useSearchParams, which requires a
          Suspense boundary on a prerendered page or the production build
          fails outright (see node_modules/next/dist/docs .../use-search-params.md). */}
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
