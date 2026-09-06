"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CreateOrganizationForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    const slug = slugify(name);
    if (!slug) {
      setError("Please enter a workspace name.");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.rpc("create_organization", {
      org_name: name,
      org_slug: slug,
    });

    if (error) {
      // A slug collision surfaces as a plain Postgres unique-violation
      // message here, good enough for now, worth a friendlier mapping
      // once this flow gets real usage.
      setError(error.message);
      setIsLoading(false);
      return;
    }

    // The RPC set profiles.active_organization_id, but this client's
    // current session token still carries the old (or absent) org claim
    // until refreshed.
    await supabase.auth.refreshSession();
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-h3">Create your workspace</CardTitle>
          <CardDescription>
            This is where your team&apos;s contacts, deals, and activity will
            live.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Workspace name</Label>
                <Input
                  id="name"
                  placeholder="Acme Inc."
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create workspace"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
