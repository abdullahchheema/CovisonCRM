import { Tags as TagsIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagSelector } from "@/components/common";

interface TagFilterBarProps {
  tagIds: string[];
  onTagIdsChange: (ids: string[]) => void;
  tagMatch: "any" | "all";
  onTagMatchChange: (match: "any" | "all") => void;
  excludeTagIds: string[];
  onExcludeTagIdsChange: (ids: string[]) => void;
}

/**
 * Advanced tag filtering for the Contacts table (req #5): include by any/all
 * of N tags, plus exclude a separate set — e.g. "Dentist AND AI Automation,
 * but not Real Estate". Lives as a popover so it doesn't crowd the table's
 * built-in per-column filters.
 */
const TagFilterBar = ({
  tagIds,
  onTagIdsChange,
  tagMatch,
  onTagMatchChange,
  excludeTagIds,
  onExcludeTagIdsChange,
}: TagFilterBarProps) => {
  const activeCount = tagIds.length + excludeTagIds.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={activeCount > 0 ? "secondary" : "outline"}>
          <TagsIcon className="size-4" />
          Filter by Tags
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-primary/15 text-primary text-xs px-1.5">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-4" align="start">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Has tags</Label>
            <Select value={tagMatch} onValueChange={(v) => onTagMatchChange(v as "any" | "all")}>
              <SelectTrigger className="h-7 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any" className="text-xs">Any of</SelectItem>
                <SelectItem value="all" className="text-xs">All of</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <TagSelector
            selectedIds={tagIds}
            onChange={onTagIdsChange}
            allowCreate={false}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Excludes tags</Label>
          <TagSelector
            selectedIds={excludeTagIds}
            onChange={onExcludeTagIdsChange}
            allowCreate={false}
          />
        </div>

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => {
              onTagIdsChange([]);
              onExcludeTagIdsChange([]);
            }}
          >
            <X className="size-3.5" /> Clear tag filters
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default TagFilterBar;
