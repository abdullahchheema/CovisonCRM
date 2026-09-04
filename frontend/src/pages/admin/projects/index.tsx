import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { KanbanSkeleton, DatePicker } from "@/components/custom";
import { Plus, CalendarDays, Ban, AlertTriangle, CheckCircle2 } from "lucide-react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { apiProvider, invalidateCache } from "@/services/utilities/provider";
import usePermissions from "@/hooks/usePermissions";
import { type Column, type Todo, type TodoFields, type Project } from "./types";
import reorder from "@/utils/reorder";
import ColumnHeader from "./components/ColumnHeader";
import TaskCard from "./components/TaskCard";
import AddTaskForm from "./components/AddTaskForm";
import AddColumnForm from "./components/AddColumnForm";
import ProgressRing from "./components/ProgressRing";

const Projects = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { has } = usePermissions();
  const canEdit = has("todos-edit");
  const [columns, setColumns] = useState<Column[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [addingColId, setAddingColId] = useState<string | null>(null);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    const controller = new AbortController();
    Promise.all([
      apiProvider.getAll(`projects/${projectId}/board`, controller.signal, true),
      apiProvider.getAll("projects", controller.signal, true),
    ]).then(([boardRes, projectsRes]) => {
      if (Array.isArray(boardRes)) setColumns(boardRes);
      if (Array.isArray(projectsRes)) {
        const p = projectsRes.find((x: Project) => x._id === projectId);
        if (p) {
          setProject(p);
          setNameDraft(p.name);
        }
      }
      setIsLoading(false);
    });
    return () => controller.abort();
  }, [projectId]);

  // ── Header metrics (derived from live board state, so they update on drag) ──

  const stats = useMemo(() => {
    const isDone = (n: string) => /^(done|complete|completed)$/i.test(n.trim());
    const isBlocked = (n: string) => /blocked/i.test(n.trim());
    let total = 0;
    let done = 0;
    let blocked = 0;
    for (const c of columns) {
      total += c.todos.length;
      if (isDone(c.name)) done += c.todos.length;
      if (isBlocked(c.name)) blocked += c.todos.length;
    }
    const progress = total ? Math.round((done / total) * 100) : 0;
    return { total, done, blocked, progress };
  }, [columns]);

  const endDate = project?.expectedEndDate ?? "";
  const daysRemaining = useMemo(() => {
    if (!endDate) return null;
    const end = new Date(endDate + "T00:00:00");
    if (isNaN(end.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((end.getTime() - today.getTime()) / 86_400_000);
  }, [endDate]);

  const isComplete = stats.total > 0 && stats.done === stats.total;
  const overdue = daysRemaining !== null && daysRemaining < 0 && !isComplete;

  // UpdateProject overwrites every field, so always send the full record.
  const saveProject = (patch: Partial<Project>) => {
    if (!project || !projectId) return;
    const merged = { ...project, ...patch };
    setProject(merged);
    apiProvider.put(
      "projects",
      {
        name: merged.name,
        description: merged.description ?? "",
        priority: merged.priority ?? "",
        startDate: merged.startDate ?? "",
        expectedEndDate: merged.expectedEndDate ?? "",
      },
      projectId,
      true,
    );
  };

  const commitName = () => {
    setEditingName(false);
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== project?.name) saveProject({ name: trimmed });
    else setNameDraft(project?.name ?? "");
  };

  // ── Drag and drop ─────────────────────────────────────────────────────────

  const onDragEnd = (result: any) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const previousColumns = columns;

    if (type === "COLUMN") {
      const newColumns = reorder(columns, source.index, destination.index);
      setColumns(newColumns);
      apiProvider
        .put(
          "projects",
          { columnIds: newColumns.map((c) => c._id) },
          `${projectId}/columns/reorder`,
          true,
        )
        .then((res) => {
          if (res?.message !== "Columns reordered") {
            setColumns(previousColumns);
            toast.error(res?.message ?? "Failed to reorder columns");
          }
        });
      return;
    }

    const srcColIdx = columns.findIndex((c) => c._id === source.droppableId);
    const dstColIdx = columns.findIndex(
      (c) => c._id === destination.droppableId,
    );
    const srcCol = columns[srcColIdx];
    const dstCol = columns[dstColIdx];

    let updatedColumns: Column[];
    let movedTodo: Todo;

    if (source.droppableId === destination.droppableId) {
      const newTodos = reorder(srcCol.todos, source.index, destination.index);
      updatedColumns = columns.map((c) =>
        c._id === srcCol._id ? { ...c, todos: newTodos } : c,
      );
      setColumns(updatedColumns);
    } else {
      const srcTodos = [...srcCol.todos];
      const dstTodos = [...dstCol.todos];
      [movedTodo] = srcTodos.splice(source.index, 1);
      movedTodo = { ...movedTodo, columnId: dstCol._id };
      dstTodos.splice(destination.index, 0, movedTodo);
      updatedColumns = columns.map((c) => {
        if (c._id === srcCol._id) return { ...c, todos: srcTodos };
        if (c._id === dstCol._id) return { ...c, todos: dstTodos };
        return c;
      });
      setColumns(updatedColumns);

      apiProvider
        .put("todos", { columnId: dstCol._id }, movedTodo._id, true)
        .then((res) => {
          if (res?.message !== "Todo updated") {
            setColumns(previousColumns);
            toast.error(res?.message ?? "Failed to move task — reverted");
          } else {
            // The board GET is cached under the "projects" resource, not
            // "todos" — invalidate it so revisiting/reloading this board
            // reflects the move instead of showing the stale cached version.
            invalidateCache("projects");
          }
        });
    }
  };

  // ── Column CRUD ───────────────────────────────────────────────────────────

  const handleAddColumn = (name: string) => {
    apiProvider
      .post("projects", { name }, `${projectId}/columns`, true)
      .then((res) => {
        if (res?._id) {
          setColumns((prev) => [...prev, { ...res, todos: [] }]);
          setShowAddColumn(false);
        } else {
          toast.error(res?.message ?? "Failed to add column");
        }
      });
  };

  const handleRenameColumn = (colId: string, name: string) => {
    apiProvider
      .put("projects", { name }, `${projectId}/columns/${colId}`, true)
      .then((res) => {
        if (res?._id) {
          setColumns((prev) =>
            prev.map((c) => (c._id === colId ? { ...c, name } : c)),
          );
        } else {
          toast.error(res?.message ?? "Failed to rename column");
        }
      });
  };

  const handleDeleteColumn = (colId: string) => {
    apiProvider
      .remove("projects", colId, `${projectId}/columns`, true)
      .then((res) => {
        if (res?.message === "Column deleted") {
          setColumns((prev) => prev.filter((c) => c._id !== colId));
        } else {
          toast.error(res?.message ?? "Failed to delete column");
        }
      });
  };

  // ── Todo CRUD ─────────────────────────────────────────────────────────────

  const handleAddTodo = (
    colId: string,
    todo: Omit<Todo, "_id" | "date" | "projectId" | "columnId">,
  ) => {
    apiProvider
      .post(
        "projects",
        { ...todo, columnId: colId },
        `${projectId}/todos`,
        true,
      )
      .then((res) => {
        if (res?._id) {
          setColumns((prev) =>
            prev.map((c) =>
              c._id === colId ? { ...c, todos: [...c.todos, res] } : c,
            ),
          );
          setAddingColId(null);
        } else {
          toast.error(res?.message ?? "Failed to add task");
        }
      });
  };

  const handleDeleteTodo = (colId: string, todoId: string) => {
    apiProvider.remove("todos", todoId, "", true).then((res) => {
      if (res?.message === "Todo deleted") {
        setColumns((prev) =>
          prev.map((c) =>
            c._id === colId
              ? { ...c, todos: c.todos.filter((t) => t._id !== todoId) }
              : c,
          ),
        );
        invalidateCache("projects");
      } else {
        toast.error(res?.message ?? "Failed to delete task");
      }
    });
  };

  const handleEditTodo = (
    colId: string,
    todoId: string,
    updates: TodoFields,
  ) => {
    apiProvider.put("todos", updates, todoId, true).then((res) => {
      if (res?.message !== "Todo updated") {
        toast.error(res?.message ?? "Failed to update task");
        return;
      }
      setColumns((prev) =>
        prev.map((c) =>
          c._id === colId
            ? {
                ...c,
                todos: c.todos.map((t) =>
                  t._id === todoId ? { ...t, ...updates } : t,
                ),
              }
            : c,
        ),
      );
      invalidateCache("projects");
    });
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (isLoading) {
    return <KanbanSkeleton columns={3} columnWidth="w-68" />;
  }

  // ── Board ─────────────────────────────────────────────────────────────────

  return (
    <section className="flex flex-col lg:flex-row gap-4 lg:h-[calc(100vh-7rem)]">
      {/* ── Left: project overview ─────────────────────────────────────────── */}
      {project && (
        <aside className="lg:w-72 lg:flex-shrink-0 lg:overflow-y-auto">
          <div className="rounded-2xl border border-primary/15 bg-gradient-to-b from-primary/[0.06] to-primary/[0.01] p-5 space-y-5">
            {/* Title */}
            {editingName && canEdit ? (
              <Input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitName();
                  if (e.key === "Escape") {
                    setNameDraft(project.name);
                    setEditingName(false);
                  }
                }}
                className="text-lg font-semibold h-auto py-1"
              />
            ) : (
              <h1
                onClick={() => canEdit && setEditingName(true)}
                title={canEdit ? "Click to rename" : undefined}
                className={cn(
                  "text-lg font-semibold leading-tight",
                  canEdit &&
                    "cursor-pointer hover:text-primary transition-colors",
                )}
              >
                {project.name}
              </h1>
            )}

            {/* Progress ring */}
            <div className="flex justify-center py-1">
              <ProgressRing progress={stats.progress} />
            </div>

            {/* Done / remaining legend */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-background/60 border border-border/60 px-3 py-2 text-center">
                <p className="text-lg font-bold tabular-nums text-primary leading-none">
                  {stats.done}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">Done</p>
              </div>
              <div className="rounded-xl bg-background/60 border border-border/60 px-3 py-2 text-center">
                <p className="text-lg font-bold tabular-nums leading-none">
                  {stats.total - stats.done}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Remaining
                </p>
              </div>
            </div>

            {/* Status badges */}
            {(overdue || stats.blocked > 0 || isComplete) && (
              <div className="flex flex-wrap gap-2">
                {isComplete && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 text-xs font-medium">
                    <CheckCircle2 className="size-3.5" />
                    All done
                  </span>
                )}
                {overdue && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive px-2.5 py-1 text-xs font-medium">
                    <AlertTriangle className="size-3.5" />
                    Overdue {Math.abs(daysRemaining as number)}d
                  </span>
                )}
                {stats.blocked > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2.5 py-1 text-xs font-medium">
                    <Ban className="size-3.5" />
                    {stats.blocked} blocked
                  </span>
                )}
              </div>
            )}

            <div className="h-px bg-border/60" />

            {/* Target end date + days remaining */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <CalendarDays className="size-3.5 text-primary" />
                Target end date
              </div>
              {canEdit ? (
                <DatePicker
                  value={endDate}
                  onChange={(v) => saveProject({ expectedEndDate: v })}
                />
              ) : (
                <span className="block font-medium text-foreground text-sm">
                  {endDate || "—"}
                </span>
              )}
              {daysRemaining !== null && (
                <span
                  className={cn(
                    "block text-xs font-medium",
                    overdue ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {daysRemaining >= 0
                    ? `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left`
                    : `${Math.abs(daysRemaining)} day${
                        Math.abs(daysRemaining) !== 1 ? "s" : ""
                      } overdue`}
                </span>
              )}
            </div>
          </div>
        </aside>
      )}

      {/* ── Right: Kanban board ────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex gap-2 overflow-x-auto pb-4 items-start lg:h-full">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="board" direction="horizontal" type="COLUMN">
            {(boardProvided) => (
              <div
                ref={boardProvided.innerRef}
                {...boardProvided.droppableProps}
                className="flex gap-3 items-start"
              >
                {columns.map((col, idx) => (
                  <Draggable draggableId={col._id} index={idx} key={col._id}>
                    {(colProvided, colSnapshot) => (
                      <div
                        ref={colProvided.innerRef}
                        {...colProvided.draggableProps}
                        className="flex-shrink-0 w-68"
                        style={{ ...colProvided.draggableProps.style }}
                      >
                        <div
                          className={cn(
                            "rounded-xl bg-primary/[0.03] border border-primary/15 flex flex-col max-h-[calc(100vh-10rem)] transition-shadow",
                            colSnapshot.isDragging &&
                              "shadow-xl ring-2 ring-primary/30",
                          )}
                        >
                          <ColumnHeader
                            column={col}
                            dragHandleProps={colProvided.dragHandleProps}
                            onRename={(name) =>
                              handleRenameColumn(col._id, name)
                            }
                            onDelete={() => handleDeleteColumn(col._id)}
                            onAddTodo={() =>
                              setAddingColId((prev) =>
                                prev === col._id ? null : col._id,
                              )
                            }
                          />

                          <Droppable droppableId={col._id}>
                            {(provided, snapshot) => (
                              <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className={cn(
                                  "flex-1 overflow-y-auto p-2 space-y-2 min-h-[4rem] transition-colors",
                                  snapshot.isDraggingOver &&
                                    "bg-primary/10 rounded-lg",
                                )}
                              >
                                {addingColId === col._id && (
                                  <AddTaskForm
                                    onSubmit={(todo) =>
                                      handleAddTodo(col._id, todo)
                                    }
                                    onCancel={() => setAddingColId(null)}
                                  />
                                )}
                                {col.todos.map((todo, todoIdx) => (
                                  <Draggable
                                    draggableId={todo._id}
                                    index={todoIdx}
                                    key={todo._id}
                                  >
                                    {(provided, snapshot) => (
                                      <TaskCard
                                        todo={todo}
                                        provided={provided}
                                        isDragging={snapshot.isDragging}
                                        onDelete={() =>
                                          handleDeleteTodo(col._id, todo._id)
                                        }
                                        onEdit={(updates) =>
                                          handleEditTodo(
                                            col._id,
                                            todo._id,
                                            updates,
                                          )
                                        }
                                      />
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                                {col.todos.length === 0 &&
                                  addingColId !== col._id && (
                                    <p className="text-xs text-muted-foreground text-center py-4">
                                      No tasks yet
                                    </p>
                                  )}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {boardProvided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

      {/* Add column */}
      <div className="flex-shrink-0 w-68">
        {showAddColumn ? (
          <div className="rounded-xl bg-primary/[0.03] border border-primary/15 p-3">
            <AddColumnForm
              onSubmit={handleAddColumn}
              onCancel={() => setShowAddColumn(false)}
            />
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={() => setShowAddColumn(true)}
            className="w-full justify-start gap-2 rounded-xl border border-dashed border-primary/30 px-3 py-2.5 text-sm text-primary/60 hover:text-primary hover:border-primary/60 hover:bg-primary/5 h-auto"
          >
            <Plus className="size-4" />
            Add column
          </Button>
        )}
      </div>
      </div>
    </section>
  );
};

export default Projects;
