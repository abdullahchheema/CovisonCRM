"use client";

import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SavedViewsMenu, type SavedView } from "@/components/shared/saved-views-menu";
import { TaskRow } from "@/components/tasks/task-row";

interface TaskRowData {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  due_at: string | null;
  contact_id: string | null;
  assigned_to: string | null;
}

interface TasksListProps {
  tasks: TaskRowData[];
  contacts: { id: string; name: string }[];
  contactNameById: Record<string, string>;
  currentUserId: string;
  organizationId: string;
  savedViews: SavedView[];
}

export function TasksList({
  tasks,
  contacts,
  contactNameById,
  currentUserId,
  organizationId,
  savedViews,
}: TasksListProps) {
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (onlyMine && task.assigned_to !== currentUserId) return false;
      if (priority && task.priority !== priority) return false;
      if (!term) return true;
      return task.title.toLowerCase().includes(term);
    });
  }, [tasks, search, priority, onlyMine, currentUserId]);

  const currentFilters = { search, priority, onlyMine };

  const applyFilters = (loaded: Record<string, unknown>) => {
    if (typeof loaded.search === "string") setSearch(loaded.search);
    if (typeof loaded.priority === "string") setPriority(loaded.priority);
    if (typeof loaded.onlyMine === "boolean") setOnlyMine(loaded.onlyMine);
  };

  const open = filtered.filter((t) => t.status !== "completed");
  const completed = filtered.filter((t) => t.status === "completed");

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={priority} onChange={(e) => setPriority(e.target.value)} className="max-w-40">
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </Select>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={onlyMine}
            onChange={(e) => setOnlyMine(e.target.checked)}
            className="size-4"
          />
          Only mine
        </label>
        <SavedViewsMenu
          organizationId={organizationId}
          currentUserId={currentUserId}
          entityType="tasks"
          initialViews={savedViews}
          currentFilters={currentFilters}
          onApply={applyFilters}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {tasks.length === 0 ? "No tasks yet. Create one to get started." : "No tasks match your filters."}
          </p>
        </div>
      ) : (
        <>
          {open.length > 0 && (
            <ul className="flex flex-col gap-2">
              {open.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  contacts={contacts}
                  contactName={task.contact_id ? (contactNameById[task.contact_id] ?? null) : null}
                />
              ))}
            </ul>
          )}

          {completed.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">Completed</h2>
              <ul className="flex flex-col gap-2">
                {completed.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    contacts={contacts}
                    contactName={task.contact_id ? (contactNameById[task.contact_id] ?? null) : null}
                  />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
