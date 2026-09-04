"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

import { DealCard } from "@/components/deals/deal-card";
import { createClient } from "@/lib/supabase/client";

interface Deal {
  id: string;
  name: string;
  value: number;
  currency: string;
  stage_id: string;
  contact_id: string | null;
  company_id: string | null;
  owner_id: string | null;
}

interface PipelineBoardProps {
  stages: { id: string; name: string; position: number }[];
  initialDeals: Deal[];
  contacts: { id: string; name: string }[];
  companies: { id: string; name: string }[];
  members: { id: string; name: string }[];
}

function DraggableCard({
  deal,
  stages,
  contacts,
  companies,
  members,
  contactName,
}: {
  deal: Deal;
  stages: { id: string; name: string }[];
  contacts: { id: string; name: string }[];
  companies: { id: string; name: string }[];
  members: { id: string; name: string }[];
  contactName: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={isDragging ? "opacity-50" : undefined}
      {...listeners}
      {...attributes}
    >
      <DealCard deal={deal} stages={stages} contacts={contacts} companies={companies} members={members} contactName={contactName} />
    </div>
  );
}

function DroppableColumn({
  stageId,
  children,
}: {
  stageId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stageId });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 rounded-xl border border-border p-2 min-h-24 transition-colors ${
        isOver ? "bg-primary/10" : "bg-muted/40"
      }`}
    >
      {children}
    </div>
  );
}

export function PipelineBoard({
  stages,
  initialDeals,
  contacts,
  companies,
  members,
}: PipelineBoardProps) {
  const [deals, setDeals] = useState(initialDeals);

  // DealCard's manual stage <select> (kept for keyboard/accessibility —
  // dnd-kit's pointer drag isn't keyboard-operable) triggers router.refresh()
  // rather than updating this component's local state directly, so this
  // needs to resync when the server sends fresh `initialDeals`. Adjusting
  // state during render (React's documented alternative to an effect for
  // this exact case) rather than useEffect+setState, which the
  // react-hooks/set-state-in-effect rule flags as an extra, avoidable
  // render pass.
  const [prevInitialDeals, setPrevInitialDeals] = useState(initialDeals);
  if (initialDeals !== prevInitialDeals) {
    setPrevInitialDeals(initialDeals);
    setDeals(initialDeals);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Requires a deliberate drag movement before activating, so clicking
      // the stage <select>, edit, or delete buttons inside a card still
      // works as a plain click instead of being swallowed as a drag start.
      activationConstraint: { distance: 8 },
    }),
  );

  const contactNameById = useMemo(
    () => new Map(contacts.map((c) => [c.id, c.name])),
    [contacts],
  );

  const dealsByStage = useMemo(() => {
    const map = new Map<string, Deal[]>();
    for (const stage of stages) {
      map.set(stage.id, deals.filter((deal) => deal.stage_id === stage.id));
    }
    return map;
  }, [deals, stages]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as string;
    const newStageId = over.id as string;
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage_id === newStageId) return;

    const previousStageId = deal.stage_id;
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage_id: newStageId } : d)),
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("deals")
      .update({ stage_id: newStageId })
      .eq("id", dealId);

    if (error) {
      toast.error(error.message);
      setDeals((prev) =>
        prev.map((d) => (d.id === dealId ? { ...d, stage_id: previousStageId } : d)),
      );
    }
  };

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.id} className="w-64 shrink-0">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-medium text-foreground">{stage.name}</h2>
              <span className="text-xs text-muted-foreground">
                {(dealsByStage.get(stage.id) ?? []).length}
              </span>
            </div>
            <DroppableColumn stageId={stage.id}>
              {(dealsByStage.get(stage.id) ?? []).map((deal) => (
                <DraggableCard
                  key={deal.id}
                  deal={deal}
                  stages={stages}
                  contacts={contacts}
                  companies={companies}
                  members={members}
                  contactName={deal.contact_id ? (contactNameById.get(deal.contact_id) ?? null) : null}
                />
              ))}
            </DroppableColumn>
          </div>
        ))}
      </div>
    </DndContext>
  );
}
