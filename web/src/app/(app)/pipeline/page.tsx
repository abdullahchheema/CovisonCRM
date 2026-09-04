import { requireOrgContext } from "@/lib/supabase/org-context";
import { DealFormDialog } from "@/components/deals/deal-form-dialog";
import { DealCard } from "@/components/deals/deal-card";

export default async function PipelinePage() {
  const { supabase, org } = await requireOrgContext();

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

  const [{ data: stages }, { data: deals }, { data: contacts }, { data: companies }] =
    await Promise.all([
      supabase
        .from("pipeline_stages")
        .select("id, name, position")
        .eq("pipeline_id", pipeline.id)
        .order("position"),
      supabase
        .from("deals")
        .select("id, name, value, currency, stage_id, contact_id")
        .eq("pipeline_id", pipeline.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase.from("contacts").select("id, name").is("deleted_at", null).order("name"),
      supabase.from("companies").select("id, name").is("deleted_at", null).order("name"),
    ]);

  const contactNameById = new Map((contacts ?? []).map((c) => [c.id, c.name]));
  const stageList = stages ?? [];

  const dealsByStage = new Map<string, typeof deals>();
  for (const stage of stageList) {
    dealsByStage.set(
      stage.id,
      (deals ?? []).filter((deal) => deal.stage_id === stage.id),
    );
  }

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
            total
          </p>
        </div>
        <DealFormDialog
          organizationId={org.id}
          pipelineId={pipeline.id}
          stages={stageList}
          contacts={contacts ?? []}
          companies={companies ?? []}
        />
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {stageList.map((stage) => (
          <div key={stage.id} className="w-64 shrink-0">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-medium text-foreground">{stage.name}</h2>
              <span className="text-xs text-muted-foreground">
                {(dealsByStage.get(stage.id) ?? []).length}
              </span>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/40 p-2 min-h-24">
              {(dealsByStage.get(stage.id) ?? []).map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  stages={stageList}
                  contactName={deal.contact_id ? (contactNameById.get(deal.contact_id) ?? null) : null}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
