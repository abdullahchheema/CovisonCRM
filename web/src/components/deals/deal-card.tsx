"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

import { Select } from "@/components/ui/select";
import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { DealEditDialog } from "@/components/deals/deal-edit-dialog";
import { createClient } from "@/lib/supabase/client";

interface DealCardProps {
  deal: {
    id: string;
    name: string;
    value: number;
    currency: string;
    stage_id: string;
    contact_id: string | null;
    company_id: string | null;
    owner_id: string | null;
  };
  stages: { id: string; name: string }[];
  contacts: { id: string; name: string }[];
  companies: { id: string; name: string }[];
  members: { id: string; name: string }[];
  contactName: string | null;
}

export function DealCard({ deal, stages, contacts, companies, members, contactName }: DealCardProps) {
  const router = useRouter();

  const handleStageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("deals")
      .update({ stage_id: e.target.value })
      .eq("id", deal.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    router.refresh();
  };

  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <Link href={`/deals/${deal.id}`} className="font-medium text-foreground hover:underline">
        {deal.name}
      </Link>
      <p className="text-sm text-muted-foreground">
        {new Intl.NumberFormat(undefined, {
          style: "currency",
          currency: deal.currency || "USD",
        }).format(deal.value)}
      </p>
      {contactName && deal.contact_id && (
        <Link
          href={`/contacts/${deal.contact_id}`}
          className="text-xs text-muted-foreground hover:underline"
        >
          {contactName}
        </Link>
      )}
      <div className="mt-2 flex items-center gap-2">
        <Select value={deal.stage_id} onChange={handleStageChange} className="h-7 text-xs">
          {stages.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </Select>
        <DealEditDialog deal={deal} contacts={contacts} companies={companies} members={members} />
        <SoftDeleteButton table="deals" id={deal.id} label="Deal" />
      </div>
    </div>
  );
}
