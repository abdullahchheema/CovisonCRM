export type TodoAuthor = { name: string; image: string };

export type Todo = {
  _id: string;
  columnId: string;
  projectId: string;
  title: string;
  description: string;
  author: TodoAuthor;
  /** Free-form tag shown as a colored pill — works for any niche. */
  label?: string;
  /** One of LABEL_COLORS values (maps to a CustomBadge variant). */
  labelColor?: string;
  priority?: string;
  /** ISO date string (YYYY-MM-DD). */
  dueDate?: string;
  /** Free-form duration estimate, e.g. "2h", "30m". */
  estimatedDuration?: string;
  date: string;
};

/** Fields a user can edit on a card. */
export type TodoFields = {
  title: string;
  description: string;
  author: TodoAuthor;
  label: string;
  labelColor: string;
  priority: string;
  dueDate: string;
  estimatedDuration: string;
};

export type Column = {
  _id: string;
  name: string;
  order: number;
  todos: Todo[];
};

export type Project = {
  _id: string;
  name: string;
  date: string;
  description?: string;
  priority?: string;
  startDate?: string;
  expectedEndDate?: string;
  totalTasks: number;
  doneTasks: number;
};
