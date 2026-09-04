import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomEmptyState } from "@/components/custom";
import TaskRow from "./TaskRow";
import type { PlannerTask } from "../types";

interface PlannerSectionProps {
  title: string;
  icon: LucideIcon;
  tasks: PlannerTask[];
  emptyMessage: string;
  /** Tints the section's icon/count badge (e.g. destructive for Overdue). */
  tone?: "default" | "destructive";
  /** Highlights each task row's due-date chip — used for the Overdue section. */
  highlightOverdue?: boolean;
  headerRight?: ReactNode;
}

const PlannerSection = ({
  title,
  icon: Icon,
  tasks,
  emptyMessage,
  tone = "default",
  highlightOverdue = false,
  headerRight,
}: PlannerSectionProps) => (
  <section className="space-y-2.5">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex items-center justify-center size-7 rounded-lg",
            tone === "destructive"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-4" />
        </span>
        <h2 className="text-sm font-semibold">{title}</h2>
        <span
          className={cn(
            "text-xs font-medium tabular-nums rounded-full px-1.5 py-0.5",
            tone === "destructive"
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary",
          )}
        >
          {tasks.length}
        </span>
      </div>
      {headerRight}
    </div>

    {tasks.length === 0 ? (
      <CustomEmptyState
        icon={Icon}
        title={emptyMessage}
        compact
        className="py-6 rounded-xl border border-dashed border-border/60"
      />
    ) : (
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskRow key={task._id} task={task} overdue={highlightOverdue} />
        ))}
      </div>
    )}
  </section>
);

export default PlannerSection;
