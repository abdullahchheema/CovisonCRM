"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRef, useState } from "react";
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
  logoSignedUrl,
}: {
  organizationId: string;
  name: string;
  slug: string;
  logoSignedUrl: string | null;
}) {
  const router = useRouter();
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    // USING, not just WITH CHECK, verified directly against Postgres that
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

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    const supabase = createClient();

    // Fixed path per org (upsert:true) rather than a unique filename per
    // upload, keeps exactly one logo object per workspace instead of
    // accumulating orphaned files with no cleanup path. The
    // org_files_insert/update RLS policies (015_storage.sql) require this
    // path's first segment to equal the caller's current_org_id(),
    // verified directly against Postgres, including that a mismatched org
    // id is rejected and a different org can't see this one's object.
    const path = `${organizationId}/logo/current`;
    const { error: uploadError } = await supabase.storage
      .from("org-files")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      toast.error(uploadError.message);
      setIsUploadingLogo(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("organizations")
      .update({ logo_url: path })
      .eq("id", organizationId)
      .select()
      .single();

    setIsUploadingLogo(false);

    if (updateError) {
      toast.error(
        updateError.code === "PGRST116"
          ? "Only workspace owners and admins can change the logo."
          : updateError.message,
      );
      return;
    }

    toast.success("Logo updated");
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace</CardTitle>
        <CardDescription>/{slug}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center gap-4">
          {logoSignedUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- see file-top note
            <img
              src={logoSignedUrl}
              alt="Workspace logo"
              className="size-12 rounded-lg border border-border object-cover"
            />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-muted text-xs text-muted-foreground">
              No logo
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleLogoChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploadingLogo}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploadingLogo ? "Uploading..." : "Change logo"}
          </Button>
        </div>

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
