import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/auth/auth-shell";
import { Suspense } from "react";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <p className="text-sm text-text-2">
      {params?.error
        ? `Code error: ${params.error}`
        : "An unspecified error occurred."}
    </p>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <AuthShell>
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-h3">
            Sorry, something went wrong.
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense>
            <ErrorContent searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
