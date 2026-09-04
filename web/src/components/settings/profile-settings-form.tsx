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

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileSettingsForm({
  userId,
  email,
  fullName,
}: {
  userId: string;
  email: string;
  fullName: string | null;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: fullName ?? "" },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: values.full_name })
      .eq("id", userId);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Profile updated");
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>{email}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Name</Label>
            <Input id="full_name" {...register("full_name")} />
            {errors.full_name && (
              <p className="text-sm text-danger">{errors.full_name.message}</p>
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
