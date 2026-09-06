import Link from "next/link";
import { requireOrgContext } from "@/lib/supabase/org-context";
import { PipelineHero } from "@/components/dashboard/pipeline-hero";
import { MiniMetrics } from "@/components/dashboard/mini-metrics";
import { PipelineByStage } from "@/components/dashboard/pipeline-by-stage";
import { ActivityFeed } from "@/components/dashboard/activity-feed";

export default async function DashboardPage() {
  const { supabase, org, profile } = await requireOrgContext();

  const now = new Date();
  const nowIso = now.toISOString();
  const fourteenDaysAgoDate = new Date(now);
  fourteenDaysAgoDate.setDate(fourteenDaysAgoDate.getDate() - 14);
  const fourteenDaysAgo = fourteenDaysAgoDate.toISOString();

  const { data: defaultPipeline } = await supabase
    .from("pipelines")
    .select("id")
    .eq("is_default", true)
    .is("deleted_at", null)
    .single();

  const { data: stages } = defaultPipeline
    ? await supabase
        .from("pipeline_stages")
        .select("id, name, position, is_won, is_lost")
        .eq("pipeline_id", defaultPipeline.id)
        .order("position")
    : { data: [] as { id: string; name: string; position: number; is_won: boolean; is_lost: boolean }[] };

  const [
    { count: contactCount },
    { count: companyCount },
    { data: openDeals },
    { count: openTaskCount },
    { count: overdueTaskCount },
    { data: recentActivities },
    { data: upcomingTasks },
  ] = await Promise.all([
    supabase.from("contacts").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("companies").select("*", { count: "exact", head: true }).is("deleted_at", null),
    supabase
      .from("deals")
      .select("id, value, stage_id, created_at")
      .is("deleted_at", null),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .neq("status", "completed"),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .neq("status", "completed")
      .lt("due_at", nowIso),
    supabase
      .from("activities")
      .select("id, type, body, occurred_at, contact_id, company_id, deal_id")
      .is("deleted_at", null)
      .order("occurred_at", { ascending: false })
      .limit(6),
    supabase
      .from("tasks")
      .select("id, title, due_at")
      .is("deleted_at", null)
      .neq("status", "completed")
      .not("due_at", "is", null)
      .order("due_at", { ascending: true })
      .limit(5),
  ]);

  const stageList = stages ?? [];
  const closedStageIds = new Set(stageList.filter((s) => s.is_won || s.is_lost).map((s) => s.id));
  const openDealsOnly = (openDeals ?? []).filter((d) => !closedStageIds.has(d.stage_id));
  const pipelineValue = openDealsOnly.reduce((sum, deal) => sum + deal.value, 0);

  // Pipeline by stage. Every stage (including won/lost), value + count.
  const stageData = stageList.map((stage) => {
    const dealsInStage = (openDeals ?? []).filter((d) => d.stage_id === stage.id);
    return {
      id: stage.id,
      name: stage.name,
      value: dealsInStage.reduce((sum, d) => sum + d.value, 0),
      count: dealsInStage.length,
      isWon: stage.is_won,
      isLost: stage.is_lost,
    };
  });

  // Sparkline: cumulative open-pipeline value by day of deal creation, over
  // the trailing 14 days, real derived data, not a decorative squiggle.
  const recentOpenDeals = openDealsOnly.filter((d) => d.created_at >= fourteenDaysAgo);
  const dayBuckets = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const bucketDate = new Date(now);
    bucketDate.setDate(bucketDate.getDate() - i);
    dayBuckets.set(bucketDate.toISOString().slice(0, 10), 0);
  }
  for (const deal of recentOpenDeals) {
    const day = deal.created_at.slice(0, 10);
    if (dayBuckets.has(day)) {
      dayBuckets.set(day, (dayBuckets.get(day) ?? 0) + deal.value);
    }
  }
  const baselineValue = pipelineValue - recentOpenDeals.reduce((sum, d) => sum + d.value, 0);
  let running = baselineValue;
  const trend = Array.from(dayBuckets.values()).map((v) => {
    running += v;
    return running;
  });

  const contactIds = [
    ...new Set((recentActivities ?? []).map((a) => a.contact_id).filter((v): v is string => !!v)),
  ];
  const companyIds = [
    ...new Set((recentActivities ?? []).map((a) => a.company_id).filter((v): v is string => !!v)),
  ];
  const [{ data: activityContacts }, { data: activityCompanies }] = await Promise.all([
    contactIds.length > 0
      ? supabase.from("contacts").select("id, name").in("id", contactIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    companyIds.length > 0
      ? supabase.from("companies").select("id, name").in("id", companyIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);
  const contactNameById = new Map((activityContacts ?? []).map((c) => [c.id, c.name]));
  const companyNameById = new Map((activityCompanies ?? []).map((c) => [c.id, c.name]));

  const activityData = (recentActivities ?? []).map((activity) => {
    const subject = activity.contact_id
      ? contactNameById.get(activity.contact_id)
      : activity.company_id
        ? companyNameById.get(activity.company_id)
        : null;
    const href = activity.contact_id
      ? `/contacts/${activity.contact_id}`
      : activity.company_id
        ? `/companies/${activity.company_id}`
        : undefined;
    return {
      id: activity.id,
      body: activity.body,
      type: activity.type,
      occurredAt: activity.occurred_at,
      subject: subject ?? null,
      href,
    };
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <p className="font-display text-hero text-foreground">
        {greeting}, {profile.full_name?.split(" ")[0] || "there"}
      </p>
      <p className="mt-1 text-sm text-text-2">{org.name}</p>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PipelineHero value={pipelineValue} dealCount={openDealsOnly.length} trend={trend} />
        </div>
        <MiniMetrics
          metrics={[
            { label: "Contacts", value: String(contactCount ?? 0) },
            { label: "Companies", value: String(companyCount ?? 0) },
            {
              label: "Open tasks",
              value: String(openTaskCount ?? 0),
              hint: overdueTaskCount ? `${overdueTaskCount} overdue` : undefined,
            },
          ]}
        />
      </div>

      {stageData.length > 0 && (
        <div className="mt-8 rounded-xl bg-surface-2 p-6">
          <PipelineByStage stages={stageData} />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-xl bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-text-2">
            Recent activity
          </h2>
          <ActivityFeed activities={activityData} />
        </div>

        <div className="lg:col-span-2 rounded-xl bg-surface p-6 shadow-sm">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-text-2">
            Upcoming tasks
          </h2>
          {(upcomingTasks ?? []).length === 0 ? (
            <p className="text-sm text-text-2">Nothing due.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {(upcomingTasks ?? []).map((task) => (
                <li key={task.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{task.title}</span>
                  <span className="text-xs tabular-nums text-text-3">
                    {task.due_at ? new Date(task.due_at).toLocaleDateString() : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/tasks" className="mt-4 inline-block text-xs text-primary hover:underline">
            View all tasks →
          </Link>
        </div>
      </div>
    </div>
  );
}
