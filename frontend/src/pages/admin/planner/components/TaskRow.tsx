import { useNavigate } from "react-router-dom";
import { CalendarDays, Timer, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { PriorityIndicator } from "@/components/common";
import CustomBadge from "@/components/custom/CustomBadge";
import type { PlannerTask } from "../types";

interface TaskRowProps {
  task: PlannerTask;
  /** Highlights the due-date chip in destructive colors (used in the Overdue section). */
  overdue?: boolean;
}

const formatDueDate = (dueDate: string) =>
  new Date(dueDate + "T00:00:00").toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

const TaskRow = ({ task, overdue }: TaskRowProps) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/dashboard/todos/${task.projectId}`)}
      className={cn(
        "w-full flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3.5 py-3 text-left transition-all hover:border-primary/40 hover:shadow-sm",
        overdue && "border-l-4 border-l-destructive",
      )}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-primary">
          <FolderKanban className="size-3" />
          <span className="truncate">{task.projectName}</span>
        </div>
        <p className="text-sm font-medium leading-snug truncate">
          {task.title}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
        {task.priority && (
          <PriorityIndicator
            value={task.priority}
            showLabel={false}
            className="text-xs"
          />
        )}
        {task.estimatedDuration && (
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            <Timer className="size-3" />
            {task.estimatedDuration}
          </span>
        )}
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
            overdue
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground",
          )}
        >
          <CalendarDays className="size-3" />
          {formatDueDate(task.dueDate)}
        </span>
        {task.status && <CustomBadge variant="neutral">{task.status}</CustomBadge>}
      </div>
    </button>
  );
};

export default TaskRow;
