import Link from "next/link";
import { requireOrgContext } from "@/lib/supabase/org-context";

const ENTITY_LINKS: Record<string, string> = {
  contacts: "/contacts",
  companies: "/companies",
  deals: "/deals",
  tasks: "/tasks",
};

export default async function ActivityLogPage() {
  const { supabase } = await requireOrgContext();

  // audit_logs_select's RLS restricts this to owner/admin/manager — a
  // member/viewer visiting this page simply sees an empty list rather than
  // an error, since the restriction is enforced at the database layer
  // regardless of what this page does or doesn't check.
  const { data: logs, error } = await supabase
    .from("audit_logs")
    .select("id, actor_id, action, entity_type, entity_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const actorIds = [
    ...new Set((logs ?? []).map((l) => l.actor_id).filter((v): v is string => !!v)),
  ];
  const { data: actors } =
    actorIds.length > 0
      ? await supabase.from("profiles").select("id, email").in("id", actorIds)
      : { data: [] as { id: string; email: string }[] };
  const actorEmailById = new Map((actors ?? []).map((a) => [a.id, a.email]));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold text-foreground">Activity log</h1>

      {error && <p className="text-sm text-danger">{error.message}</p>}

      {!error && (logs ?? []).length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Nothing logged yet, or you don&apos;t have permission to view this
            workspace&apos;s activity log (owners, admins, and managers only).
          </p>
        </div>
      )}

      {!error && (logs ?? []).length > 0 && (
        <ul className="flex flex-col gap-2">
          {(logs ?? []).map((log) => (
            <li
              key={log.id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-sm"
            >
              <span className="text-foreground">
                {actorEmailById.get(log.actor_id ?? "") ?? "Someone"}{" "}
                <span className="text-muted-foreground">{log.action}d a</span>{" "}
                {ENTITY_LINKS[log.entity_type] && log.entity_id ? (
                  <Link
                    href={`${ENTITY_LINKS[log.entity_type]}/${log.entity_id}`}
                    className="hover:underline"
                  >
                    {log.entity_type.slice(0, -1)}
                  </Link>
                ) : (
                  log.entity_type.slice(0, -1)
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {new Date(log.created_at).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
