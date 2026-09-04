import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  SerializedEditorState,
  LexicalEditor,
  $getSelection,
  $isRangeSelection,
  $getRoot,
} from "lexical";
import { CalendarClock, AlertTriangle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomModal } from "@/components/custom";
import { AssignedToSelect } from "@/components/common";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DatePicker, TimePicker } from "@/components/custom";
import { Editor } from "@/components/blocks/editor-00/editor";
import { apiEmailSends } from "@/services/models/emailSendsModel";
import { apiContacts } from "@/services/models/contactsModel";
import { apiTags } from "@/services/models/tagsModel";
import { apiProvider } from "@/services/utilities/provider";
import { EmailGroup, EmailTemplate, SendEmailResult } from "../types";
import AudienceBuilder, { Audience } from "./AudienceBuilder";
import RecipientPreview from "./RecipientPreview";

interface Contact {
  _id: string;
  name: string;
  email: string;
}

interface SendEmailDialogProps {
  templates: EmailTemplate[];
  groups: EmailGroup[];
  trigger: React.ReactNode;
  onSent: () => void;
}

type ContentSource = "template" | "custom";
type ScheduleMode = "now" | "later";

const emptyAudience = (): Audience => ({
  contactIds: new Set(),
  groupIds: new Set(),
  tagIds: [],
  tagMatch: "any",
  excludeTagIds: [],
});

const SendEmailDialog = ({
  templates,
  groups,
  trigger,
  onSent,
}: SendEmailDialogProps) => {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  const [contentSource, setContentSource] = useState<ContentSource>("custom");
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [audience, setAudience] = useState<Audience>(emptyAudience());
  const [allTags, setAllTags] = useState<{ _id: string; name: string }[]>([]);
  const [preview, setPreview] = useState<{ total: number; withEmail: number } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("now");
  const [sendDate, setSendDate] = useState("");
  const [sendTime, setSendTime] = useState("09:00");

  // Optional pipeline/lead details — emailing a contact creates a Lead.
  const [leadTitleChoice, setLeadTitleChoice] = useState(""); // "", preset, or "other"
  const [leadTitleCustom, setLeadTitleCustom] = useState("");
  const [leadValue, setLeadValue] = useState("");
  const [leadCurrency, setLeadCurrency] = useState("USD");
  const [leadAssignedTo, setLeadAssignedTo] = useState("");
  const [leadExpectedClose, setLeadExpectedClose] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failures, setFailures] = useState<SendEmailResult[]>([]);

  // For inserting {{placeholders}} into whichever field is focused.
  const subjectRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<LexicalEditor | null>(null);
  const [activeField, setActiveField] = useState<"subject" | "body">("subject");

  const PLACEHOLDERS = [
    "{{name}}",
    "{{email}}",
    "{{company}}",
    "{{jobTitle}}",
    "{{date}}",
  ];

  const insertIntoSubject = (token: string) => {
    const el = subjectRef.current;
    if (!el) {
      setSubject((s) => s + token);
      return;
    }
    const start = el.selectionStart ?? subject.length;
    const end = el.selectionEnd ?? subject.length;
    const next = subject.slice(0, start) + token + subject.slice(end);
    setSubject(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const insertIntoBody = (token: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    editor.update(() => {
      let sel = $getSelection();
      if (!$isRangeSelection(sel)) {
        $getRoot().selectEnd();
        sel = $getSelection();
      }
      if ($isRangeSelection(sel)) sel.insertText(token);
    });
  };

  const insertPlaceholder = (token: string) => {
    if (activeField === "subject") insertIntoSubject(token);
    else insertIntoBody(token);
  };

  const resetState = () => {
    setContentSource("custom");
    setTemplateId("");
    setSubject("");
    setBody("");
    setAudience(emptyAudience());
    setPreview(null);
    setScheduleMode("now");
    setSendDate("");
    setSendTime("09:00");
    setLeadTitleChoice("");
    setLeadTitleCustom("");
    setLeadValue("");
    setLeadCurrency("USD");
    setLeadAssignedTo("");
    setLeadExpectedClose("");
    setErrors({});
    setFailures([]);
  };

  const handleOpen = (v: boolean) => {
    setOpen(v);
    if (v) {
      resetState();
      setLoadingContacts(true);
      apiContacts
        .getByParams!({ limit: 500 }, new AbortController().signal, "", true)
        .then((res) => {
          if (res?.data) setContacts(res.data);
          setLoadingContacts(false);
        });
      apiTags.getAll!(new AbortController().signal, true).then((res) => {
        if (Array.isArray(res)) setAllTags(res);
      });
    }
  };

  const handleTemplatePick = (id: string) => {
    setTemplateId(id);
    const tmpl = templates.find((t) => t._id === id);
    if (tmpl) {
      setSubject(tmpl.subject);
      setBody(tmpl.body);
    }
  };

  const updateAudience = (patch: Partial<Audience>) =>
    setAudience((prev) => ({ ...prev, ...patch }));

  // Live recipient-count preview (req #14), debounced on every audience change.
  useEffect(() => {
    if (!open) return;
    const hasSelection =
      audience.contactIds.size > 0 ||
      audience.groupIds.size > 0 ||
      audience.tagIds.length > 0;
    if (!hasSelection) {
      setPreview(null);
      return;
    }
    setPreviewLoading(true);
    const timer = setTimeout(() => {
      apiProvider
        .post(
          "contacts/audience-count",
          {
            contactIds: [...audience.contactIds],
            groupIds: [...audience.groupIds],
            tagIds: audience.tagIds,
            tagMatch: audience.tagMatch,
            excludeTagIds: audience.excludeTagIds,
          },
          "",
          true,
        )
        .then((res) => {
          if (typeof res?.total === "number") {
            setPreview({ total: res.total, withEmail: res.withEmail ?? res.total });
          }
        })
        .finally(() => setPreviewLoading(false));
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    audience.contactIds,
    audience.groupIds,
    audience.tagIds,
    audience.tagMatch,
    audience.excludeTagIds,
  ]);

  const handleSubmit = async () => {
    const newErrors: Record<string, string> = {};
    if (contentSource === "template" && !templateId)
      newErrors.template = "Select a template";
    if (!subject.trim()) newErrors.subject = "Subject is required";
    if (!body) newErrors.body = "Email body is required";
    if (
      audience.contactIds.size === 0 &&
      audience.groupIds.size === 0 &&
      audience.tagIds.length === 0
    )
      newErrors.recipients = "Add at least one contact, group, or tag";
    if (scheduleMode === "later" && (!sendDate || !sendTime))
      newErrors.schedule = "Pick a date and time";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSending(true);
    setFailures([]);

    const payload = {
      sourceType: contentSource,
      templateId: contentSource === "template" ? templateId : undefined,
      subject,
      body,
      recipientMode: "audience",
      audience: {
        contactIds: [...audience.contactIds],
        groupIds: [...audience.groupIds],
        tagIds: audience.tagIds,
        tagMatch: audience.tagMatch,
        excludeTagIds: audience.excludeTagIds,
      },
      sendDate: scheduleMode === "later" ? sendDate : "",
      sendTime: scheduleMode === "later" ? sendTime : "",
      leadTitle:
        (leadTitleChoice === "other"
          ? leadTitleCustom.trim()
          : leadTitleChoice) || undefined,
      leadValue: leadValue ? Number(leadValue) : undefined,
      leadCurrency: leadCurrency,
      leadAssignedTo: leadAssignedTo || undefined,
      leadExpectedClose: leadExpectedClose
        ? leadExpectedClose + "T00:00:00Z"
        : undefined,
    };

    const res = await apiEmailSends.post!(payload, "", true);
    setSending(false);

    if (res?.scheduled === true) {
      toast.success("Email scheduled");
      onSent();
      setOpen(false);
      return;
    }

    if (res?.scheduled === false) {
      const results: SendEmailResult[] = res.results ?? [];
      const failed = results.filter((r) => !r.success);
      if (failed.length === 0) {
        toast.success("Email sent");
        onSent();
        setOpen(false);
      } else if (failed.length === results.length) {
        toast.error("Failed to send — see details below");
        setFailures(failed);
      } else {
        toast.error(
          `Sent to ${results.length - failed.length} of ${results.length} recipients — some failed`,
        );
        setFailures(failed);
        onSent();
      }
      return;
    }

    toast.error(res?.message ?? "Failed to send email");
  };

  return (
    <CustomModal
      open={open}
      onOpenChange={handleOpen}
      title="Send Email"
      trigger={trigger}
      size="xl"
      contentClassName="max-h-[90vh] overflow-y-auto"
      disableOutsideClose
    >
      <div className="space-y-5 pt-1">
        {/* Content source */}
        <div className="space-y-3">
          <Label>Content</Label>
          <RadioGroup
            value={contentSource}
            className="w-fit flex gap-4"
            onValueChange={(v) => setContentSource(v as ContentSource)}
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem value="custom" id="content-custom" />
              <Label htmlFor="content-custom">Custom Email</Label>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="template" id="content-template" />
              <Label htmlFor="content-template">Use Template</Label>
            </div>
          </RadioGroup>

          {contentSource === "template" && (
            <div className="space-y-1">
              <Select value={templateId} onValueChange={handleTemplatePick}>
                <SelectTrigger
                  className={errors.template ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select a template…" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t._id} value={t._id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.template && (
                <p className="text-xs text-destructive">{errors.template}</p>
              )}
            </div>
          )}
        </div>

        {/* Recipients */}
        <div className="space-y-3">
          <Label>Recipients</Label>
          <AudienceBuilder
            contacts={contacts}
            loadingContacts={loadingContacts}
            groups={groups}
            value={audience}
            onChange={updateAudience}
            error={errors.recipients}
          />
          <RecipientPreview
            loading={previewLoading}
            total={preview?.total ?? null}
            withEmail={preview?.withEmail ?? null}
            contactCount={audience.contactIds.size}
            groupNames={groups
              .filter((g) => audience.groupIds.has(g._id))
              .map((g) => g.name)}
            tagNames={allTags
              .filter((t) => audience.tagIds.includes(t._id))
              .map((t) => t.name)}
          />
        </div>

        {/* Placeholders — click to insert into the focused field */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">
              Insert placeholder:
            </span>
            {PLACEHOLDERS.map((p) => (
              <button
                key={p}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // keep focus/cursor in the active field
                  insertPlaceholder(p);
                }}
                className="rounded border bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                {p}
              </button>
            ))}
            <span className="text-xs text-muted-foreground">
              → adds to {activeField === "subject" ? "Subject" : "Body"}
            </span>
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-1">
          <Label>Subject</Label>
          <Input
            ref={subjectRef}
            placeholder="ex: Your weekly summary"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            onFocus={() => setActiveField("subject")}
            className={errors.subject ? "border-destructive" : ""}
          />
          {errors.subject && (
            <p className="text-xs text-destructive">{errors.subject}</p>
          )}
        </div>

        {/* Body */}
        <div className="space-y-1">
          <Label>Email Body</Label>
          <div onFocusCapture={() => setActiveField("body")}>
            <Editor
              key={`${contentSource}-${templateId}`}
              editorSerializedState={(() => {
                try {
                  return body
                    ? (JSON.parse(body) as SerializedEditorState)
                    : undefined;
                } catch {
                  return undefined;
                }
              })()}
              onSerializedChange={(s) => setBody(JSON.stringify(s))}
              onEditorMount={(editor) => (editorRef.current = editor)}
            />
          </div>
          {errors.body && (
            <p className="text-xs text-destructive">{errors.body}</p>
          )}
        </div>

        {/* Schedule */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CalendarClock className="h-4 w-4 text-primary" /> Schedule
          </div>
          <RadioGroup
            value={scheduleMode}
            className="w-fit flex gap-4"
            onValueChange={(v) => setScheduleMode(v as ScheduleMode)}
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem value="now" id="schedule-now" />
              <Label htmlFor="schedule-now">Send Now</Label>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="later" id="schedule-later" />
              <Label htmlFor="schedule-later">Schedule for later</Label>
            </div>
          </RadioGroup>
          {scheduleMode === "later" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Send Date</Label>
                <DatePicker
                  value={sendDate}
                  onChange={setSendDate}
                  error={!!errors.schedule}
                />
              </div>
              <div className="space-y-1">
                <Label>Send Time</Label>
                <TimePicker
                  value={sendTime}
                  onChange={setSendTime}
                  error={!!errors.schedule}
                />
              </div>
              {errors.schedule && (
                <p className="text-xs text-destructive col-span-2">
                  {errors.schedule}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Pipeline / Lead details — emailing a contact creates a Lead */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4 text-primary" /> Pipeline / Lead details
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Each contact you email becomes a Lead in the pipeline. These fields
            are optional — leave blank to default the title to the contact's
            name and value to 0.
          </p>
          <div className="space-y-1">
            <Label>Deal Title</Label>
            <Select
              value={leadTitleChoice}
              onValueChange={setLeadTitleChoice}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a deal type…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AI-Automation">AI-Automation</SelectItem>
                <SelectItem value="Textile">Textile</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {leadTitleChoice === "other" && (
              <Input
                className="mt-2"
                placeholder="Enter a custom deal title"
                value={leadTitleCustom}
                onChange={(e) => setLeadTitleCustom(e.target.value)}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Value</Label>
              <Input
                type="number"
                placeholder="0"
                value={leadValue}
                onChange={(e) => setLeadValue(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Currency</Label>
              <Select value={leadCurrency} onValueChange={setLeadCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["USD", "EUR", "GBP", "JPY", "CAD", "AUD"].map((cur) => (
                    <SelectItem key={cur} value={cur}>
                      {cur}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Expected Close</Label>
              <DatePicker
                value={leadExpectedClose}
                onChange={setLeadExpectedClose}
              />
            </div>
            <div className="space-y-1">
              <Label>Assigned To</Label>
              <AssignedToSelect
                value={leadAssignedTo}
                onChange={setLeadAssignedTo}
              />
            </div>
          </div>
        </div>

        {/* Failures */}
        {failures.length > 0 && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" /> Some sends failed
            </div>
            <ul className="space-y-1">
              {failures.map((f) => (
                <li key={f.contactId} className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {f.contactName || f.contactEmail}
                  </span>{" "}
                  ({f.contactEmail}): {f.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={sending}>
            {scheduleMode === "later" ? "Schedule Email" : "Send Email"}
          </Button>
        </div>
      </div>
    </CustomModal>
  );
};

export default SendEmailDialog;
