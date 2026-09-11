"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

const DELAY_PRESETS = [7, 14, 21, 30];

interface StepDraft {
  key: string;
  delay_days: number;
  email_template_id: string;
}

interface EmailTemplateOption {
  id: string;
  name: string;
}

interface ExistingSequence {
  id: string;
  name: string;
  description: string | null;
  steps: { delay_days: number; email_template_id: string }[];
}

interface SequenceFormDialogProps {
  organizationId: string;
  templates: EmailTemplateOption[];
  sequence?: ExistingSequence;
  trigger: React.ReactNode;
}

function newStep(): StepDraft {
  return { key: crypto.randomUUID(), delay_days: 7, email_template_id: "" };
}

// Steps are plain component state, not react-hook-form fields: a sequence
// is just an ordered list plus two text fields, and editing overwrites all
// of a sequence's steps on save (delete + reinsert) rather than diffing
// them, simpler, and safe because a running enrollment tracks its position
// by step *position*, not step id.
export function SequenceFormDialog({
  organizationId,
  templates,
  sequence,
  trigger,
}: SequenceFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(sequence?.name ?? "");
  const [description, setDescription] = useState(sequence?.description ?? "");
  const [steps, setSteps] = useState<StepDraft[]>(
    sequence?.steps.length
      ? sequence.steps.map((s) => ({ key: crypto.randomUUID(), ...s }))
      : [newStep()],
  );
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const reset = () => {
    setName(sequence?.name ?? "");
    setDescription(sequence?.description ?? "");
    setSteps(
      sequence?.steps.length
        ? sequence.steps.map((s) => ({ key: crypto.randomUUID(), ...s }))
        : [newStep()],
    );
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const updateStep = (key: string, patch: Partial<StepDraft>) => {
    setSteps((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }
    if (steps.length === 0 || steps.some((s) => !s.email_template_id)) {
      toast.error("Every step needs a template.");
      return;
    }

    setIsSaving(true);
    const supabase = createClient();

    const sequenceId = sequence?.id;
    const { data: savedSequence, error: sequenceError } = sequenceId
      ? await supabase
          .from("follow_up_sequences")
          .update({ name, description: description || null })
          .eq("id", sequenceId)
          .select("id")
          .single()
      : await supabase
          .from("follow_up_sequences")
          .insert({ organization_id: organizationId, name, description: description || null })
          .select("id")
          .single();

    if (sequenceError || !savedSequence) {
      setIsSaving(false);
      toast.error(sequenceError?.message ?? "Could not save sequence.");
      return;
    }

    if (sequenceId) {
      const { error: deleteError } = await supabase
        .from("follow_up_sequence_steps")
        .delete()
        .eq("sequence_id", sequenceId);
      if (deleteError) {
        setIsSaving(false);
        toast.error(deleteError.message);
        return;
      }
    }

    const { error: stepsError } = await supabase.from("follow_up_sequence_steps").insert(
      steps.map((step, i) => ({
        organization_id: organizationId,
        sequence_id: savedSequence.id,
        position: i + 1,
        delay_days: step.delay_days,
        email_template_id: step.email_template_id,
      })),
    );

    setIsSaving(false);

    if (stepsError) {
      toast.error(stepsError.message);
      return;
    }

    toast.success(sequence ? "Sequence updated" : "Sequence created");
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sequence ? "Edit follow-up sequence" : "New follow-up sequence"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="seq-name">Name</Label>
            <Input id="seq-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="seq-description">Description</Label>
            <Textarea
              id="seq-description"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label>Steps</Label>
            {steps.map((step, i) => (
              <div key={step.key} className="rounded-lg bg-surface-2 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wide text-text-3">
                    Step {i + 1}
                  </span>
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSteps((prev) => prev.filter((s) => s.key !== step.key))}
                      className="text-text-3 hover:text-danger"
                      aria-label={`Remove step ${i + 1}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label htmlFor={`step-template-${step.key}`} className="text-xs">
                      Template
                    </Label>
                    <Select
                      id={`step-template-${step.key}`}
                      value={step.email_template_id}
                      onChange={(e) => updateStep(step.key, { email_template_id: e.target.value })}
                    >
                      <option value="">Select a template...</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor={`step-delay-${step.key}`} className="text-xs">
                      Send after (days {i === 0 ? "since enrollment" : "since previous step"})
                    </Label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        id={`step-delay-${step.key}`}
                        type="number"
                        min={1}
                        className="h-9 w-20"
                        value={step.delay_days}
                        onChange={(e) =>
                          updateStep(step.key, { delay_days: Number(e.target.value) || 1 })
                        }
                      />
                      <div className="flex gap-1">
                        {DELAY_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => updateStep(step.key, { delay_days: preset })}
                            className="rounded-full bg-surface-3 px-2 py-0.5 text-xs font-medium text-text-2 hover:bg-brand-soft hover:text-primary"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSteps((prev) => [...prev, newStep()])}
            >
              <Plus /> Add step
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : sequence ? "Save changes" : "Create sequence"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
