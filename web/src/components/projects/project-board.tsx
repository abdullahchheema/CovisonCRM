"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

import { SoftDeleteButton } from "@/components/shared/soft-delete-button";
import { TodoFormDialog } from "@/components/projects/todo-form-dialog";
import { TodoEditDialog } from "@/components/projects/todo-edit-dialog";
import { createClient } from "@/lib/supabase/client";

interface ColumnRow {
  id: string;
  name: string;
  position: number;
}

interface TodoRow {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  column_id: string;
  position: number;
}

interface ProjectBoardProps {
  projectId: string;
  organizationId: string;
  initialColumns: ColumnRow[];
  initialTodos: TodoRow[];
  members: { id: string; name: string }[];
}

function TodoCard({
  todo,
  memberName,
  members,
}: {
  todo: TodoRow;
  memberName: string | null;
  members: { id: string; name: string }[];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: todo.id,
    data: { type: "todo", columnId: todo.column_id },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group rounded-lg bg-surface p-3 shadow-xs ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div {...listeners} {...attributes} className="min-w-0 flex-1 cursor-grab">
          <p className="text-sm font-medium text-foreground">{todo.title}</p>
          {todo.description && (
            <p className="mt-1 line-clamp-2 text-xs text-text-2">
              {todo.description}
            </p>
          )}
          {memberName && (
            <p className="mt-2 text-xs text-text-3">{memberName}</p>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100">
        <TodoEditDialog todo={todo} members={members} />
        <SoftDeleteButton table="project_todos" id={todo.id} label="Card" />
      </div>
    </div>
  );
}

function Column({
  column,
  todos,
  memberNameById,
  members,
  projectId,
  organizationId,
}: {
  column: ColumnRow;
  todos: TodoRow[];
  memberNameById: Record<string, string>;
  members: { id: string; name: string }[];
  projectId: string;
  organizationId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: "column" },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex w-72 shrink-0 flex-col rounded-xl bg-surface-2 p-2 ${isDragging ? "opacity-50" : ""}`}
    >
      <div
        {...listeners}
        {...attributes}
        className="mb-2 flex cursor-grab items-center justify-between px-1"
      >
        <h2 className="text-sm font-medium text-foreground">{column.name}</h2>
        <span className="rounded-full bg-surface-3 px-1.5 py-0.5 text-xs text-text-2">
          {todos.length}
        </span>
      </div>
      <SortableContext
        items={todos.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex min-h-16 flex-col gap-2">
          {todos.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo}
              memberName={todo.assigned_to ? (memberNameById[todo.assigned_to] ?? null) : null}
              members={members}
            />
          ))}
        </div>
      </SortableContext>
      <div className="mt-2">
        <TodoFormDialog
          organizationId={organizationId}
          projectId={projectId}
          columnId={column.id}
          members={members}
        />
      </div>
    </div>
  );
}

export function ProjectBoard({
  projectId,
  organizationId,
  initialColumns,
  initialTodos,
  members,
}: ProjectBoardProps) {
  const [columns, setColumns] = useState(initialColumns);
  const [todos, setTodos] = useState(initialTodos);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Resync when the server sends fresh data (e.g. after a column is added
  // via router.refresh()) — adjust state during render rather than an
  // effect, same pattern as pipeline-board.tsx.
  const [prevColumns, setPrevColumns] = useState(initialColumns);
  if (initialColumns !== prevColumns) {
    setPrevColumns(initialColumns);
    setColumns(initialColumns);
  }
  const [prevTodos, setPrevTodos] = useState(initialTodos);
  if (initialTodos !== prevTodos) {
    setPrevTodos(initialTodos);
    setTodos(initialTodos);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const memberNameById = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m.name])),
    [members],
  );

  const todosByColumn = useMemo(() => {
    const map = new Map<string, TodoRow[]>();
    for (const column of columns) {
      map.set(
        column.id,
        todos.filter((t) => t.column_id === column.id).sort((a, b) => a.position - b.position),
      );
    }
    return map;
  }, [columns, todos]);

  const persistColumnOrder = async (ordered: ColumnRow[]) => {
    const supabase = createClient();
    await Promise.all(
      ordered.map((column, index) =>
        supabase.from("project_columns").update({ position: index }).eq("id", column.id),
      ),
    );
  };

  const persistTodoOrder = async (columnId: string, ordered: TodoRow[]) => {
    const supabase = createClient();
    await Promise.all(
      ordered.map((todo, index) =>
        supabase
          .from("project_todos")
          .update({ position: index, column_id: columnId })
          .eq("id", todo.id),
      ),
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const activeType = active.data.current?.type as "column" | "todo" | undefined;

    if (activeType === "column") {
      const oldIndex = columns.findIndex((c) => c.id === active.id);
      const newIndex = columns.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(columns, oldIndex, newIndex);
      setColumns(reordered);
      await persistColumnOrder(reordered);
      return;
    }

    // Dragging a card. `over` is either another card (same or different
    // column) or a column's own sortable id if dropped on empty space.
    const activeTodo = todos.find((t) => t.id === active.id);
    if (!activeTodo) return;

    const overIsColumn = columns.some((c) => c.id === over.id);
    const targetColumnId = overIsColumn
      ? (over.id as string)
      : (todos.find((t) => t.id === over.id)?.column_id ?? activeTodo.column_id);

    const sourceColumnId = activeTodo.column_id;

    if (sourceColumnId === targetColumnId) {
      const columnTodos = todosByColumn.get(sourceColumnId) ?? [];
      const oldIndex = columnTodos.findIndex((t) => t.id === active.id);
      const newIndex = overIsColumn
        ? columnTodos.length - 1
        : columnTodos.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(columnTodos, oldIndex, newIndex);
      setTodos((prev) => [
        ...prev.filter((t) => t.column_id !== sourceColumnId),
        ...reordered,
      ]);
      await persistTodoOrder(sourceColumnId, reordered);
      return;
    }

    // Moving to a different column.
    const sourceTodos = (todosByColumn.get(sourceColumnId) ?? []).filter(
      (t) => t.id !== active.id,
    );
    const destTodos = todosByColumn.get(targetColumnId) ?? [];
    const insertIndex = overIsColumn
      ? destTodos.length
      : Math.max(destTodos.findIndex((t) => t.id === over.id), 0);
    const movedTodo = { ...activeTodo, column_id: targetColumnId };
    const newDestTodos = [
      ...destTodos.slice(0, insertIndex),
      movedTodo,
      ...destTodos.slice(insertIndex),
    ];

    setTodos((prev) => [
      ...prev.filter((t) => t.column_id !== sourceColumnId && t.column_id !== targetColumnId),
      ...sourceTodos,
      ...newDestTodos,
    ]);

    const supabase = createClient();
    const { error } = await supabase
      .from("project_todos")
      .update({ column_id: targetColumnId })
      .eq("id", activeTodo.id);
    if (error) toast.error(error.message);

    await Promise.all([
      persistTodoOrder(sourceColumnId, sourceTodos),
      persistTodoOrder(targetColumnId, newDestTodos),
    ]);
  };

  const activeTodo = activeId ? todos.find((t) => t.id === activeId) : null;
  const activeColumn = activeId ? columns.find((c) => c.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={columns.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              todos={todosByColumn.get(column.id) ?? []}
              memberNameById={memberNameById}
              members={members}
              projectId={projectId}
              organizationId={organizationId}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay>
        {activeTodo ? (
          <div className="w-72 rounded-lg bg-surface p-3 shadow-lg">
            <p className="text-sm font-medium text-foreground">{activeTodo.title}</p>
          </div>
        ) : activeColumn ? (
          <div className="w-72 rounded-xl bg-surface-3 p-2 shadow-lg">
            <p className="text-sm font-medium text-foreground">{activeColumn.name}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
