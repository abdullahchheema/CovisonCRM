import { useEffect, useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import CustomBadge, { badgeVariants } from "../custom/CustomBadge";
import { type VariantProps } from "class-variance-authority";
import { Input } from "../ui/input";
import { apiTags } from "@/services/models/tagsModel";

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export type Tag = {
  _id: string;
  name: string;
  color: string;
  createdAt: string;
  contactCount?: number;
};

/** Subset of CustomBadge variants offered as tag colors. */
export const TAG_COLORS: BadgeVariant[] = [
  "primary", "blue", "success", "warning", "violet",
  "sky", "orange", "teal", "purple", "emerald",
];

interface TagBadgeProps {
  tag: Pick<Tag, "name" | "color">;
  className?: string;
  onRemove?: () => void;
}

export const TagBadge = ({ tag, className, onRemove }: TagBadgeProps) => (
  <CustomBadge
    variant={(tag.color as BadgeVariant) || "neutral"}
    className={cn(onRemove && "pr-1 gap-1", className)}
  >
    {tag.name}
    {onRemove && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="hover:opacity-70"
      >
        <X className="size-3" />
      </button>
    )}
  </CustomBadge>
);

interface TagSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  className?: string;
  /** Allows typing a name that doesn't exist yet and creating it inline. */
  allowCreate?: boolean;
}

/**
 * Reusable multi-select for tags, with inline tag creation — shared by
 * contact add/edit, CSV import's "Assign Tags" step, bulk actions, the
 * dynamic/static group dialog, and the campaign audience builder.
 */
export const TagSelector = ({
  selectedIds,
  onChange,
  className,
  allowCreate = true,
}: TagSelectorProps) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    apiTags.getAll!(ctrl.signal, true).then((res) => {
      if (Array.isArray(res)) setTags(res);
      setLoading(false);
    });
    return () => ctrl.abort();
  }, []);

  const toggle = (id: string) =>
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id],
    );

  const filtered = tags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  const exactMatch = tags.some(
    (t) => t.name.toLowerCase() === search.trim().toLowerCase(),
  );

  const handleCreate = async () => {
    const name = search.trim();
    if (!name || creating) return;
    setCreating(true);
    const res = await apiTags.post!({ name }, "", true);
    setCreating(false);
    if (res?._id) {
      setTags((prev) => [...prev, res]);
      onChange([...selectedIds, res._id]);
      setSearch("");
    }
  };

  const selectedTags = tags.filter((t) => selectedIds.includes(t._id));

  return (
    <div className={cn("space-y-2", className)}>
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((t) => (
            <TagBadge key={t._id} tag={t} onRemove={() => toggle(t._id)} />
          ))}
        </div>
      )}
      <Input
        placeholder="Search or create a tag…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && allowCreate && search.trim() && !exactMatch) {
            e.preventDefault();
            handleCreate();
          }
        }}
        className="h-8 text-sm"
      />
      <div className="border rounded-md overflow-y-auto max-h-40">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Loading tags…
          </p>
        ) : (
          <>
            {filtered.map((t) => (
              <label
                key={t._id}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50 cursor-pointer border-b last:border-0"
              >
                <span
                  className={cn(
                    "flex items-center justify-center size-4 rounded border shrink-0",
                    selectedIds.includes(t._id) && "bg-primary border-primary",
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    toggle(t._id);
                  }}
                >
                  {selectedIds.includes(t._id) && (
                    <Check className="size-3 text-primary-foreground" />
                  )}
                </span>
                <TagBadge tag={t} />
                {typeof t.contactCount === "number" && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {t.contactCount}
                  </span>
                )}
              </label>
            ))}
            {filtered.length === 0 && !search && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No tags yet
              </p>
            )}
            {allowCreate && search.trim() && !exactMatch && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-primary/5 disabled:opacity-50"
              >
                <Plus className="size-3.5" />
                Create "{search.trim()}"
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
