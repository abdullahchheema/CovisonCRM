"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { createClient } from "@/lib/supabase/client";

const workspaceSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

type WorkspaceFormValues = z.infer<typeof workspaceSchema>;

export function WorkspaceSettingsForm({
  organizationId,
  name,
  slug,
}: {
  organizationId: string;
  name: string;
  slug: string;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name },
  });

  const onSubmit = async (values: WorkspaceFormValues) => {
    const supabase = createClient();
    // organizations_update's RLS policy puts the owner/admin role check in
    // USING, not just WITH CHECK — verified directly against Postgres that
    // this means a non-admin's UPDATE matches zero rows and returns success
    // with no error at all (confirmed: plain `UPDATE ... WHERE ...` under
    // RLS returns "UPDATE 0", not an error). A bare .update().eq() here
    // would silently no-op and still show "Workspace updated". Chaining
    // .select().single() forces PostgREST to error (PGRST116, "0 rows")
    // when nothing actually matched, so the failure is visible.
    const { error } = await supabase
      .from("organizations")
      .update({ name: values.name })
      .eq("id", organizationId)
      .select()
      .single();

    if (error) {
      toast.error(
        error.code === "PGRST116"
          ? "Only workspace owners and admins can rename the workspace."
          : error.message,
      );
      return;
    }

    toast.success("Workspace updated");
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
        <CardDescription>/{slug}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Workspace name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-danger">{errors.name.message}</p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting} className="self-start">
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
