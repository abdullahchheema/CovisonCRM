import { useState } from "react";
import { Plus, X, Users, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagSelector } from "@/components/common";
import { EmailGroup, TagMatch } from "../types";

interface Contact {
  _id: string;
  name: string;
  email: string;
}

export interface Audience {
  contactIds: Set<string>;
  groupIds: Set<string>;
  tagIds: string[];
  tagMatch: TagMatch;
  excludeTagIds: string[];
}

interface AudienceBuilderProps {
  contacts: Contact[];
  loadingContacts: boolean;
  groups: EmailGroup[];
  value: Audience;
  onChange: (patch: Partial<Audience>) => void;
  error?: string;
}

/**
 * Additive campaign-audience builder (req #6, #13): stack any combination of
 * individual contacts, groups (static or dynamic), and tag rules — plus an
 * exclude-tags list — instead of forcing a single recipient method per send.
 */
const AudienceBuilder = ({
  contacts,
  loadingContacts,
  groups,
  value,
  onChange,
  error,
}: AudienceBuilderProps) => {
  const [contactSearch, setContactSearch] = useState("");

  const toggleContact = (id: string) => {
    const next = new Set(value.contactIds);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange({ contactIds: next });
  };
  const toggleGroup = (id: string) => {
    const next = new Set(value.groupIds);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange({ groupIds: next });
  };

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(contactSearch.toLowerCase()),
  );

  const selectedContacts = contacts.filter((c) => value.contactIds.has(c._id));
  const selectedGroups = groups.filter((g) => value.groupIds.has(g._id));

  const hasAny =
    value.contactIds.size > 0 ||
    value.groupIds.size > 0 ||
    value.tagIds.length > 0 ||
    value.excludeTagIds.length > 0;

  return (
    <div className={`space-y-3 ${error ? "rounded-md border border-destructive p-3" : ""}`}>
      {/* Selected chips */}
      {hasAny && (
        <div className="flex flex-wrap gap-1.5">
          {selectedContacts.map((c) => (
            <Chip key={c._id} label={c.name} onRemove={() => toggleContact(c._id)} />
          ))}
          {selectedGroups.map((g) => (
            <Chip
              key={g._id}
              label={`Group: ${g.name}`}
              icon={<FolderKanban className="size-3" />}
              onRemove={() => toggleGroup(g._id)}
            />
          ))}
          {value.tagIds.length > 0 && (
            <Chip
              label={`Tags (${value.tagMatch}): ${value.tagIds.length} selected`}
              onRemove={() => onChange({ tagIds: [] })}
            />
          )}
          {value.excludeTagIds.length > 0 && (
            <Chip
              label={`Exclude: ${value.excludeTagIds.length} tag(s)`}
              onRemove={() => onChange({ excludeTagIds: [] })}
            />
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {/* + Contacts */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Plus className="size-3.5" /> Contacts
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-2" align="start">
            <Input
              placeholder="Search contacts…"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              className="h-8 text-sm"
            />
            <div className="border rounded-md overflow-y-auto max-h-52">
              {loadingContacts ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Loading contacts…
                </p>
              ) : filteredContacts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No contacts found
                </p>
              ) : (
                filteredContacts.map((c) => (
                  <label
                    key={c._id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b last:border-0"
                  >
                    <Checkbox
                      checked={value.contactIds.has(c._id)}
                      onCheckedChange={() => toggleContact(c._id)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* + Groups */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Plus className="size-3.5" /> Groups
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-1" align="start">
            {groups.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No groups yet
              </p>
            ) : (
              <div className="border rounded-md overflow-y-auto max-h-52">
                {groups.map((g) => (
                  <label
                    key={g._id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer border-b last:border-0"
                  >
                    <Checkbox
                      checked={value.groupIds.has(g._id)}
                      onCheckedChange={() => toggleGroup(g._id)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{g.name}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                      <Users className="size-3" /> {g.contactCount ?? g.contactIds?.length ?? 0}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* + Tags */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Plus className="size-3.5" /> Tags
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 space-y-2" align="start">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Has tags</Label>
              <Select
                value={value.tagMatch}
                onValueChange={(v) => onChange({ tagMatch: v as TagMatch })}
              >
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
              selectedIds={value.tagIds}
              onChange={(ids) => onChange({ tagIds: ids })}
              allowCreate={false}
            />
          </PopoverContent>
        </Popover>

        {/* − Exclude tags */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <X className="size-3.5" /> Exclude tags
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 space-y-2" align="start">
            <Label className="text-xs">Exclude contacts tagged</Label>
            <TagSelector
              selectedIds={value.excludeTagIds}
              onChange={(ids) => onChange({ excludeTagIds: ids })}
              allowCreate={false}
            />
          </PopoverContent>
        </Popover>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default AudienceBuilder;

const Chip = ({
  label,
  icon,
  onRemove,
}: {
  label: string;
  icon?: React.ReactNode;
  onRemove: () => void;
}) => (
  <span className="inline-flex items-center gap-1 rounded-full border bg-muted/40 pl-2.5 pr-1 py-0.5 text-xs">
    {icon}
    <span className="font-medium">{label}</span>
    <button
      type="button"
      onClick={onRemove}
      title="Remove"
      className="text-muted-foreground hover:text-destructive transition-colors"
    >
      <X className="size-3" />
    </button>
  </span>
);
