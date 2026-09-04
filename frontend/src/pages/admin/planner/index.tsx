import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ListTodo,
} from "lucide-react";
import { PageHeader, PageSpinner } from "@/components/custom";
import { apiProvider } from "@/services/utilities/provider";
import { getTimeOfDay } from "@/utils";
import { useAuth } from "@/context/AuthContext";
import type { PlannerResponse, PlannerTask } from "./types";
import StatCard from "./components/StatCard";
import PlannerSection from "./components/PlannerSection";

/** YYYY-MM-DD for "today + offset days", in local time. */
const isoDateOffset = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

const Planner = () => {
  const [data, setData] = useState<PlannerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const name = user?.name ?? "there";

  useEffect(() => {
    const ctrl = new AbortController();
    // Intentionally not cached (see provider.ts CACHE_TTL) — the planner must
    // always reflect the latest Kanban state, since it is a pure read view on
    // top of the board's todos.
    apiProvider.getAll("dashboard/planner", ctrl.signal, true).then((res) => {
      if (res && typeof res === "object" && "stats" in res) {
        setData(res as PlannerResponse);
      }
      setLoading(false);
    });
    return () => ctrl.abort();
  }, []);

  const buckets = useMemo(() => {
    const upcoming = data?.upcoming ?? [];
    const byDate = (offset: number) => {
      const target = isoDateOffset(offset);
      return upcoming.filter((t) => t.dueDate === target);
    };
    const grouped: { label: string; tasks: PlannerTask[] }[] = [
      { label: "Tomorrow", tasks: byDate(1) },
      { label: "In 2 Days", tasks: byDate(2) },
      { label: "In 3 Days", tasks: byDate(3) },
    ];
    return grouped;
  }, [data]);

  if (loading) return <PageSpinner />;

  const stats = data?.stats ?? {
    dueToday: 0,
    overdue: 0,
    dueNext3Days: 0,
    completedToday: 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good ${getTimeOfDay()}, ${name.split(" ")?.[0]} 👋`}
        description="What do you need to work on today across all projects?"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Due Today"
          value={stats.dueToday}
          icon={CalendarDays}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon={AlertTriangle}
          color="bg-destructive/10 text-destructive"
        />
        <StatCard
          label="Due Next 3 Days"
          value={stats.dueNext3Days}
          icon={CalendarClock}
          color="bg-amber-500/10 text-amber-600"
        />
        <StatCard
          label="Completed Today"
          value={stats.completedToday}
          icon={CheckCircle2}
          color="bg-emerald-500/10 text-emerald-600"
        />
      </div>

      {/* Agenda */}
      <div className="space-y-6">
        <PlannerSection
          title="Overdue"
          icon={AlertTriangle}
          tasks={data?.overdue ?? []}
          emptyMessage="No overdue tasks — nice work"
          tone="destructive"
          highlightOverdue
        />

        <PlannerSection
          title="Today"
          icon={ListTodo}
          tasks={data?.today ?? []}
          emptyMessage="Nothing due today"
        />

        {buckets.map((bucket) => (
          <PlannerSection
            key={bucket.label}
            title={bucket.label}
            icon={CalendarClock}
            tasks={bucket.tasks}
            emptyMessage={`Nothing due ${bucket.label.toLowerCase()}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Planner;
