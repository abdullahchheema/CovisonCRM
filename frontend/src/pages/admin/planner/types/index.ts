/** Mirrors backend handlers.PlannerTask (GET /dashboard/planner). */
export type PlannerTask = {
  _id: string;
  title: string;
  projectId: string;
  projectName: string;
  /** The task's current column name, e.g. "Todo", "In Progress". */
  status: string;
  priority: string;
  /** ISO date string (YYYY-MM-DD). */
  dueDate: string;
  estimatedDuration: string;
};

export type PlannerStats = {
  dueToday: number;
  overdue: number;
  dueNext3Days: number;
  completedToday: number;
};

/** Mirrors backend handlers.PlannerResponse. */
export type PlannerResponse = {
  stats: PlannerStats;
  overdue: PlannerTask[];
  today: PlannerTask[];
  upcoming: PlannerTask[];
};
