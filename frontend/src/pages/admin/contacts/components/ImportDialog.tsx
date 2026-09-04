import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CustomModal } from "@/components/custom";
import { TagSelector } from "@/components/common";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importing: boolean;
  onImport: (file: File, tagIds: string[], autoTagNiche: boolean) => void;
}

/**
 * CSV import with an optional "Assign Tags" step (req #2): pick a file, then
 * choose existing tags (or create new ones inline) to apply to every
 * imported contact, plus an "auto-tag from niche" option that turns each
 * row's niche value into its own tag.
 */
const ImportDialog = ({ open, onOpenChange, importing, onImport }: ImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [autoTagNiche, setAutoTagNiche] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setTagIds([]);
    setAutoTagNiche(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = () => {
    if (!file) return;
    onImport(file, tagIds, autoTagNiche);
  };

  return (
    <CustomModal
      title="Import Contacts"
      size="md"
      open={open}
      onOpenChange={handleOpenChange}
      disableOutsideClose
    >
      <div className="space-y-5 pt-1">
        <div className="space-y-1.5">
          <Label>CSV File</Label>
          {file ? (
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileSpreadsheet className="size-4 text-primary shrink-0" />
                <span className="text-sm truncate">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-muted-foreground hover:text-destructive shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4" /> Choose CSV file
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </Button>
          )}
        </div>

        <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
          <Label>
            Assign Tags{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <p className="text-xs text-muted-foreground -mt-1">
            Every imported contact will receive the tags you select here.
          </p>
          <TagSelector selectedIds={tagIds} onChange={setTagIds} />
          <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
            <Checkbox
              checked={autoTagNiche}
              onCheckedChange={(v) => setAutoTagNiche(v === true)}
            />
            <span className="text-sm">
              Also auto-create a tag from each row's <strong>niche</strong> column
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={importing} disabled={!file}>
            Import
          </Button>
        </div>
      </div>
    </CustomModal>
  );
};

export default ImportDialog;
