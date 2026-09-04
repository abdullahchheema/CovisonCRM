import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Tags as TagsIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PageHeader,
  PageSpinner,
  CustomEmptyState,
  CustomModal,
  EditIconButton,
  DeleteIconButton,
} from "@/components/custom";
import { confirmToast } from "@/utils/confirmToast";
import { apiTags } from "@/services/models/tagsModel";
import usePermissions from "@/hooks/usePermissions";
import { TagBadge, TAG_COLORS, type Tag, type BadgeVariant } from "@/components/common";
import { cn } from "@/lib/utils";

const TagsPage = () => {
  const { has } = usePermissions();
  const canEdit = has("contacts-edit");
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    apiTags.getAll!(ctrl.signal, true).then((res) => {
      if (Array.isArray(res)) setTags(res);
      setIsLoading(false);
    });
    return () => ctrl.abort();
  }, []);

  const handleDelete = (tag: Tag) => {
    confirmToast({
      title: `Delete "${tag.name}"?`,
      description: `This removes the tag from ${tag.contactCount ?? 0} contact(s). This can't be undone.`,
      onConfirm: async () => {
        const res = await apiTags.remove!(tag._id, "", true);
        if (res?.message === "Tag deleted") {
          setTags((prev) => prev.filter((t) => t._id !== tag._id));
          toast.success("Tag deleted");
        } else {
          toast.error(res?.message ?? "Failed to delete tag");
        }
      },
    });
  };

  const handleCreate = async (name: string, color: string) => {
    const res = await apiTags.post!({ name, color }, "", true);
    if (res?._id) {
      setTags((prev) => [...prev, { ...res, contactCount: 0 }]);
      setShowForm(false);
      toast.success("Tag created");
    } else {
      toast.error(res?.message ?? "Failed to create tag");
    }
  };

  const handleUpdate = async (id: string, name: string, color: string) => {
    const res = await apiTags.putById!(id, { name, color }, new AbortController().signal, "", true);
    if (res?._id) {
      setTags((prev) => prev.map((t) => (t._id === id ? { ...t, name: res.name, color: res.color } : t)));
      setEditingTag(null);
      toast.success("Tag updated");
    } else {
      toast.error(res?.message ?? "Failed to update tag");
    }
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Tags"
        description="Manage the tags used to segment contacts and target campaigns"
        isBackButton
        actions={
          canEdit && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="size-4" /> New Tag
            </Button>
          )
        }
      />

      <CustomModal
        title="New Tag"
        size="sm"
        open={showForm}
        onOpenChange={(open) => !open && setShowForm(false)}
      >
        <TagForm submitLabel="Create" onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      </CustomModal>

      <CustomModal
        title="Edit Tag"
        size="sm"
        open={!!editingTag}
        onOpenChange={(open) => !open && setEditingTag(null)}
      >
        {editingTag && (
          <TagForm
            submitLabel="Save"
            initialName={editingTag.name}
            initialColor={editingTag.color}
            onSubmit={(name, color) => handleUpdate(editingTag._id, name, color)}
            onCancel={() => setEditingTag(null)}
          />
        )}
      </CustomModal>

      {isLoading ? (
        <PageSpinner />
      ) : tags.length === 0 ? (
        <CustomEmptyState
          className="py-20"
          icon={TagsIcon}
          title="No tags yet"
          description="Create tags to segment contacts by niche, lead type, or campaign — then filter and target them in bulk."
          action={
            canEdit && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="size-4" /> Create First Tag
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {tags.map((tag) => (
            <div
              key={tag._id}
              className="flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <TagBadge tag={tag} />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm text-muted-foreground tabular-nums">
                  {tag.contactCount ?? 0} contact{tag.contactCount === 1 ? "" : "s"}
                </span>
                {canEdit && (
                  <div className="flex items-center gap-1">
                    <EditIconButton onClick={() => setEditingTag(tag)} />
                    <DeleteIconButton onClick={() => handleDelete(tag)} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default TagsPage;

const TagForm = ({
  submitLabel,
  initialName = "",
  initialColor = TAG_COLORS[0],
  onSubmit,
  onCancel,
}: {
  submitLabel: string;
  initialName?: string;
  initialColor?: string;
  onSubmit: (name: string, color: string) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(initialColor);
  const [error, setError] = useState("");

  const submit = () => {
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    onSubmit(name.trim(), color);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label>Tag Name</Label>
        <Input
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          placeholder="e.g. Dentist"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2">
          {TAG_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                "rounded-full",
                color === c && "ring-2 ring-ring ring-offset-2 ring-offset-background",
              )}
            >
              <TagBadge tag={{ name: c, color: c as BadgeVariant }} />
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={submit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
};
