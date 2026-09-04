import { requireOrgContext } from "@/lib/supabase/org-context";
import {
  DealsByStageChart,
  ContactsByStatusChart,
  DealsByMonthChart,
} from "@/components/reports/reports-charts";

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  qualified: "Qualified",
  connected: "Connected",
  attempted: "Attempted",
  won: "Won",
};

export default async function ReportsPage() {
  const { supabase } = await requireOrgContext();

  const [{ data: pipeline }, { data: contacts }] = await Promise.all([
    supabase.from("pipelines").select("id").eq("is_default", true).is("deleted_at", null).single(),
    supabase.from("contacts").select("status").is("deleted_at", null),
  ]);

  const [{ data: stages }, { data: deals }] = await Promise.all([
    pipeline
      ? supabase
          .from("pipeline_stages")
          .select("id, name, position")
          .eq("pipeline_id", pipeline.id)
          .order("position")
      : Promise.resolve({ data: [] as { id: string; name: string; position: number }[] }),
    supabase.from("deals").select("stage_id, created_at").is("deleted_at", null),
  ]);

  const dealCountByStage = new Map<string, number>();
  for (const deal of deals ?? []) {
    dealCountByStage.set(deal.stage_id, (dealCountByStage.get(deal.stage_id) ?? 0) + 1);
  }
  const dealsByStageData = (stages ?? []).map((stage) => ({
    label: stage.name,
    value: dealCountByStage.get(stage.id) ?? 0,
  }));

  const contactCountByStatus = new Map<string, number>();
  for (const contact of contacts ?? []) {
    contactCountByStatus.set(contact.status, (contactCountByStatus.get(contact.status) ?? 0) + 1);
  }
  const contactsByStatusData = [...contactCountByStatus.entries()].map(([status, count]) => ({
    label: STATUS_LABELS[status] ?? status,
    value: count,
  }));

  // Last 6 calendar months, oldest first, including months with zero deals
  // so the chart shows a real trend line rather than only the months that
  // happened to have activity.
  const now = new Date();
  const monthBuckets: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthBuckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString(undefined, { month: "short" }),
    });
  }
  const dealCountByMonth = new Map<string, number>();
  for (const deal of deals ?? []) {
    const d = new Date(deal.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    dealCountByMonth.set(key, (dealCountByMonth.get(key) ?? 0) + 1);
  }
  const dealsByMonthData = monthBuckets.map((bucket) => ({
    label: bucket.label,
    value: dealCountByMonth.get(bucket.key) ?? 0,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-foreground">Reports</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium text-foreground">Deals by stage</h2>
          <DealsByStageChart data={dealsByStageData} />
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium text-foreground">Contacts by status</h2>
          <ContactsByStatusChart data={contactsByStatusData} />
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium text-foreground">Deals created, last 6 months</h2>
          <DealsByMonthChart data={dealsByMonthData} />
        </div>
      </div>
    </div>
  );
}
