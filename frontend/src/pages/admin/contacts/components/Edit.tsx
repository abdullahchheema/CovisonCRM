import { useEnums } from "@/hooks/useEnums";
import { toLabelItems } from "@/utils";
import { FormField, FormSelect, TagSelector } from "@/components/common";
import { Label } from "@/components/ui/label";

type EditForm = {
  name: string;
  email: string;
  number: string;
  company: string;
  jobTitle: string;
  companySize: string;
  probability: string;
  status: string;
  priority: string;
  linkedinUrl: string;
  website: string;
  country: string;
  city: string;
  niche: string;
};

interface EditProps {
  form: EditForm;
  set: (field: keyof EditForm, value: string) => void;
  tagIds: string[];
  onTagIdsChange: (ids: string[]) => void;
}

const Edit = ({ form, set, tagIds, onTagIdsChange }: EditProps) => {
  const { contactStatuses, contactPriorities } = useEnums();

  return (
    <div className="flex flex-col gap-3">
      <FormField
        label="Full Name"
        value={form.name}
        onChange={(v) => set("name", v)}
      />
      <FormField
        label="Email"
        value={form.email}
        onChange={(v) => set("email", v)}
        type="email"
      />
      <FormField
        label="Phone"
        value={form.number}
        onChange={(v) => set("number", v)}
      />
      <FormField
        label="Company"
        value={form.company}
        onChange={(v) => set("company", v)}
      />
      <FormField
        label="Job Title"
        value={form.jobTitle}
        onChange={(v) => set("jobTitle", v)}
      />
      <FormField
        label="Company Size"
        value={form.companySize}
        onChange={(v) => set("companySize", v)}
        type="number"
      />
      <FormField
        label="Probability (0–1)"
        value={form.probability}
        onChange={(v) => set("probability", v)}
      />
      <FormSelect
        label="Status"
        value={form.status}
        onChange={(v) => set("status", v)}
        items={toLabelItems(contactStatuses)}
      />
      <FormSelect
        label="Priority"
        value={form.priority}
        onChange={(v) => set("priority", v)}
        items={toLabelItems(contactPriorities)}
      />
      <FormField
        label="LinkedIn URL"
        value={form.linkedinUrl}
        onChange={(v) => set("linkedinUrl", v)}
      />
      <FormField
        label="Website"
        value={form.website}
        onChange={(v) => set("website", v)}
      />
      <FormField
        label="Country"
        value={form.country}
        onChange={(v) => set("country", v)}
      />
      <FormField
        label="City"
        value={form.city}
        onChange={(v) => set("city", v)}
      />
      <FormField
        label="Niche / Industry"
        value={form.niche}
        onChange={(v) => set("niche", v)}
      />
      <div className="space-y-1.5">
        <Label>Tags</Label>
        <TagSelector selectedIds={tagIds} onChange={onTagIdsChange} />
      </div>
    </div>
  );
};

export default Edit;
