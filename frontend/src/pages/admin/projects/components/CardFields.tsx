import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssignedToSelect } from "@/components/common";
import { DatePicker } from "@/components/custom";
import { useEnums } from "@/hooks/useEnums";
import { toLabel } from "@/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LABEL_COLORS } from "../helpers";
import type { TodoFields } from "../types";

interface CardFieldsProps {
  value: TodoFields;
  onChange: (patch: Partial<TodoFields>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  titleError?: string;
}

/**
 * Shared card editor for both "add" and "edit" flows. Keeps every card field —
 * title, label + color, priority, due date, assignee — in one place so the two
 * flows never drift apart.
 */
const CardFields = ({
  value,
  onChange,
  onSubmit,
  onCancel,
  titleError,
}: CardFieldsProps) => {
  const { contactPriorities } = useEnums();

  return (
    <div className="space-y-2.5">
      <div className="space-y-1">
        <Label className="text-xs">Title</Label>
        <Input
          autoFocus
          value={value.title}
          onChange={(e) => onChange({ title: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
            if (e.key === "Escape") onCancel();
          }}
          className="h-7 text-sm"
          placeholder="Card title"
        />
        {titleError && (
          <p className="text-[11px] text-destructive">{titleError}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Description</Label>
        <Textarea
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={2}
          placeholder="Description (optional)"
          className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Label</Label>
          <Input
            value={value.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="h-7 text-xs"
            placeholder="e.g. New"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Color</Label>
          <div className="flex flex-wrap items-center gap-1 pt-1">
            {LABEL_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.value}
                onClick={() => onChange({ labelColor: c.value })}
                className={cn(
                  "size-4 rounded-full flex items-center justify-center ring-offset-1 transition",
                  c.dot,
                  value.labelColor === c.value && "ring-2 ring-ring",
                )}
              >
                {value.labelColor === c.value && (
                  <Check className="size-2.5 text-white" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Priority</Label>
          <Select
            value={value.priority || undefined}
            onValueChange={(v) => onChange({ priority: v })}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {contactPriorities.map((p) => (
                <SelectItem key={p} value={p} className="text-xs">
                  {toLabel(p)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Due date</Label>
          <DatePicker
            value={value.dueDate}
            onChange={(v) => onChange({ dueDate: v })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Estimated duration</Label>
        <Input
          value={value.estimatedDuration}
          onChange={(e) => onChange({ estimatedDuration: e.target.value })}
          className="h-7 text-xs"
          placeholder="e.g. 2h, 30m"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Assignee</Label>
        <AssignedToSelect
          value={value.author.name}
          onChange={(v) =>
            onChange({
              author: {
                name: v,
                image: value.author.image || "/static/avatar/001-man.svg",
              },
            })
          }
          triggerClassName="h-7 text-xs"
        />
      </div>
    </div>
  );
};

export default CardFields;
