import Link from "next/link";
import { requireOrgContext } from "@/lib/supabase/org-context";
import { StatCard } from "@/components/dashboard/stat-card";

export default async function DashboardPage() {
  const { supabase, org, profile } = await requireOrgContext();

  const nowIso = new Date().toISOString();

  // PostgREST filters don't support raw SQL subqueries — "open deals" (not
  // in a won/lost stage) needs the closed stage ids resolved first, then
  // passed to deals as a plain array via .not(col, 'in', array), which
  // supabase-js serializes correctly on its own.
  const { data: closedStages } = await supabase
    .from("pipeline_stages")
    .select("id")
    .or("is_won.eq.true,is_lost.eq.true");
  const closedStageIds = (closedStages ?? []).map((s) => s.id);

  let openDealsQuery = supabase.from("deals").select("id, value").is("deleted_at", null);
  if (closedStageIds.length > 0) {
    openDealsQuery = openDealsQuery.not("stage_id", "in", `(${closedStageIds.join(",")})`);
  }

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
    openDealsQuery,
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
      .limit(5),
    supabase
      .from("tasks")
      .select("id, title, due_at")
      .is("deleted_at", null)
      .neq("status", "completed")
      .not("due_at", "is", null)
      .order("due_at", { ascending: true })
      .limit(5),
  ]);

  const pipelineValue = (openDeals ?? []).reduce((sum, deal) => sum + deal.value, 0);

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

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">
        {org.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Signed in as {profile.email}</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Contacts" value={String(contactCount ?? 0)} />
        <StatCard label="Companies" value={String(companyCount ?? 0)} />
        <StatCard
          label="Open pipeline"
          value={new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(
            pipelineValue,
          )}
          hint={`${(openDeals ?? []).length} open deals`}
        />
        <StatCard
          label="Open tasks"
          value={String(openTaskCount ?? 0)}
          hint={overdueTaskCount ? `${overdueTaskCount} overdue` : undefined}
        />
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium text-foreground">Recent activity</h2>
          {(recentActivities ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {(recentActivities ?? []).map((activity) => {
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
                return (
                  <li key={activity.id} className="text-sm">
                    <p className="text-foreground">
                      {activity.body ?? `${activity.type} logged`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {subject && href ? (
                        <Link href={href} className="hover:underline">
                          {subject}
                        </Link>
                      ) : null}
                      {subject ? " · " : ""}
                      {new Date(activity.occurred_at).toLocaleString()}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium text-foreground">Upcoming tasks</h2>
          {(upcomingTasks ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing due.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {(upcomingTasks ?? []).map((task) => (
                <li key={task.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{task.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {task.due_at ? new Date(task.due_at).toLocaleDateString() : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/tasks" className="mt-3 inline-block text-xs text-primary hover:underline">
            View all tasks →
          </Link>
        </div>
      </div>
    </div>
  );
}
