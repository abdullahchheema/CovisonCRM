import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {/* LoginForm reads ?next= via useSearchParams, which requires a
        Suspense boundary on a prerendered page or the production build
        fails outright (see node_modules/next/dist/docs .../use-search-params.md). */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
