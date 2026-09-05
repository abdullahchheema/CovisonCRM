"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bookmark, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";

export interface SavedView {
  id: string;
  name: string;
  filters: Record<string, unknown>;
  is_shared: boolean;
  user_id: string;
}

interface SavedViewsMenuProps {
  organizationId: string;
  currentUserId: string;
  entityType: string;
  initialViews: SavedView[];
  currentFilters: Record<string, unknown>;
  onApply: (filters: Record<string, unknown>) => void;
}

export function SavedViewsMenu({
  organizationId,
  currentUserId,
  entityType,
  initialViews,
  currentFilters,
  onApply,
}: SavedViewsMenuProps) {
  const [views, setViews] = useState(initialViews);
  const [open, setOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState("");
  const [shareWithTeam, setShareWithTeam] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setIsSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("saved_views")
      .insert({
        organization_id: organizationId,
        user_id: currentUserId,
        entity_type: entityType,
        name: trimmed,
        filters: currentFilters,
        is_shared: shareWithTeam,
      })
      .select()
      .single();

    setIsSaving(false);

    if (error || !data) {
      toast.error(error?.message ?? "Could not save view");
      return;
    }

    setViews((prev) => [...prev, data as SavedView]);
    toast.success(`View "${trimmed}" saved`);
    setName("");
    setShareWithTeam(false);
    setSaveOpen(false);
  };

  const handleDelete = async (view: SavedView) => {
    const supabase = createClient();
    const { error } = await supabase.from("saved_views").delete().eq("id", view.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setViews((prev) => prev.filter((v) => v.id !== view.id));
  };

  const handleApply = (view: SavedView) => {
    onApply(view.filters);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline">
          <Bookmark /> Views
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-foreground">Saved views</p>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {views.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No saved views yet.
            </p>
          ) : (
            <ul>
              {views.map((view) => (
                <li
                  key={view.id}
                  className="flex items-center justify-between gap-2 border-b border-border px-4 py-2 last:border-0 hover:bg-muted"
                >
                  <button
                    type="button"
                    onClick={() => handleApply(view)}
                    className="min-w-0 flex-1 truncate text-left text-sm text-foreground"
                  >
                    {view.name}
                    {view.is_shared && (
                      <span className="ml-2 text-xs text-muted-foreground">Shared</span>
                    )}
                  </button>
                  {view.user_id === currentUserId && (
                    <button
                      type="button"
                      onClick={() => handleDelete(view)}
                      className="text-muted-foreground hover:text-danger"
                      aria-label={`Delete view ${view.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-border p-3">
          {saveOpen ? (
            <div className="flex flex-col gap-2">
              <Input
                placeholder="View name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={shareWithTeam}
                  onChange={(e) => setShareWithTeam(e.target.checked)}
                  className="size-3.5"
                />
                Share with team
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSaveOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  onClick={handleSave}
                  disabled={isSaving || !name.trim()}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => setSaveOpen(true)}
            >
              Save current filters as...
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
