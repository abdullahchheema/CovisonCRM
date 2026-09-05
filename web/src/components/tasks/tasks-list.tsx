"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SavedViewsMenu, type SavedView } from "@/components/shared/saved-views-menu";
import { TaskRow } from "@/components/tasks/task-row";
import { createClient } from "@/lib/supabase/client";

function toCsvValue(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

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
  memberNameById: Record<string, string>;
  currentUserId: string;
  organizationId: string;
  savedViews: SavedView[];
}

export function TasksList({
  tasks,
  contacts,
  contactNameById,
  memberNameById,
  currentUserId,
  organizationId,
  savedViews,
}: TasksListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const bulkDelete = async () => {
    setIsBulkDeleting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", Array.from(selected));

    setIsBulkDeleting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`${selected.size} task${selected.size === 1 ? "" : "s"} deleted`);
    setSelected(new Set());
    setConfirmBulkDelete(false);
    router.refresh();
  };

  const exportCsv = () => {
    const header = ["Title", "Status", "Priority", "Due date", "Contact", "Assigned to"];
    const rows = filtered.map((task) => [
      task.title,
      task.status,
      task.priority ?? "",
      task.due_at ? new Date(task.due_at).toLocaleDateString() : "",
      task.contact_id ? (contactNameById[task.contact_id] ?? "") : "",
      task.assigned_to ? (memberNameById[task.assigned_to] ?? "") : "",
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(toCsvValue).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tasks-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
        <Button type="button" variant="outline" onClick={exportCsv} className="ml-auto">
          Export CSV
        </Button>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-2">
          <span className="text-sm text-foreground">{selected.size} selected</span>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setConfirmBulkDelete(true)}
          >
            Delete selected
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      <Dialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selected.size} tasks?</DialogTitle>
            <DialogDescription>
              This removes them from your list. This can&apos;t be undone from
              the app yet.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmBulkDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={bulkDelete} disabled={isBulkDeleting}>
              {isBulkDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  selected={selected.has(task.id)}
                  onToggleSelect={() => toggleOne(task.id)}
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
                    selected={selected.has(task.id)}
                    onToggleSelect={() => toggleOne(task.id)}
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
