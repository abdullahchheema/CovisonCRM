import { useEffect, useState } from "react";
import { SerializedEditorState } from "lexical";
import { Mail, ChevronDown, ChevronUp, X } from "lucide-react";
import toast from "react-hot-toast";
import { CustomModal } from "@/components/custom";
import { StatusBadge } from "@/components/common";
import { Editor } from "@/components/blocks/editor-00/editor";
import { apiEmailSends } from "@/services/models/emailSendsModel";
import { SentEmail, SentEmailSummary } from "../types";

interface SentEmailHistoryPanelProps {
  contact: SentEmailSummary | null;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}

const HistoryItem = ({
  send,
  onDelete,
}: {
  send: SentEmail;
  onDelete: (send: SentEmail) => void;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-md p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{send.subject}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(send.sentAt).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <StatusBadge value={send.status} />
          <StatusBadge value={send.sourceType} />
          <StatusBadge value={send.recipientMode} />
          <button
            type="button"
            onClick={() => onDelete(send)}
            title="Delete this send"
            className="text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {send.status === "failed" && send.errorMessage && (
        <p className="text-xs text-destructive">{send.errorMessage}</p>
      )}

      {(send.sourceTemplateName || send.groupName) && (
        <p className="text-xs text-muted-foreground">
          {send.sourceTemplateName && (
            <span>Template: {send.sourceTemplateName}</span>
          )}
          {send.sourceTemplateName && send.groupName && " · "}
          {send.groupName && <span>Group: {send.groupName}</span>}
        </p>
      )}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs text-primary hover:underline"
      >
        {expanded ? (
          <>
            Hide content <ChevronUp className="size-3" />
          </>
        ) : (
          <>
            Show content <ChevronDown className="size-3" />
          </>
        )}
      </button>

      {expanded && (
        <Editor
          key={send._id}
          editorSerializedState={(() => {
            try {
              return send.body
                ? (JSON.parse(send.body) as SerializedEditorState)
                : undefined;
            } catch {
              return undefined;
            }
          })()}
        />
      )}
    </div>
  );
};

const SentEmailHistoryPanel = ({
  contact,
  open,
  onClose,
  onChanged,
}: SentEmailHistoryPanelProps) => {
  const [history, setHistory] = useState<SentEmail[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contact?.contactId || !open) return;
    setHistory([]);
    setLoading(true);
    const controller = new AbortController();
    apiEmailSends
      .getByParams!({}, controller.signal, `${contact.contactId}/history`, true)
      .then((res) => {
        if (Array.isArray(res)) setHistory(res);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [contact?.contactId, open]);

  const handleDelete = async (send: SentEmail) => {
    if (!contact) return;
    const res = await apiEmailSends.remove!(
      send._id,
      `${contact.contactId}/history`,
      true,
    );
    if (res?.message === "Send deleted") {
      const remaining = history.filter((h) => h._id !== send._id);
      setHistory(remaining);
      toast.success("Send deleted");
      onChanged();
      if (remaining.length === 0) onClose();
    } else {
      toast.error(res?.message ?? "Failed to delete send");
    }
  };

  if (!contact) return null;

  return (
    <CustomModal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title={contact.contactName}
      size="xl"
      contentClassName="max-h-[90vh] overflow-y-auto"
      disableOutsideClose
    >
      <div className="space-y-4 pt-1">
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Mail className="size-3" /> {contact.contactEmail}
        </p>

        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              Loading…
            </div>
          ) : history.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              No emails sent to this contact yet
            </div>
          ) : (
            history.map((send) => (
              <HistoryItem
                key={send._id}
                send={send}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </div>
    </CustomModal>
  );
};

export default SentEmailHistoryPanel;
