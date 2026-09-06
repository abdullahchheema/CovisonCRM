"use client";

import { ChevronDown, ChevronUp, Columns3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface ColumnDef {
  key: string;
  label: string;
}

interface ColumnsMenuProps {
  allColumns: ColumnDef[];
  visibleColumns: string[];
  onChange: (columns: string[]) => void;
}

// Per-user column visibility + order for a table — deliberately not baked
// into the Table primitive itself, since only the contacts list needs this
// so far. Persisted the same way filters already are: it's just another
// key in the SavedViewsMenu's `filters` JSON (see contacts-table.tsx),
// reusing that infra rather than adding a new saved-preference table.
export function ColumnsMenu({ allColumns, visibleColumns, onChange }: ColumnsMenuProps) {
  const labelByKey = Object.fromEntries(allColumns.map((c) => [c.key, c.label]));
  const hiddenColumns = allColumns.filter((c) => !visibleColumns.includes(c.key));

  const toggle = (key: string) => {
    if (visibleColumns.includes(key)) {
      onChange(visibleColumns.filter((k) => k !== key));
    } else {
      onChange([...visibleColumns, key]);
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= visibleColumns.length) return;
    const next = [...visibleColumns];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline">
          <Columns3 /> Columns
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-foreground">Visible columns</p>
          <p className="text-xs text-text-3">Reorder with the arrows — save as a view to keep it.</p>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {visibleColumns.map((key, index) => (
            <div key={key} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-2">
              <Checkbox checked onCheckedChange={() => toggle(key)} />
              <span className="flex-1 truncate text-sm text-foreground">
                {labelByKey[key] ?? key}
              </span>
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move ${labelByKey[key] ?? key} up`}
                className="text-text-3 hover:text-foreground disabled:opacity-30"
              >
                <ChevronUp className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === visibleColumns.length - 1}
                aria-label={`Move ${labelByKey[key] ?? key} down`}
                className="text-text-3 hover:text-foreground disabled:opacity-30"
              >
                <ChevronDown className="size-3.5" />
              </button>
            </div>
          ))}
          {hiddenColumns.length > 0 && (
            <>
              <div className="my-2 border-t border-line-soft" />
              {hiddenColumns.map((col) => (
                <div
                  key={col.key}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-2"
                >
                  <Checkbox checked={false} onCheckedChange={() => toggle(col.key)} />
                  <span className="flex-1 truncate text-sm text-text-2">{col.label}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
