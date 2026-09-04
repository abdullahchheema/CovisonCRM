import { Users } from "lucide-react";

interface RecipientPreviewProps {
  loading: boolean;
  total: number | null;
  withEmail: number | null;
  tagNames: string[];
  groupNames: string[];
  contactCount: number;
}

/** Live "who is this going to" summary (req #14), shown before sending. */
const RecipientPreview = ({
  loading,
  total,
  withEmail,
  tagNames,
  groupNames,
  contactCount,
}: RecipientPreviewProps) => (
  <div className="rounded-lg border bg-primary/[0.03] border-primary/15 p-4 space-y-1.5">
    <div className="flex items-center gap-2 text-sm font-medium">
      <Users className="size-4 text-primary" />
      Recipients:{" "}
      <span className="text-primary tabular-nums">
        {loading ? "…" : total ?? 0}
      </span>
      {!loading && withEmail !== null && withEmail !== total && (
        <span className="text-xs text-muted-foreground font-normal">
          ({withEmail} with an email address)
        </span>
      )}
    </div>
    <div className="text-xs text-muted-foreground space-x-3">
      {contactCount > 0 && <span>Individual contacts: {contactCount}</span>}
      {groupNames.length > 0 && <span>Groups: {groupNames.join(", ")}</span>}
      {tagNames.length > 0 && <span>Tags: {tagNames.join(", ")}</span>}
    </div>
  </div>
);

export default RecipientPreview;
