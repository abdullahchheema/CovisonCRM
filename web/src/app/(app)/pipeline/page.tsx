import { requireOrgContext } from "@/lib/supabase/org-context";
import { DealFormDialog } from "@/components/deals/deal-form-dialog";
import { PipelineBoard } from "@/components/deals/pipeline-board";
import { getOrgMemberOptions } from "@/lib/supabase/org-members";

export default async function PipelinePage() {
  const { supabase, org, profile } = await requireOrgContext();

  const { data: pipeline } = await supabase
    .from("pipelines")
    .select("id, name")
    .eq("is_default", true)
    .is("deleted_at", null)
    .single();

  if (!pipeline) {
    return (
      <p className="text-sm text-muted-foreground">
        No pipeline found for this workspace yet.
      </p>
    );
  }

  const [{ data: stages }, { data: deals }, { data: contacts }, { data: companies }, members] =
    await Promise.all([
      supabase
        .from("pipeline_stages")
        .select("id, name, position")
        .eq("pipeline_id", pipeline.id)
        .order("position"),
      supabase
        .from("deals")
        .select("id, name, value, currency, stage_id, contact_id, company_id, owner_id")
        .eq("pipeline_id", pipeline.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase.from("contacts").select("id, name").is("deleted_at", null).order("name"),
      supabase.from("companies").select("id, name").is("deleted_at", null).order("name"),
      getOrgMemberOptions(supabase),
    ]);

  const stageList = stages ?? [];
  const totalValue = (deals ?? []).reduce((sum, deal) => sum + deal.value, 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{pipeline.name}</h1>
          <p className="text-sm text-muted-foreground">
            {(deals ?? []).length} open deals ·{" "}
            {new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(
              totalValue,
            )}{" "}
            total · drag a card between columns to change its stage
          </p>
        </div>
        <DealFormDialog
          organizationId={org.id}
          pipelineId={pipeline.id}
          stages={stageList}
          contacts={contacts ?? []}
          companies={companies ?? []}
          members={members}
        />
      </div>

      <PipelineBoard
        stages={stageList}
        initialDeals={deals ?? []}
        contacts={contacts ?? []}
        companies={companies ?? []}
        members={members}
        currentUserId={profile.id}
      />
    </div>
  );
}
